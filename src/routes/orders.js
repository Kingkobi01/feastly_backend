const express = require("express");
const router = express.Router();
const { createOrder, getOrderById, getOrdersByUser, updateOrderStatus } = require("../controllers/orderController");

// Create an order
router.post("/", createOrder);

// Get a specific order by ID
router.get("/:id", getOrderById);

// Get all orders for a user
router.get("/user/:userId", getOrdersByUser);

// Update order status
router.patch("/:id/status", updateOrderStatus);


module.exports = router;
