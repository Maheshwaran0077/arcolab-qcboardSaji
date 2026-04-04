const mongoose = require('mongoose');

const MetricSchema = new mongoose.Schema({
  letter: { type: String, required: true, unique: true }, // "Q", "S", "H", etc.
  label: String,
  alerts: Number,
  success: Number,
  daysData: [String],
  issueLogs: [{
    date: String,      // "24/03/2026"
    rawDate: String,   // "2026-03-24"
    // Quality Fields
    reason: String,    
    // Safety Fields
    incident: String,  
    affected: Number,
    severity: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Metric', MetricSchema);