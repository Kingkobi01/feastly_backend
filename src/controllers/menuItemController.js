const { v4: uuidv4 } = require("uuid");
const pool = require("../config/db");
const { uploadImage, deleteImage } = require("../utils/cloudinaryHelper");

// Default image if none is provided
const DEFAULT_IMAGE_URL = "https://img.freepik.com/free-psd/3d-rendering-delicious-cheese-burger_23-2149108546.jpg?semt=ais_hybrid";

// 📌 **Create a Menu Item**
exports.createMenuItem = async (req, res) => {
    try {
        const { restaurant_id, name, description, price, available = true } = req.body;
        let img_url = DEFAULT_IMAGE_URL; // Default image

        if (!restaurant_id || !name || !price) {
            return res.status(400).json({ message: "Restaurant ID, name, and price are required" });
        }

        // If an image is uploaded, process it
        if (req.file) {
            img_url = await uploadImage(req.file.path, "feastly/menu_items");
        }

        const id = uuidv4();
        const query = `
            INSERT INTO menu_items (id, restaurant_id, name, description, price, available, img_url, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW());
        `;
        await pool.query(query, [id, restaurant_id, name, description, price, available, img_url]);

        res.status(201).json({ message: "Menu item added successfully", id, img_url });
    } catch (error) {
        console.error("Error creating menu item:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// 📌 **Get All Menu Items (Optional: Filter by Restaurant)**
exports.getMenuItems = async (req, res) => {
    try {
        const { restaurant_id } = req.query;
        let query = "SELECT * FROM menu_items";
        const params = [];

        if (restaurant_id) {
            query += " WHERE restaurant_id = ?";
            params.push(restaurant_id);
        }

        const [menuItems] = await pool.query(query, params);
        res.status(200).json(menuItems);
    } catch (error) {
        console.error("Error fetching menu items:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// 📌 **Update a Menu Item**
exports.updateMenuItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, available } = req.body;

        // Fetch existing item to check for old image
        const [existing] = await pool.query("SELECT img_url FROM menu_items WHERE id = ?", [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: "Menu item not found" });
        }
        const oldImage = existing[0].img_url;

        let newImageUrl = oldImage;
        if (req.file) {
            newImageUrl = await uploadImage(req.file.path, "feastly/menu_items");
            if (oldImage !== DEFAULT_IMAGE_URL) {
                await deleteImage(oldImage);
            }
        }

        const query = `
            UPDATE menu_items SET 
                name = COALESCE(?, name), 
                description = COALESCE(?, description), 
                price = COALESCE(?, price), 
                available = COALESCE(?, available), 
                img_url = ?
            WHERE id = ?;
        `;
        await pool.query(query, [name, description, price, available, newImageUrl, id]);

        res.status(200).json({ message: "Menu item updated successfully" });
    } catch (error) {
        console.error("Error updating menu item:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// 📌 **Delete a Menu Item**
exports.deleteMenuItem = async (req, res) => {
    try {
        const { id } = req.params;

        // Get image URL before deleting
        const [existing] = await pool.query("SELECT img_url FROM menu_items WHERE id = ?", [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: "Menu item not found" });
        }
        const imageUrl = existing[0].img_url;

        // Delete the menu item
        await pool.query("DELETE FROM menu_items WHERE id = ?", [id]);

        // Delete image from Cloudinary if it's not the default
        if (imageUrl !== DEFAULT_IMAGE_URL) {
            await deleteImage(imageUrl);
        }

        res.status(200).json({ message: "Menu item deleted successfully" });
    } catch (error) {
        console.error("Error deleting menu item:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
