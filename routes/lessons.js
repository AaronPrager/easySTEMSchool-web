const express = require('express');
const router = express.Router();
const database = require('../database');

// Get all lessons
router.get('/lessons', async (req, res) => {
  try {
    await database.init();
    const lessons = await database.getAllLessons();
    
    res.json({
      success: true,
      lessons: lessons
    });
  } catch (error) {
    console.error('Error fetching lessons:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lessons'
    });
  }
});

// Get a specific lesson
router.get('/lessons/:id', async (req, res) => {
  try {
    await database.init();
    const lesson = await database.getLessonById(req.params.id);
    
    if (lesson) {
      res.json({
        success: true,
        lesson: lesson
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }
  } catch (error) {
    console.error('Error fetching lesson:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lesson'
    });
  }
});

// Create a new lesson (or multiple recurring lessons)
router.post('/lessons', async (req, res) => {
  try {
    await database.init();
    const lessonData = req.body;

    // Validate required fields
    if (!lessonData.student_id || !lessonData.student_name || !lessonData.title || 
        !lessonData.subject || !lessonData.start_time || !lessonData.end_time) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const createdLessons = [];

    // If recurring, create multiple lessons
    if (lessonData.is_recurring && lessonData.recurrenceData) {
      const { recurrenceType, recurrenceCount } = lessonData.recurrenceData;
      const groupId = `RG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      for (let i = 0; i < recurrenceCount; i++) {
        const startDate = new Date(lessonData.start_time);
        const endDate = new Date(lessonData.end_time);

        // Calculate recurrence dates
        switch (recurrenceType) {
          case 'weekly':
            startDate.setDate(startDate.getDate() + (i * 7));
            endDate.setDate(endDate.getDate() + (i * 7));
            break;
          case 'biweekly':
            startDate.setDate(startDate.getDate() + (i * 14));
            endDate.setDate(endDate.getDate() + (i * 14));
            break;
          case 'monthly':
            startDate.setMonth(startDate.getMonth() + i);
            endDate.setMonth(endDate.getMonth() + i);
            break;
        }

        const recurringLesson = {
          ...lessonData,
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          is_recurring: true,
          recurrence_type: recurrenceType,
          occurrence_number: i + 1,
          total_occurrences: recurrenceCount,
          recurrence_group_id: groupId
        };

        const result = await database.saveLesson(recurringLesson);
        createdLessons.push(result);
      }

      res.json({
        success: true,
        message: `${recurrenceCount} recurring lessons created successfully`,
        lessons: createdLessons
      });
    } else {
      // Create a single lesson
      const result = await database.saveLesson(lessonData);
      res.json({
        success: true,
        message: 'Lesson created successfully',
        lesson: result
      });
    }
  } catch (error) {
    console.error('Error creating lesson:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create lesson',
      error: error.message
    });
  }
});

// Update a lesson
router.put('/lessons/:id', async (req, res) => {
  try {
    await database.init();
    const lessonData = req.body;
    const result = await database.updateLesson(req.params.id, lessonData);
    
    if (result.changes > 0) {
      res.json({
        success: true,
        message: 'Lesson updated successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }
  } catch (error) {
    console.error('Error updating lesson:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update lesson'
    });
  }
});

// Delete a lesson
router.delete('/lessons/:id', async (req, res) => {
  try {
    await database.init();
    
    // Check if this is part of a recurring group
    const lesson = await database.getLessonById(req.params.id);
    
    if (lesson && lesson.recurrence_group_id && req.query.deleteAll === 'true') {
      // Delete all lessons in the recurring group
      const result = await database.deleteRecurringGroup(lesson.recurrence_group_id);
      res.json({
        success: true,
        message: `Deleted ${result.changes} recurring lessons`
      });
    } else {
      // Delete single lesson
      const result = await database.deleteLesson(req.params.id);
      
      if (result.changes > 0) {
        res.json({
          success: true,
          message: 'Lesson deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Lesson not found'
        });
      }
    }
  } catch (error) {
    console.error('Error deleting lesson:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete lesson'
    });
  }
});

module.exports = router;
