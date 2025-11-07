const express = require('express');
const nodemailer = require('nodemailer');
const database = require('../database');
const router = express.Router();

// Registration form endpoint
router.post('/', async (req, res) => {
  try {
    const {
      studentFirstName,
      studentLastName,
      studentPhone,
      studentEmail,
      studentDateOfBirth,
      studentGrade,
      schoolName,
      parentFullName,
      parentEmail,
      parentPhone,
      parentAddress,
      sameAsParent,
      emergencyName,
      emergencyRelationship,
      emergencyPhone,
      emergencyEmail,
      emergencyAddress,
      subjects,
      specificGoals,
      learningDifficulties,
      additionalComments,
      howDidYouHear,
      liabilityRelease,
      registrationDate,
      userAgent
    } = req.body;

    // Validate required fields - all fields except student email
    const requiredFields = {
      studentFirstName,
      studentLastName,
      studentPhone,
      studentDateOfBirth,
      studentGrade,
      schoolName,
      parentFullName,
      parentEmail,
      parentPhone,
      parentAddress,
      subjects,
      specificGoals,
      emergencyName,
      emergencyRelationship,
      emergencyPhone,
      liabilityRelease
    };

    const missingFields = Object.keys(requiredFields).filter(field => !requiredFields[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(parentEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid parent email format'
      });
    }

    if (studentEmail && !emailRegex.test(studentEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student email format'
      });
    }

    if (emergencyEmail && !emailRegex.test(emergencyEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid emergency contact email format'
      });
    }

    // Validate phone format - only if provided
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;

    // Optional phone validation - only validate if provided
    if (emergencyPhone && sameAsParent !== '1' && sameAsParent !== true) {
      const cleanEmergencyPhone = emergencyPhone.replace(/[\s\-\(\)]/g, '');
      if (cleanEmergencyPhone && !phoneRegex.test(cleanEmergencyPhone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid emergency contact phone number format'
        });
      }
    }
    
    // Optional parent phone validation - only validate if provided
    if (parentPhone) {
      const cleanParentPhone = parentPhone.replace(/[\s\-\(\)]/g, '');
      if (!phoneRegex.test(cleanParentPhone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid parent phone number format'
        });
      }
    }

    if (studentPhone) {
      const cleanStudentPhone = studentPhone.replace(/[\s\-\(\)]/g, '');
      if (!phoneRegex.test(cleanStudentPhone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid student phone number format'
        });
      }
    }

    // Generate registration ID
    const registrationId = generateRegistrationId();

    // Prepare registration data
    const registrationData = {
      registrationId,
      student: {
        firstName: studentFirstName.trim(),
        lastName: studentLastName.trim(),
        phone: studentPhone.trim(),
        email: studentEmail ? studentEmail.trim().toLowerCase() : null,
        dateOfBirth: studentDateOfBirth,
        grade: studentGrade,
        schoolName: schoolName.trim()
      },
      parent: {
        fullName: parentFullName.trim(),
        email: parentEmail.trim().toLowerCase(),
        phone: parentPhone.trim(),
        address: parentAddress.trim()
      },
      emergencyContact: {
        sameAsParent: sameAsParent === '1' || sameAsParent === true,
        name: emergencyName.trim(),
        relationship: emergencyRelationship.trim(),
        phone: emergencyPhone.trim(),
        email: emergencyEmail ? emergencyEmail.trim().toLowerCase() : null,
        address: emergencyAddress ? emergencyAddress.trim() : null
      },
      additionalInfo: {
        subjects: subjects.trim(),
        specificGoals: specificGoals.trim(),
        learningDifficulties: learningDifficulties ? learningDifficulties.trim() : null,
        additionalComments: additionalComments ? additionalComments.trim() : null,
        howDidYouHear: howDidYouHear
      },
      agreements: {
        liabilityRelease: liabilityRelease
      },
      metadata: {
        registrationDate: registrationDate || new Date().toISOString(),
        userAgent: userAgent,
        ipAddress: req.ip || req.connection.remoteAddress,
        timestamp: new Date().toISOString()
      }
    };

    // Create transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Email content for admin notification - simplified key:value format
    const agreementsText = registrationData.agreements.liabilityRelease ? 'Agreed' : 'Not agreed';
    
    const adminMailOptions = {
      from: process.env.EMAIL_USER,
      to: 'easystemschool@gmail.com',
      subject: `New Student Registration - ${registrationId}`,
      text: `Registration Date: ${new Date().toLocaleString()}

Parent/Guardian Information
Name: ${registrationData.parent.fullName || ''}
Email: ${registrationData.parent.email || ''}
Phone: ${registrationData.parent.phone || ''}
Address: ${registrationData.parent.address || ''}

Emergency Contact Information
Same as Parent: ${registrationData.emergencyContact.sameAsParent ? 'Yes' : 'No'}${!registrationData.emergencyContact.sameAsParent ? `
Name: ${registrationData.emergencyContact.name || ''}
Relationship: ${registrationData.emergencyContact.relationship || ''}
Phone: ${registrationData.emergencyContact.phone || ''}
Email: ${registrationData.emergencyContact.email || ''}
Address: ${registrationData.emergencyContact.address || ''}` : ''}

Student Information
Name: ${registrationData.student.firstName} ${registrationData.student.lastName}
Phone: ${registrationData.student.phone || ''}
Email: ${registrationData.student.email || ''}
Date of Birth: ${registrationData.student.dateOfBirth || ''}
Grade: ${registrationData.student.grade || ''}
School: ${registrationData.student.schoolName || ''}

Academic Needs
Subjects: ${registrationData.additionalInfo.subjects || ''}
Specific Goals: ${registrationData.additionalInfo.specificGoals ? registrationData.additionalInfo.specificGoals.replace(/\n/g, ' ') : ''}
Learning Difficulties/Special Needs: ${registrationData.additionalInfo.learningDifficulties ? registrationData.additionalInfo.learningDifficulties.replace(/\n/g, ' ') : ''}
Additional Comments: ${registrationData.additionalInfo.additionalComments ? registrationData.additionalInfo.additionalComments.replace(/\n/g, ' ') : ''}
How did you hear about us: ${registrationData.additionalInfo.howDidYouHear || ''}

Agreements: ${agreementsText}
`
    };

    // Save to database
    const dbResult = await database.saveRegistration(registrationData);
    console.log('Registration saved to database:', dbResult);

    // Send admin notification email only
    await transporter.sendMail(adminMailOptions);

    // Log registration data
    console.log('New Registration Received:', JSON.stringify(registrationData, null, 2));

    // Send success response
    res.status(200).json({
      success: true,
      message: 'Registration submitted successfully',
      registrationId: registrationId,
      databaseId: dbResult.id,
      data: {
        parentName: registrationData.parent.fullName || 'Not provided',
        studentName: `${registrationData.student.firstName} ${registrationData.student.lastName}`,
        email: registrationData.parent.email || 'Not provided',
        registrationDate: registrationData.metadata.registrationDate
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
});

// Generate a unique registration ID
function generateRegistrationId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `REG-${timestamp}-${random}`.toUpperCase();
}

module.exports = router;
