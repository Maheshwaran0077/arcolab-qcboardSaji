const Metric = require('../models/Metrics');

// GET: Fetch metrics with optional shift overlay
exports.getMetrics = async (req, res) => {
  try {
    const { shift } = req.query;
    const metrics = await Metric.find();

    if (!shift) {
      return res.status(200).json(metrics);
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

    res.status(200).json(shiftMetrics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST: Update department data for a specific shift
exports.updateMetric = async (req, res) => {
  const { letter, shift, daysData, alerts, success, issueLogs } = req.body;

  try {
    if (shift) {
      // Dynamic update path for nested shift data
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

      const sd = updated.shifts?.[shift] || {};
      return res.status(200).json({
        _id: updated._id,
        letter: updated.letter,
        label: updated.label,
        alerts:    sd.alerts    ?? 0,
        success:   sd.success   ?? 0,
        daysData:  sd.daysData  ?? [],
        issueLogs: sd.issueLogs ?? [],
      });
    } else {
      // Update top-level fields (Legacy/Home Overview)
      const updated = await Metric.findOneAndUpdate(
        { letter },
        { daysData, alerts, success, issueLogs },
        { upsert: true, new: true }
      );
      return res.status(200).json(updated);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};