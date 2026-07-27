const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');

// @route   POST /api/schedules
// @desc    Submit a new scheduled test request (Public)
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { name, email, institution, date, testType } = req.body;

    if (!name || !email || !institution || !date) {
      return res.status(400).json({ message: 'Name, email, institution, and date are required' });
    }

    const schedule = new Schedule({
      name,
      email,
      institution,
      date,
      testType: testType || 'university'
    });

    await schedule.save();

    res.status(201).json({
      message: 'Schedule request submitted successfully',
      schedule
    });
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ message: 'Server error creating schedule request' });
  }
});

// @route   GET /api/schedules
// @desc    Get all scheduled test requests
// @access  Public / Admin
router.get('/', async (req, res) => {
  try {
    const schedules = await Schedule.find().sort({ createdAt: -1 });
    res.json({
      count: schedules.length,
      schedules
    });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ message: 'Server error fetching schedule requests' });
  }
});

// @route   PUT /api/schedules/:id
// @desc    Update schedule request status
// @access  Admin
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule request not found' });
    }

    if (status) schedule.status = status;
    await schedule.save();

    res.json({ message: 'Schedule status updated successfully', schedule });
  } catch (error) {
    console.error('Error updating schedule status:', error);
    res.status(500).json({ message: 'Server error updating schedule status' });
  }
});

// @route   DELETE /api/schedules/:id
// @desc    Delete a schedule request
// @access  Admin
router.delete('/:id', async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule request not found' });
    }

    await Schedule.findByIdAndDelete(req.params.id);
    res.json({ message: 'Schedule request deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule request:', error);
    res.status(500).json({ message: 'Server error deleting schedule request' });
  }
});

module.exports = router;
