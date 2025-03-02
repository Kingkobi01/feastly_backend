const { v4: uuidv4 } = require("uuid");
const pool = require("../config/db");
const { sendEmailWithQR } = require("../utils/email");

// Create an order
exports.createOrder = async (req, res) => {
    try {
        const { user_id, restaurant_id, items, total_price, payment_method } = req.body;

        if (!user_id || !restaurant_id || !items || !total_price || !payment_method) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const orderId = uuidv4();
        const status = "pending"; // Default order status
        const created_at = new Date();

        const query = `
            INSERT INTO orders (id, user_id, restaurant_id, items, total_price, status, payment_method, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        `;
        await pool.query(query, [orderId, user_id, restaurant_id, JSON.stringify(items), total_price, status, payment_method, created_at]);

        // Fetch user and restaurant details for email
        const getUserQuery = `
            SELECT users.email, users.name AS user_name, restaurants.name AS restaurant_name 
            FROM users 
            JOIN restaurants ON restaurants.id = ? 
            WHERE users.id = ?;
        `;
        const [rows] = await pool.query(getUserQuery, [restaurant_id, user_id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "User or restaurant not found" });
        }

        const { email, user_name, restaurant_name } = rows[0];

        // Fetch menu item names from the database
        const itemIds = items.map(item => item.id);
        const placeholders = itemIds.map(() => "?").join(","); // Create placeholders for SQL query
        const getMenuItemsQuery = `SELECT id, name FROM menu_items WHERE id IN (${placeholders})`;
        const [menuRows] = await pool.query(getMenuItemsQuery, itemIds);

        // Create a map of item IDs to names
        const itemNameMap = {};
        menuRows.forEach(row => {
            itemNameMap[row.id] = row.name;
        });

        // Format items list for email
        const formattedItems = items.map(item => {
            const itemName = itemNameMap[item.id] || "Unknown Item";
            return `- ${itemName} (x${item.quantity})`;
        }).join("<br>");

        // Email content
        const subject = "Order Confirmation - Feastly";
        const text = `
            <p>Hello <b>${user_name}</b>,</p>
            <p>Your order at <b>${restaurant_name}</b> has been placed successfully! 🍽️</p>
            <p><b>Order Details:</b></p>
            <p>${formattedItems}</p>
            <p><b>Total Price:</b> $${total_price}</p>
            <p>Please show the attached QR code when receiving your order.</p>
            <p>Thank you for choosing Feastly! 🎉</p>
        `;

        // Send email with QR code
        await sendEmailWithQR(email, subject, text, orderId, restaurant_name, JSON.stringify(items), user_name, "order");

        res.status(201).json({
            message: "Order placed successfully",
            order_id: orderId,
            status,
        });
    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get order by ID
exports.getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        const query = "SELECT * FROM orders WHERE id = ?";
        const [rows] = await pool.query(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error("Error fetching order:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get all orders for a specific user
exports.getOrdersByUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const query = "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC";
        const [rows] = await pool.query(query, [userId]);

        res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching user orders:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!["pending", "confirmed", "cancelled", "delivered"].includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        // Get order and user details
        const getOrderQuery = `
            SELECT users.email, users.name AS user_name, orders.items, orders.total_price, restaurants.name AS restaurant_name 
            FROM orders
            JOIN users ON orders.user_id = users.id
            JOIN restaurants ON orders.restaurant_id = restaurants.id
            WHERE orders.id = ?;
        `;
        const [rows] = await pool.query(getOrderQuery, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Order not found" });
        }

        const { email, user_name, items, total_price, restaurant_name } = rows[0];

        // Parse items JSON
        const parsedItems = JSON.parse(items);

        // Get menu item names from the database
        const itemIds = parsedItems.map(item => item.id);
        const placeholders = itemIds.map(() => "?").join(",");
        const getMenuItemsQuery = `SELECT id, name FROM menu_items WHERE id IN (${placeholders})`;
        const [menuRows] = await pool.query(getMenuItemsQuery, itemIds);

        // Create a map of item IDs to names
        const itemNameMap = {};
        menuRows.forEach(row => {
            itemNameMap[row.id] = row.name;
        });

        // Format items list for email
        const formattedItems = parsedItems.map(item => {
            const itemName = itemNameMap[item.id] || "Unknown Item";
            return `- ${itemName} (x${item.quantity})`;
        }).join("<br>");

        // Update the order status
        const updateQuery = "UPDATE orders SET status = ? WHERE id = ?";
        await pool.query(updateQuery, [status, id]);

        // Email content
        let subject = "";
        let text = "";

        if (status === "confirmed") {
            subject = "Your Order is Confirmed! 🍽️";
            text = `
                <p>Hello <b>${user_name}</b>,</p>
                <p>Your order at <b>${restaurant_name}</b> has been confirmed! 🎉</p>
                <p><b>Order Details:</b></p>
                <p>${formattedItems}</p>
                <p><b>Total Price:</b> $${total_price}</p>
                <p>Your food will be on its way soon. Please have your QR code ready when receiving the order.</p>
            `;
        } else if (status === "delivered") {
            subject = "Your Order has been Delivered! 🚀";
            text = `
                <p>Hello <b>${user_name}</b>,</p>
                <p>Your order at <b>${restaurant_name}</b> has been delivered. We hope you enjoy your meal! 🍽️</p>
                <p><b>Order Details:</b></p>
                <p>${formattedItems}</p>
                <p><b>Total Price:</b> $${total_price}</p>
                <p>Thank you for ordering with Feastly! If you enjoyed your meal, leave a review! ⭐</p>
            `;
        } else if (status === "cancelled") {
            subject = "Your Order has been Cancelled ❌";
            text = `
                <p>Hello <b>${user_name}</b>,</p>
                <p>Your order at <b>${restaurant_name}</b> has been cancelled.</p>
                <p>If this was a mistake, you can place another order anytime.</p>
                <p>Thank you for choosing Feastly!</p>
            `;
        }

        // Send email with QR code
        await sendEmailWithQR(email, subject, text, id, restaurant_name, JSON.stringify(items), user_name, "order");

        res.status(200).json({ message: `Order status updated to ${status}` });
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
