const express = require("express");
const { createReservation, updateReservationStatus, getReservationsByUser } = require("../controllers/reservationController");

const router = express.Router();

router.post("/", createReservation);
router.put("/:id/status", updateReservationStatus); // Update status
router.get("/user/:userId", getReservationsByUser);

module.exports = router;
