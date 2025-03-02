const express = require("express");
const restaurantController = require("../controllers/restaurantController");

const router = express.Router();

// Define restaurant routes
router.get("/", restaurantController.getAllRestaurants);
router.get("/:id", restaurantController.getRestaurantById);
router.post("/", restaurantController.createRestaurant);
router.put("/:id", restaurantController.updateRestaurant);
router.delete("/:id", restaurantController.deleteRestaurant); // Delete restaurant

module.exports = router;
