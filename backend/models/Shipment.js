const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema(
  {
    shipmentId: { type: String, required: true },
    containerId: { type: String, required: true },
    currentLocation: { type: String, required: true },
    currentETA: { type: Date, required: true },
    status: { type: String, required: true },
    route: [
      {
        location: String,
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Shipment', shipmentSchema);
