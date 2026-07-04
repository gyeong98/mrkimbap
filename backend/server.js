const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");
require("dotenv").config();

const pool = require("./db");

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const TAX_RATE_PERCENT = 10;

function calculateTaxCents(subtotalCents) {
  return Math.round((subtotalCents * TAX_RATE_PERCENT) / 100);
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

app.post("/api/create-checkout-session", async (req, res) => {
  const client = await pool.connect();

  try {
    const { customerName, customerEmail, pickupDate, items } = req.body;
    const selectedPickupDate = typeof pickupDate === "string" ? pickupDate.slice(0, 10) : "";

    if (!selectedPickupDate || !/^\d{4}-\d{2}-\d{2}$/.test(selectedPickupDate)) {
      return res.status(400).json({ error: "Please select a pickup date." });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Items are required" });
    }

    if (!customerName || !customerEmail) {
      return res.status(400).json({
        error: "Customer name and email are required",
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
      (stripe_session_id, status, pickup_date, customer_name, customer_email)
      VALUES ($1, 'pending', $2, $3, $4)
      RETURNING id
      `,
      [session.id, selectedPickupDate, customerName.trim(), customerEmail.trim()]
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
