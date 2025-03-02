const express = require('express');
const authRoutes = require("./routes/auth")
const restaurantRoutes = require("./routes/restaurants")
const reservationRoutes = require("./routes/reservations");
const orderRoutes = require('./routes/orders');
const menuItemRoutes = require('./routes/menuItems');

const pool = require('./db'); // Import MySQL connection

const app = express();
app.use(express.json()); // Middleware to handle JSON
app.use('/users', authRoutes); // Mount user routes
app.use('/restaurants', restaurantRoutes);
app.use("/reservations", reservationRoutes);
app.use('/orders', orderRoutes);
app.use('/menu-items', menuItemRoutes);




// Test route to check database connection
app.get('/test-db', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT 1 + 1 AS solution');
        res.json({ message: 'Database connected!', result: rows[0].solution });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Database connection failed' });
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
