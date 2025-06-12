const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const shipmentRoutes = require('./routes/shipmentRoutes');

const app = express();
app.use(express.json());
app.use(cors());

app.use('/api', shipmentRoutes);

// ✅ NEW CONNECTION METHOD — clean & updated
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(process.env.PORT, () => {
      console.log(`🚀 Server running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err);
  });
