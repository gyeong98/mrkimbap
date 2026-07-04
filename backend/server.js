const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");
require("dotenv").config();

const pool = require("./db");

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const TAX_RATE_PERCENT = 9.025;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_DIGIT_COUNT = 10;

function calculateTaxCents(subtotalCents) {
  return Math.round((subtotalCents * TAX_RATE_PERCENT) / 100);
}

function requireAdmin(req, res, next) {
  const adminToken = process.env.ADMIN_TOKEN;

  if (!adminToken) {
    return res.status(503).json({
      error: "Admin access is not configured",
      details: "Set ADMIN_TOKEN in the backend environment to enable admin endpoints.",
    });
  }

  if (req.get("x-admin-token") !== adminToken) {
    return res.status(401).json({ error: "Invalid admin token" });
  }

  return next();
}

function normalizeDateInput(date) {
  return typeof date === "string" ? date.slice(0, 10) : "";
}

function isIsoDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function getPhoneDigits(phoneNumber) {
  return String(phoneNumber || "").replace(/\D/g, "");
}

function isValidEmail(email) {
  return EMAIL_PATTERN.test(String(email || "").trim());
}

app.use(cors());

// Stripe webhook must be BEFORE express.json()
app.post(
  "/api/stripe-webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log("Stripe webhook received:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const client = await pool.connect();

      try {
        await client.query("BEGIN");

        const orderResult = await client.query(
          `
          SELECT id
          FROM orders
          WHERE stripe_session_id = $1
          `,
          [session.id]
        );

        const order = orderResult.rows[0];

        if (!order) {
          throw new Error("Order not found for Stripe session");
        }

        const orderItemsResult = await client.query(
          `
          SELECT item_id, quantity
          FROM order_items
          WHERE order_id = $1
          `,
          [order.id]
        );

        for (const orderItem of orderItemsResult.rows) {
          const updateResult = await client.query(
            `
            UPDATE items
            SET available_quantity = available_quantity - $1
            WHERE id = $2 AND available_quantity >= $1
            RETURNING *
            `,
            [orderItem.quantity, orderItem.item_id]
          );

          if (updateResult.rowCount === 0) {
            throw new Error(`Not enough inventory for item ${orderItem.item_id}`);
          }
        }

        await client.query(
          `
          UPDATE orders
          SET status = 'paid'
          WHERE id = $1
          `,
          [order.id]
        );

        await client.query("COMMIT");

        console.log("Order paid and inventory reduced:", order.id);
      } catch (err) {
        await client.query("ROLLBACK");
        console.error("Inventory update failed:", err.message);
      } finally {
        client.release();
      }
    }

    res.json({ received: true });
  }
);

// Normal JSON routes after webhook
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// app.get("/api/db-test", async (req, res) => {
//   try {
//     const result = await pool.query("SELECT NOW()");
//     res.json(result.rows[0]);
//   } catch (err) {
//     console.error("Database connection failed:", err);
//     res.status(500).json({ error: "Database connection failed" });
//   }
// });

app.get("/api/items", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        description,
        price_cents,
        available_quantity,
        image_url
      FROM items
      WHERE active = TRUE
      ORDER BY id
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch items:", err);
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

app.get("/api/admin/locations", requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, address, hours, active
      FROM locations
      ORDER BY active DESC, name
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch admin locations:", err);
    res.status(500).json({ error: "Failed to fetch locations" });
  }
});

app.get("/api/admin/pickup-dates", requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        pd.id,
        pd.pickup_date,
        pd.active,
        pd.location_id,
        l.name AS location_name,
        l.address AS location_address,
        l.hours AS location_hours,
        l.active AS location_active
      FROM pickup_dates pd
      LEFT JOIN locations l
        ON l.id = pd.location_id
      ORDER BY pd.pickup_date DESC, l.name
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch admin pickup dates:", err);
    res.status(500).json({ error: "Failed to fetch pickup dates" });
  }
});

app.post("/api/admin/pickup-dates", requireAdmin, async (req, res) => {
  try {
    const pickupDate = normalizeDateInput(req.body.pickupDate);
    const locationId = Number(req.body.locationId);
    const active = req.body.active !== false;

    if (!isIsoDate(pickupDate)) {
      return res.status(400).json({ error: "Pickup date must use YYYY-MM-DD format." });
    }

    if (!Number.isInteger(locationId) || locationId <= 0) {
      return res.status(400).json({ error: "Please choose a valid location." });
    }

    const locationResult = await pool.query(
      `
      SELECT id
      FROM locations
      WHERE id = $1 AND active = true
      `,
      [locationId]
    );

    if (locationResult.rowCount === 0) {
      return res.status(400).json({ error: "Please choose an active location." });
    }

    const existingResult = await pool.query(
      `
      SELECT id
      FROM pickup_dates
      WHERE pickup_date = $1::date AND location_id = $2
      LIMIT 1
      `,
      [pickupDate, locationId]
    );

    if (existingResult.rowCount > 0) {
      return res.status(409).json({ error: "That pickup date already exists for this location." });
    }

    const insertResult = await pool.query(
      `
      INSERT INTO pickup_dates (pickup_date, location_id, active)
      VALUES ($1::date, $2, $3)
      RETURNING id, pickup_date, location_id, active
      `,
      [pickupDate, locationId, active]
    );

    res.status(201).json(insertResult.rows[0]);
  } catch (err) {
    console.error("Failed to create pickup date:", err);
    res.status(500).json({ error: "Failed to create pickup date" });
  }
});

app.patch("/api/admin/pickup-dates/:id", requireAdmin, async (req, res) => {
  try {
    const pickupDateId = Number(req.params.id);
    const active = req.body.active;

    if (!Number.isInteger(pickupDateId) || pickupDateId <= 0) {
      return res.status(400).json({ error: "Invalid pickup date id." });
    }

    if (typeof active !== "boolean") {
      return res.status(400).json({ error: "Active must be true or false." });
    }

    const result = await pool.query(
      `
      UPDATE pickup_dates
      SET active = $1
      WHERE id = $2
      RETURNING id, pickup_date, location_id, active
      `,
      [active, pickupDateId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Pickup date not found." });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Failed to update pickup date:", err);
    res.status(500).json({ error: "Failed to update pickup date" });
  }
});

app.get("/api/admin/orders", requireAdmin, async (req, res) => {
  try {
    const orderSort = req.query.sort === "pickup_date" ? "pickup_date" : "order_id";
    const orderByClause =
      orderSort === "pickup_date"
        ? "ORDER BY o.pickup_date DESC, o.id DESC"
        : "ORDER BY o.id DESC";

    const result = await pool.query(`
      SELECT
        o.id,
        o.status,
        o.pickup_date,
        o.customer_name,
        o.customer_email,
        o.customer_phone,
        COALESCE(SUM(oi.quantity), 0)::int AS item_count,
        COALESCE(SUM(oi.quantity * oi.price_cents), 0)::int AS subtotal_cents,
        pickup_location.name AS location_name,
        pickup_location.address AS location_address,
        pickup_location.hours AS location_hours,
        COALESCE(
          json_agg(
            json_build_object(
              'itemId', i.id,
              'name', i.name,
              'quantity', oi.quantity,
              'priceCents', oi.price_cents,
              'lineTotalCents', oi.quantity * oi.price_cents
            )
            ORDER BY i.name
          ) FILTER (WHERE oi.item_id IS NOT NULL),
          '[]'
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi
        ON oi.order_id = o.id
      LEFT JOIN items i
        ON i.id = oi.item_id
      LEFT JOIN LATERAL (
        SELECT l.name, l.address, l.hours
        FROM pickup_dates pd
        JOIN locations l
          ON l.id = pd.location_id
        WHERE pd.pickup_date = o.pickup_date
        ORDER BY pd.active DESC, l.active DESC, l.name
        LIMIT 1
      ) pickup_location
        ON true
      GROUP BY
        o.id,
        o.status,
        o.pickup_date,
        o.customer_name,
        o.customer_email,
        o.customer_phone,
        pickup_location.name,
        pickup_location.address,
        pickup_location.hours
      ${orderByClause}
    `);

    const orders = result.rows.map((order) => {
      const subtotalCents = Number(order.subtotal_cents) || 0;
      const taxCents = calculateTaxCents(subtotalCents);

      return {
        ...order,
        subtotal_cents: subtotalCents,
        tax_cents: taxCents,
        total_cents: subtotalCents + taxCents,
      };
    });

    res.json(orders);
  } catch (err) {
    console.error("Failed to fetch admin orders:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

app.post("/api/create-checkout-session", async (req, res) => {
  const client = await pool.connect();

  try {
    const { customerName, customerEmail, customerPhone, pickupDate, items } = req.body;
    const selectedPickupDate = typeof pickupDate === "string" ? pickupDate.slice(0, 10) : "";
    const normalizedCustomerName = typeof customerName === "string" ? customerName.trim() : "";
    const normalizedCustomerEmail = typeof customerEmail === "string" ? customerEmail.trim() : "";
    const customerPhoneDigits = getPhoneDigits(customerPhone);

    if (!selectedPickupDate || !/^\d{4}-\d{2}-\d{2}$/.test(selectedPickupDate)) {
      return res.status(400).json({ error: "Please select a pickup date." });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Items are required" });
    }

    if (!normalizedCustomerName || !normalizedCustomerEmail) {
      return res.status(400).json({
        error: "Customer name and email are required",
      });
    }

    if (!isValidEmail(normalizedCustomerEmail)) {
      return res.status(400).json({
        error: "Please enter a valid email address.",
      });
    }

    if (customerPhoneDigits.length !== PHONE_DIGIT_COUNT) {
      return res.status(400).json({
        error: `Customer phone must be ${PHONE_DIGIT_COUNT} digits`,
      });
    }

    const pickupDateResult = await client.query(
      `
      SELECT id
      FROM pickup_dates
      WHERE pickup_date = $1::date
        AND pickup_date > CURRENT_DATE
        AND active = true
      LIMIT 1
      `,
      [selectedPickupDate]
    );

    if (pickupDateResult.rowCount === 0) {
      return res.status(400).json({ error: "Please select an available pickup date." });
    }

    await client.query("BEGIN");

    const checkoutLineItems = [];
    const orderItems = [];
    let subtotalCents = 0;

    for (const cartItem of items) {
      const { itemId, quantity } = cartItem;

      if (!itemId || !quantity || quantity <= 0) {
        throw new Error("Invalid item or quantity");
      }

      const itemResult = await client.query(
        "SELECT * FROM items WHERE id = $1",
        [itemId]
      );

      const item = itemResult.rows[0];

      if (!item) {
        throw new Error(`Item not found: ${itemId}`);
      }

      if (item.available_quantity < quantity) {
        throw new Error(`Not enough inventory for ${item.name}`);
      }

      subtotalCents += item.price_cents * quantity;

      checkoutLineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
            description: item.description || undefined,
          },
          unit_amount: item.price_cents,
        },
        quantity,
      });

      orderItems.push({
        itemId: item.id,
        quantity,
        priceCents: item.price_cents,
      });
    }

    const taxCents = calculateTaxCents(subtotalCents);
    const totalCents = subtotalCents + taxCents;

    if (taxCents > 0) {
      checkoutLineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: `Tax (${TAX_RATE_PERCENT}%)`,
            description: "10% tax on goods",
          },
          unit_amount: taxCents,
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: checkoutLineItems,
      metadata: {
        pickup_date: selectedPickupDate,
        subtotal_cents: String(subtotalCents),
        tax_rate_percent: String(TAX_RATE_PERCENT),
        tax_cents: String(taxCents),
        total_cents: String(totalCents),
      },
      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    });

    const orderResult = await client.query(
      `
      INSERT INTO orders 
      (stripe_session_id, status, pickup_date, customer_name, customer_email, customer_phone)
      VALUES ($1, 'pending', $2, $3, $4, $5)
      RETURNING id
      `,
      [session.id, selectedPickupDate, normalizedCustomerName, normalizedCustomerEmail, customerPhoneDigits]
    );

    const orderId = orderResult.rows[0].id;

    for (const orderItem of orderItems) {
      await client.query(
        `
        INSERT INTO order_items
        (order_id, item_id, quantity, price_cents)
        VALUES ($1, $2, $3, $4)
        `,
        [
          orderId,
          orderItem.itemId,
          orderItem.quantity,
          orderItem.priceCents,
        ]
      );
    }

    await client.query("COMMIT");

    res.json({ url: session.url });
  } catch (err) {
    await client.query("ROLLBACK");

    console.error("Failed to create checkout session:", err);

    res.status(500).json({
      error: "Failed to create checkout session",
      details: err.message,
    });
  } finally {
    client.release();
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get("/api/pickup-dates", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        pd.id,
        pd.pickup_date,
        pd.location_id,
        l.name AS location_name,
        l.address AS location_address,
        l.hours AS location_hours
      FROM pickup_dates pd
      JOIN locations l
        ON l.id = pd.location_id
      WHERE pd.active = true
        AND pd.pickup_date > CURRENT_DATE
        AND l.active = true
      ORDER BY pd.pickup_date, l.name
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to fetch pickup dates",
    });
  }
});
