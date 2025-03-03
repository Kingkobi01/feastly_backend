const crypto = require("crypto");
const pool = require("../config/db"); // Ensure your DB connection is imported

exports.paystackWebhook = async (req, res) => {
    try {
        const secret = process.env.PAYSTACK_SECRET_KEY; // Ensure this is set in your .env
        const hash = crypto.createHmac("sha512", secret).update(JSON.stringify(req.body)).digest("hex");

        if (hash !== req.headers["x-paystack-signature"]) {
            return res.status(401).json({ message: "Invalid signature" });
        }

        const event = req.body;

        if (event.event === "charge.success") {
            const orderId = event.data.metadata.order_id; // Assuming you send order_id in metadata
            const amountPaid = event.data.amount / 100; // Convert from kobo to actual currency

            // Update order status in DB
            const updateQuery = "UPDATE orders SET status = 'confirmed' WHERE id = ? AND total_price = ?";
            await pool.query(updateQuery, [orderId, amountPaid]);

            console.log(`✅ Order ${orderId} marked as confirmed`);
        }

        res.sendStatus(200);
    } catch (error) {
        console.error("⚠️ Error handling Paystack webhook:", error);
        res.status(500).json({ message: "Webhook processing failed" });
    }
};
