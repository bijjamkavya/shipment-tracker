const express = require('express');
const router = express.Router();

const {
  getAllShipments,
  createShipment,
  updateShipment,
  deleteShipment,
  getShipmentById,
  trackShipment,
  getTrackingHistory // ✅ newly added controller for viewing tracking route
} = require('../controllers/shipmentController');

// GET all shipments
router.get('/shipments', getAllShipments);

// GET single shipment by ID
router.get('/shipments/:id', getShipmentById);

// POST create new shipment
router.post('/shipments', createShipment);

// PUT update shipment by ID
router.put('/shipments/:id', updateShipment);

// PATCH track shipment location
router.patch('/shipments/:id/track', trackShipment);

// ✅ GET tracking history for shipment
router.get('/shipments/:id/track', getTrackingHistory);

// DELETE shipment by ID
router.delete('/shipments/:id', deleteShipment);

module.exports = router;
