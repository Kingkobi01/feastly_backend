const pool = require('../db'); // MySQL connection
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10; // Number of salt rounds for hashing

// Signup Controller
exports.signup = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const [existingUser] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Hash the password before storing it
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        await pool.query(
            'INSERT INTO users (id, name, email, password_hash) VALUES (UUID(), ?, ?, ?)',
            [name, email, hashedPassword]
        );

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Login Controller
exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const [user] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (user.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Compare the hashed password with the entered password
        const isPasswordValid = await bcrypt.compare(password, user[0].password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        res.json({ message: 'Login successful', user: { id: user[0].id, name: user[0].name, email: user[0].email } });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
};
