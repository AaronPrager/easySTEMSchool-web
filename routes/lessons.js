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
      const { recurrence_type: recurrenceType, end_date: endDate } = lessonData.recurrenceData;
      const groupId = `RG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const seriesEndDate = new Date(endDate);
      const firstLessonStart = new Date(lessonData.start_time);
      const firstLessonEnd = new Date(lessonData.end_time);
      
      let currentDate = new Date(firstLessonStart);
      let occurrenceNumber = 1;
      const createdLessons = [];

      // Create lessons until we reach the end date
      while (currentDate <= seriesEndDate) {
        const lessonStart = new Date(currentDate);
        const lessonEnd = new Date(lessonStart);
        lessonEnd.setTime(lessonStart.getTime() + (firstLessonEnd.getTime() - firstLessonStart.getTime()));

        const recurringLesson = {
          ...lessonData,
          start_time: lessonStart.toISOString(),
          end_time: lessonEnd.toISOString(),
          is_recurring: true,
          recurrence_type: recurrenceType,
          occurrence_number: occurrenceNumber,
          end_date: endDate,
          recurrence_group_id: groupId
        };

        const result = await database.saveLesson(recurringLesson);
        createdLessons.push(result);

        // Calculate next occurrence date
        switch (recurrenceType) {
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case 'biweekly':
            currentDate.setDate(currentDate.getDate() + 14);
            break;
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
        }
        occurrenceNumber++;
      }

      res.json({
        success: true,
        message: `${createdLessons.length} recurring lessons created successfully`,
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
      // Delete all future lessons in the recurring group (after the selected lesson's date)
      const result = await database.deleteFutureLessonsInGroup(lesson.recurrence_group_id, lesson.start_time);
      res.json({
        success: true,
        message: `Deleted ${result.changes} future recurring lessons`
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

// Update all lessons in a recurring series
router.put('/lessons/series/:recurrenceGroupId', async (req, res) => {
  try {
    await database.init();
    
    const recurrenceGroupId = req.params.recurrenceGroupId;
    const updateData = req.body;
    
    // Get all lessons in the series
    const seriesLessons = await database.getLessonsByRecurrenceGroup(recurrenceGroupId);
    
    if (seriesLessons.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No lessons found in this series'
      });
    }
    
    // Sort lessons by occurrence number
    seriesLessons.sort((a, b) => a.occurrence_number - b.occurrence_number);
    
    const firstLesson = seriesLessons[0];
    const recurrenceType = updateData.recurrence_type || firstLesson.recurrence_type;
    const newEndDate = new Date(updateData.end_date);
    
    // Update existing lessons with new data (except dates)
    let updatedCount = 0;
    for (const lesson of seriesLessons) {
      try {
        // Merge existing lesson data with update data, excluding start_time and end_time
        const mergedData = {
          ...lesson,
          ...updateData,
          start_time: lesson.start_time, // Keep original start_time
          end_time: lesson.end_time       // Keep original end_time
        };
        
        await database.updateLesson(lesson.id, mergedData);
        updatedCount++;
      } catch (error) {
        console.error(`Error updating lesson ${lesson.id}:`, error);
      }
    }
    
    // Delete lessons that are beyond the new end date
    const lessonsToDelete = seriesLessons.filter(lesson => {
      const lessonDate = new Date(lesson.start_time);
      return lessonDate > newEndDate;
    });
    
    for (const lesson of lessonsToDelete) {
      await database.deleteLesson(lesson.id);
    }
    
    // Add new lessons if the end date is extended
    const remainingLessons = seriesLessons.filter(lesson => {
      const lessonDate = new Date(lesson.start_time);
      return lessonDate <= newEndDate;
    });
    
    if (remainingLessons.length > 0) {
      const lastExistingLesson = remainingLessons[remainingLessons.length - 1];
      const lastExistingDate = new Date(lastExistingLesson.start_time);
      
      if (lastExistingDate < newEndDate) {
        let currentDate = new Date(lastExistingDate);
        let occurrenceNumber = remainingLessons.length + 1;
        
        // Calculate next occurrence date
        switch (recurrenceType) {
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case 'biweekly':
            currentDate.setDate(currentDate.getDate() + 14);
            break;
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
        }
        
        // Create new lessons until we reach the end date
        while (currentDate <= newEndDate) {
          const lessonStart = new Date(currentDate);
          const lessonEnd = new Date(lessonStart);
          lessonEnd.setTime(lessonStart.getTime() + (new Date(lastExistingLesson.end_time).getTime() - new Date(lastExistingLesson.start_time).getTime()));

          const newLesson = {
            student_id: firstLesson.student_id,
            student_name: firstLesson.student_name,
            title: updateData.title || firstLesson.title,
            subject: updateData.subject || firstLesson.subject,
            start_time: lessonStart.toISOString(),
            end_time: lessonEnd.toISOString(),
            duration: updateData.duration || firstLesson.duration,
            location: updateData.location || firstLesson.location,
            description: updateData.description || firstLesson.description,
            notes: updateData.notes || firstLesson.notes,
            connection_link: updateData.connection_link || firstLesson.connection_link,
            reminder: updateData.reminder || firstLesson.reminder,
            is_recurring: true,
            recurrence_type: recurrenceType,
            occurrence_number: occurrenceNumber,
            end_date: updateData.end_date,
            recurrence_group_id: recurrenceGroupId
          };
          
          await database.saveLesson(newLesson);
          updatedCount++;
          occurrenceNumber++;

          // Calculate next occurrence date
          switch (recurrenceType) {
            case 'weekly':
              currentDate.setDate(currentDate.getDate() + 7);
              break;
            case 'biweekly':
              currentDate.setDate(currentDate.getDate() + 14);
              break;
            case 'monthly':
              currentDate.setMonth(currentDate.getMonth() + 1);
              break;
          }
        }
      }
    }
    
    res.json({
      success: true,
      message: `Updated ${updatedCount} lessons in the series`
    });
  } catch (error) {
    console.error('Error updating lesson series:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update lesson series'
    });
  }
});

module.exports = router;
