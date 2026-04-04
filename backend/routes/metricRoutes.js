const express = require('express');
const router = express.Router();
const Metric = require('../models/Metrics');

// GET: Fetch all departments
router.get('/', async (req, res) => {
  try {
    const metrics = await Metric.find();
    res.json(metrics); 
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Update specific department (Quality or Safety)
router.post('/update', async (req, res) => {
  const { letter, daysData, alerts, success, issueLogs } = req.body;
  try {
    const updatedMetric = await Metric.findOneAndUpdate(
      { letter },
      { daysData, alerts, success, issueLogs },
      { upsert: true, new: true }
    );    
    res.json(updatedMetric);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 