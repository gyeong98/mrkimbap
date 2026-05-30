const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");
require("dotenv").config();

const pool = require("./db");

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

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

app.get("/api/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Database connection failed:", err);
    res.status(500).json({ error: "Database connection failed" });
  }
});

app.get("/api/items", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, description, price_cents, available_quantity FROM items ORDER BY id"
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch items:", err);
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

app.post("/api/create-checkout-session", async (req, res) => {
  const client = await pool.connect();

  try {
    const { pickupDate, items } = req.body;

    if (!pickupDate) {
      return res.status(400).json({ error: "Pickup date is required" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Items are required" });
    }

    await client.query("BEGIN");

    const checkoutLineItems = [];
    const orderItems = [];

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

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: checkoutLineItems,
      metadata: {
        pickup_date: pickupDate,
      },
      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    });

    const orderResult = await client.query(
      `
      INSERT INTO orders 
      (stripe_session_id, status, pickup_date)
      VALUES ($1, 'pending', $2)
      RETURNING id
      `,
      [session.id, pickupDate]
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