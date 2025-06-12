const Shipment = require('../models/Shipment');

// GET all shipments
exports.getAllShipments = async (req, res) => {
  try {
    const shipments = await Shipment.find();
    res.json(shipments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST create new shipment
exports.createShipment = async (req, res) => {
  const shipment = new Shipment(req.body);
  try {
    const newShipment = await shipment.save();
    res.status(201).json(newShipment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PUT update shipment by ID
exports.updateShipment = async (req, res) => {
  try {
    const updated = await Shipment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: 'Shipment not found' });
    }
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE shipment by ID
exports.deleteShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findByIdAndDelete(req.params.id);
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }
    res.json({ message: 'Shipment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET single shipment by ID
exports.getShipmentById = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }
    res.json(shipment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ PATCH: Track shipment location
exports.trackShipment = async (req, res) => {
  try {
    const { location } = req.body;
    if (!location) {
      return res.status(400).json({ message: 'Location is required' });
    }

    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    shipment.route.push({
      location,
      timestamp: new Date()
    });

    const updatedShipment = await shipment.save();
    res.json(updatedShipment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.trackShipment = async (req, res) => {
  const { location } = req.body;
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    shipment.route.push({ location, timestamp: new Date() });
    shipment.currentLocation = location;
    shipment.updatedAt = new Date();
    await shipment.save();

    res.json(shipment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
// ✅ GET tracking history for a shipment
exports.getTrackingHistory = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }
    res.json(shipment.route); // Only return the tracking route
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

