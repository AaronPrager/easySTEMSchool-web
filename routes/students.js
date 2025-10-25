const express = require('express');
const router = express.Router();
const database = require('../database');

// Get all registered students for lesson scheduling
router.get('/students', async (req, res) => {
  try {
    // Ensure database is initialized
    await database.init();
    
    const students = await database.getAllStudents();
    
    res.json({
      success: true,
      students: students
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students'
    });
  }
});

module.exports = router;

