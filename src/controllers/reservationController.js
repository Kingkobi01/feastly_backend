const { v4: uuidv4 } = require("uuid");
const pool = require("../config/db");
const { sendEmailWithQR } = require("../utils/email");

// Create a reservation
exports.createReservation = async (req, res) => {
    try {
        const { user_id, restaurant_id, reservation_time } = req.body;

        if (!user_id || !restaurant_id || !reservation_time) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const reservationId = uuidv4();
        const status = "pending"; // Default status

        const query = `
            INSERT INTO reservations (id, user_id, restaurant_id, reservation_time, status)
            VALUES (?, ?, ?, ?, ?);
        `;
        await pool.query(query, [reservationId, user_id, restaurant_id, reservation_time, status]);

        // Fetch user email and restaurant name
        const getUserQuery = `
            SELECT users.email, users.name AS user_name, restaurants.name AS restaurant_name 
            FROM users
            JOIN restaurants ON restaurants.id = ?
            WHERE users.id = ?;
        `;
        const [rows] = await pool.query(getUserQuery, [restaurant_id, user_id]);

        if (rows.length > 0) {
            const { email, user_name, restaurant_name } = rows[0];
            const subject = "Reservation Successfully Created";
            const html = `
                <p>Hello <strong>${user_name}</strong>,</p>
                <p>Your reservation at <strong>${restaurant_name}</strong> is successfully booked for <strong>${reservation_time}</strong>.</p>
                <p>We will notify you once it is confirmed.</p>
                <p>Thank you for choosing us!</p>
            `;
            await sendEmailWithQR(email, subject, html, reservationId, restaurant_name, reservation_time, user_name);
        }

        res.status(201).json({
            message: "Reservation created successfully",
            reservation_id: reservationId,
            status,
        });
    } catch (error) {
        console.error("Error creating reservation:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Update Reservation Status
exports.updateReservationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!["pending", "confirmed", "cancelled"].includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        // Get reservation and user details
        const getUserQuery = `
            SELECT users.email, users.name AS user_name, reservations.reservation_time, restaurants.name AS restaurant_name 
            FROM reservations
            JOIN users ON reservations.user_id = users.id
            JOIN restaurants ON reservations.restaurant_id = restaurants.id
            WHERE reservations.id = ?;
        `;
        const [rows] = await pool.query(getUserQuery, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Reservation not found" });
        }

        const { email, user_name, reservation_time, restaurant_name } = rows[0];

        // Update the reservation status
        const updateQuery = "UPDATE reservations SET status = ? WHERE id = ?";
        await pool.query(updateQuery, [status, id]);

        // Email content
        let subject = "";
        let html = "";

        if (status === "confirmed") {
            subject = "Your Reservation is Confirmed!";
            html = `
                <p>Hello <strong>${user_name}</strong>,</p>
                <p>Your reservation at <strong>${restaurant_name}</strong> is confirmed for <strong>${reservation_time}</strong>.</p>
                <p>Show the attached QR code at the restaurant.</p>
                <p>See you soon! 🍽️</p>
            `;
        } else if (status === "cancelled") {
            subject = "Reservation Cancelled";
            html = `
                <p>Hello <strong>${user_name}</strong>,</p>
                <p>Your reservation at <strong>${restaurant_name}</strong> has been <strong>cancelled</strong>.</p>
                <p>If this was a mistake, please make another reservation.</p>
            `;
        }

        // Send the email with QR code
        await sendEmailWithQR(email, subject, html, id, restaurant_name, reservation_time, user_name);

        res.status(200).json({ message: `Reservation status updated to ${status}` });
    } catch (error) {
        console.error("Error updating reservation status:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.getReservationsByUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const query = `
            SELECT id, restaurant_id, reservation_time, status, created_at
            FROM reservations 
            WHERE user_id = ?
            ORDER BY created_at DESC;
        `;
        const [reservations] = await pool.query(query, [userId]);

        res.status(200).json({ reservations });
    } catch (error) {
        console.error("Error fetching user reservations:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
