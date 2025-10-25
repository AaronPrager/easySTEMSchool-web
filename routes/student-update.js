const express = require('express');
const router = express.Router();
const database = require('../database');

// Update student information
router.put('/students/:id', async (req, res) => {
  try {
    await database.init();
    
    const studentId = req.params.id;
    const updateData = req.body;

    // Validate required fields
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required'
      });
    }

    // Validate price fields if provided
    if (updateData.price_per_lesson !== undefined) {
      const price = parseFloat(updateData.price_per_lesson);
      if (isNaN(price) || price < 0) {
        return res.status(400).json({
          success: false,
          message: 'Price per lesson must be a valid positive number'
        });
      }
      updateData.price_per_lesson = price;
    }

    if (updateData.ten_pack_price !== undefined) {
      const price = parseFloat(updateData.ten_pack_price);
      if (isNaN(price) || price < 0) {
        return res.status(400).json({
          success: false,
          message: '10 pack price must be a valid positive number'
        });
      }
      updateData.ten_pack_price = price;
    }

    // Update student
    const result = await database.updateStudent(studentId, updateData);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found or no changes made'
      });
    }

    res.json({
      success: true,
      message: 'Student updated successfully',
      changes: result.changes
    });

  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
