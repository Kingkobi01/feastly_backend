const express = require("express");
const router = express.Router();
const upload = require("../middleware/multer"); // Middleware for file uploads
const {
    createMenuItem,
    getMenuItems,
    updateMenuItem,
    deleteMenuItem,
} = require("../controllers/menuItemController");

// 📌 **Routes**
router.post("/", upload.single("image"), createMenuItem); // Create menu item
router.get("/", getMenuItems); // Get menu items (with optional filtering)
router.put("/:id", upload.single("image"), updateMenuItem); // Update menu item
router.delete("/:id", deleteMenuItem); // Delete menu item

module.exports = router;
