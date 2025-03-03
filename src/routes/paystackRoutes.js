const express = require("express");
const { paystackWebhook } = require("../controllers/paystackController");

const router = express.Router();

router.post("/webhook", paystackWebhook);

module.exports = router;
