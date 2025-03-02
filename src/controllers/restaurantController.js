const { v4: uuidv4 } = require("uuid");
const pool = require("../config/db");
const { uploadImage, deleteImage } = require("../utils/cloudinaryHelper");

// Default fallback image URL
const DEFAULT_IMAGE_URL = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

// Get all restaurants
exports.getAllRestaurants = async (req, res) => {
    try {
        const [restaurants] = await pool.query("SELECT * FROM restaurants");
        res.status(200).json(restaurants);
    } catch (error) {
        console.error("Error fetching restaurants:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get a single restaurant by ID
exports.getRestaurantById = async (req, res) => {
    try {
        const { id } = req.params;
        const [restaurant] = await pool.query("SELECT * FROM restaurants WHERE id = ?", [id]);

        if (restaurant.length === 0) {
            return res.status(404).json({ message: "Restaurant not found" });
        }

        res.status(200).json(restaurant[0]);
    } catch (error) {
        console.error("Error fetching restaurant:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Create a new restaurant
exports.createRestaurant = async (req, res) => {
    try {
        const { name, location, description, img_url } = req.body;
        const id = uuidv4();

        // Upload image if provided, else use default
        let uploadedImageUrl = DEFAULT_IMAGE_URL;
        if (img_url) {
            uploadedImageUrl = await uploadImage(img_url);
        }

        const query = "INSERT INTO restaurants (id, name, location, description, img_url) VALUES (?, ?, ?, ?, ?)";
        await pool.query(query, [id, name, location, description, uploadedImageUrl]);

        res.status(201).json({ message: "Restaurant created successfully", id, img_url: uploadedImageUrl });
    } catch (error) {
        console.error("Error creating restaurant:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Update a restaurant
exports.updateRestaurant = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, location, description, img_url } = req.body;

        // Get current restaurant to retrieve the existing image URL
        const [existingRestaurant] = await pool.query("SELECT img_url FROM restaurants WHERE id = ?", [id]);

        if (existingRestaurant.length === 0) {
            return res.status(404).json({ message: "Restaurant not found" });
        }

        let newImageUrl = existingRestaurant[0].img_url; // Keep existing image if no new one is provided

        // If a new image is uploaded, delete the old one from Cloudinary and upload the new one
        if (img_url) {
            await deleteImage(newImageUrl);
            newImageUrl = await uploadImage(img_url);
        }

        const updateQuery = "UPDATE restaurants SET name = ?, location = ?, description = ?, img_url = ? WHERE id = ?";
        await pool.query(updateQuery, [name, location, description, newImageUrl, id]);

        res.status(200).json({ message: "Restaurant updated successfully", img_url: newImageUrl });
    } catch (error) {
        console.error("Error updating restaurant:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Delete a restaurant
exports.deleteRestaurant = async (req, res) => {
    try {
        const { id } = req.params;

        // Get current restaurant to retrieve the existing image URL
        const [existingRestaurant] = await pool.query("SELECT img_url FROM restaurants WHERE id = ?", [id]);

        if (existingRestaurant.length === 0) {
            return res.status(404).json({ message: "Restaurant not found" });
        }

        // Delete the restaurant image from Cloudinary (only if it's not the fallback image)
        const currentImageUrl = existingRestaurant[0].img_url;
        if (currentImageUrl !== DEFAULT_IMAGE_URL) {
            await deleteImage(currentImageUrl);
        }

        const deleteQuery = "DELETE FROM restaurants WHERE id = ?";
        await pool.query(deleteQuery, [id]);

        res.status(200).json({ message: "Restaurant deleted successfully" });
    } catch (error) {
        console.error("Error deleting restaurant:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
