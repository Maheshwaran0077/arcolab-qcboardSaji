const express = require('express');
const router = express.Router();
const Metric = require('../models/Metrics');
const metricController = require('../controller/metricController');

// GET: Fetch all departments
// Without ?shift  → returns raw docs (home dashboard overview)
// With    ?shift=1 → returns docs with top-level fields replaced by that shift's data
router.get('/', async (req, res) => {
  try {
    const { shift } = req.query;
    const metrics = await Metric.find();

    if (!shift) {
      return res.json(metrics);
    }

    // Overlay shift-specific data onto the base document shape
    const shiftMetrics = metrics.map(m => {
      const shiftData = m.shifts?.[shift] || {};
      return {
        _id: m._id,
        letter: m.letter,
        label: m.label,
        alerts:    shiftData.alerts    ?? 0,
        success:   shiftData.success   ?? 0,
        daysData:  shiftData.daysData  ?? [],
        issueLogs: shiftData.issueLogs ?? [],
      };
    });

    res.json(shiftMetrics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Update a department's data for a specific shift
// Body: { letter, shift, daysData, alerts, success, issueLogs }
router.post('/update', async (req, res) => {
  const { letter, shift, daysData, alerts, success, issueLogs } = req.body;

  try {
    if (shift) {
      // Write into the nested shifts[shift] bucket
      const updatePath = {
        [`shifts.${shift}.daysData`]:  daysData  ?? [],
        [`shifts.${shift}.alerts`]:    alerts    ?? 0,
        [`shifts.${shift}.success`]:   success   ?? 0,
        [`shifts.${shift}.issueLogs`]: issueLogs ?? [],
      };
      const updated = await Metric.findOneAndUpdate(
        { letter },
        { $set: updatePath },
        { upsert: true, new: true }
      );
      // Return the shift view so the frontend gets the right shape
      const sd = updated.shifts?.[shift] || {};
      return res.json({
        _id: updated._id,
        letter: updated.letter,
        label: updated.label,
        alerts:    sd.alerts    ?? 0,
        success:   sd.success   ?? 0,
        daysData:  sd.daysData  ?? [],
        issueLogs: sd.issueLogs ?? [],
      });
    } else {
      // No shift — update top-level fields (legacy / home overview)
      const updated = await Metric.findOneAndUpdate(
        { letter },
        { daysData, alerts, success, issueLogs },
        { upsert: true, new: true }
      );
      return res.json(updated);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get('/metrics', async (req, res) => {
  try {
    const { shift } = req.query; // Active shift from frontend (1, 2, or 3)
    const metrics = await Metric.find();
    
    // Map the metrics so the frontend receives the correct shift data
    const localizedData = metrics.map(m => {
      const shiftInfo = m.shifts[shift] || m.shifts['1'];
      return {
        ...m.toObject(),
        alerts: shiftInfo.alerts,
        success: shiftInfo.success,
        daysData: shiftInfo.daysData,
        issueLogs: shiftInfo.issueLogs
      };
    });
    
    res.json(localizedData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/metrics/update', async (req, res) => {
  try {
    const { letter, shift, issueLogs } = req.body;

    // We use a dynamic key: shifts.1.issueLogs, shifts.2.issueLogs, etc.
    const updatePath = `shifts.${shift}.issueLogs`;
    
    const updatedMetric = await Metric.findOneAndUpdate(
      { letter: letter },
      { $set: { [updatePath]: issueLogs } },
      { new: true, upsert: true }
    );

    // Return the specific shift data back to the frontend
    const shiftData = updatedMetric.shifts[shift];
    res.json({
      ...updatedMetric.toObject(),
      issueLogs: shiftData.issueLogs
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;
