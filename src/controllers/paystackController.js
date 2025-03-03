const crypto = require("crypto");
const pool = require("../config/db"); // Ensure your DB connection is imported
require('dotenv').config();

exports.paystackWebhook = async (req, res) => {
    try {
        require('dotenv').config(); // Ensure dotenv is loaded
        const secret = process.env.PAYSTACK_SECRET_KEY;

        if (!secret) {
            console.error("⚠️ PAYSTACK_SECRET_KEY is missing in environment variables!");
            return res.status(500).json({ message: "Server misconfiguration" });
        }

        const hash = crypto.createHmac("sha512", secret)
            .update(JSON.stringify(req.body))
            .digest("hex");

        if (hash !== req.headers["x-paystack-signature"]) {
            return res.status(401).json({ message: "Invalid signature" });
        }

        console.log("✅ Webhook received and verified!");
        res.sendStatus(200);
    } catch (error) {
        console.error("⚠️ Error handling Paystack webhook:", error);
        res.status(500).json({ message: "Webhook processing failed" });
    }
};
