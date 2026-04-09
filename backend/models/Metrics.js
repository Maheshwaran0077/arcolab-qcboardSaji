const mongoose = require('mongoose');
const IssueLogSchema = new mongoose.Schema({
  date: String,
  rawDate: String,
  reason: String,   // Keep existing
  incident: String, // Keep existing
  affected: Number, // Keep existing
  severity: String, // Keep existing
  // NEW FIELDS
  planned: { type: Number, default: 0 },
  dispatched: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const ShiftDataSchema = new mongoose.Schema({
  alerts: { type: Number, default: 0 },
  success: { type: Number, default: 0 },
  daysData: [String],
  issueLogs: [IssueLogSchema]
}, { _id: false });

const MetricSchema = new mongoose.Schema({
  letter: { type: String, required: true, unique: true },
  label: String,
  alerts: Number,
  success: Number,
  daysData: [String],
  issueLogs: [IssueLogSchema],
  shifts: {
    '1': { type: ShiftDataSchema, default: () => ({ alerts: 0, success: 0, daysData: [], issueLogs: [] }) },
    '2': { type: ShiftDataSchema, default: () => ({ alerts: 0, success: 0, daysData: [], issueLogs: [] }) },
    '3': { type: ShiftDataSchema, default: () => ({ alerts: 0, success: 0, daysData: [], issueLogs: [] }) },
  }
}, { timestamps: true });

module.exports = mongoose.model('Metric', MetricSchema);