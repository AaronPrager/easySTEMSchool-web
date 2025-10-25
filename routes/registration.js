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

    // Validate required fields
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
      sameAsParent,
      specificGoals,
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

    // Validate phone format
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanParentPhone = parentPhone.replace(/[\s\-\(\)]/g, '');
    
    if (!phoneRegex.test(cleanParentPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid parent phone number format'
      });
    }

    if (emergencyPhone && sameAsParent !== '1' && sameAsParent !== true) {
      const cleanEmergencyPhone = emergencyPhone.replace(/[\s\-\(\)]/g, '');
      if (!phoneRegex.test(cleanEmergencyPhone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid emergency contact phone number format'
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
        name: emergencyName ? emergencyName.trim() : null,
        relationship: emergencyRelationship ? emergencyRelationship.trim() : null,
        phone: emergencyPhone ? emergencyPhone.trim() : null,
        email: emergencyEmail ? emergencyEmail.trim().toLowerCase() : null,
        address: emergencyAddress ? emergencyAddress.trim() : null
      },
      additionalInfo: {
        subjects: subjects ? subjects.trim() : '',
        specificGoals: specificGoals ? specificGoals.trim() : null,
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

    // Email content for admin notification
    const adminMailOptions = {
      from: process.env.EMAIL_USER,
      to: 'easystemschool@gmail.com',
      subject: `New Student Registration - ${registrationId}`,
      html: `
        <h2>New Student Registration</h2>
        <p><strong>Registration ID:</strong> ${registrationId}</p>
        <p><strong>Registration Date:</strong> ${new Date().toLocaleString()}</p>
        
        <h3>Parent/Guardian Information</h3>
        <p><strong>Name:</strong> ${registrationData.parent.fullName}</p>
        <p><strong>Email:</strong> ${registrationData.parent.email}</p>
        <p><strong>Phone:</strong> ${registrationData.parent.phone}</p>
        <p><strong>Address:</strong> ${registrationData.parent.address}</p>
        
        <h3>Emergency Contact Information</h3>
        <p><strong>Same as Parent:</strong> ${registrationData.emergencyContact.sameAsParent ? 'Yes' : 'No'}</p>
        ${!registrationData.emergencyContact.sameAsParent ? `
          <p><strong>Name:</strong> ${registrationData.emergencyContact.name || 'Not provided'}</p>
          <p><strong>Relationship:</strong> ${registrationData.emergencyContact.relationship || 'Not provided'}</p>
          <p><strong>Phone:</strong> ${registrationData.emergencyContact.phone || 'Not provided'}</p>
          <p><strong>Email:</strong> ${registrationData.emergencyContact.email || 'Not provided'}</p>
          <p><strong>Address:</strong> ${registrationData.emergencyContact.address || 'Not provided'}</p>
        ` : ''}
        
        <h3>Student Information</h3>
        <p><strong>Name:</strong> ${registrationData.student.firstName} ${registrationData.student.lastName}</p>
        <p><strong>Phone:</strong> ${registrationData.student.phone}</p>
        <p><strong>Email:</strong> ${registrationData.student.email || 'Not provided'}</p>
        <p><strong>Date of Birth:</strong> ${registrationData.student.dateOfBirth}</p>
        <p><strong>Grade:</strong> ${registrationData.student.grade}</p>
        <p><strong>School:</strong> ${registrationData.student.schoolName}</p>
        
        <h3>Academic Needs</h3>
        <p><strong>Subjects:</strong> ${registrationData.additionalInfo.subjects}</p>
        <p><strong>Specific Goals:</strong></p>
        <p>${registrationData.additionalInfo.specificGoals ? registrationData.additionalInfo.specificGoals.replace(/\n/g, '<br>') : 'Not provided'}</p>
        ${registrationData.additionalInfo.learningDifficulties ? `<p><strong>Learning Difficulties/Special Needs:</strong></p><p>${registrationData.additionalInfo.learningDifficulties.replace(/\n/g, '<br>')}</p>` : ''}
        ${registrationData.additionalInfo.additionalComments ? `<p><strong>Additional Comments:</strong></p><p>${registrationData.additionalInfo.additionalComments.replace(/\n/g, '<br>')}</p>` : ''}
        <p><strong>How did you hear about us:</strong> ${registrationData.additionalInfo.howDidYouHear}</p>
        
        <h3>Agreements</h3>
        <p><strong>Privacy Policy:</strong> ${registrationData.agreements.privacy ? 'Agreed' : 'Not agreed'}</p>
        <p><strong>Safety & Conduct:</strong> ${registrationData.agreements.safety ? 'Agreed' : 'Not agreed'}</p>
        <p><strong>Services Agreement:</strong> ${registrationData.agreements.services ? 'Agreed' : 'Not agreed'}</p>
        <p><strong>Communication Consent:</strong> ${registrationData.agreements.communication ? 'Agreed' : 'Not agreed'}</p>
        
        <hr>
        <p><em>This registration was submitted through the Easy STEM School website.</em></p>
        <p><strong>IP Address:</strong> ${registrationData.metadata.ipAddress}</p>
      `
    };

    // Email content for parent confirmation
    const confirmationMailOptions = {
      from: process.env.EMAIL_USER,
      to: registrationData.parent.email,
      subject: 'Registration Confirmation - Easy STEM School',
      html: `
        <h2>Registration Confirmation</h2>
        <p>Dear ${registrationData.parent.fullName},</p>
        
        <p>Thank you for registering your child, ${registrationData.student.firstName} ${registrationData.student.lastName}, with Easy STEM School!</p>
        
        <p><strong>Registration ID:</strong> ${registrationId}</p>
        <p><strong>Registration Date:</strong> ${new Date().toLocaleString()}</p>
        
        <h3>What Happens Next?</h3>
        <ol>
          <li>We'll review your registration within 24 hours</li>
          <li>Our team will contact you to discuss your child's specific needs</li>
          <li>We'll create a personalized learning plan tailored to your child</li>
          <li>We'll schedule your first tutoring session</li>
        </ol>
        
        <h3>Contact Information</h3>
        <p>If you have any questions, please don't hesitate to contact us:</p>
        <p><strong>Phone:</strong> 650-224-8014</p>
        <p><strong>Email:</strong> easystemschool@gmail.com</p>
        
        <p>We're excited to work with ${registrationData.student.firstName} and help them achieve their academic goals!</p>
        
        <p>Best regards,<br>
        The Easy STEM School Team</p>
        
        <hr>
        <p><em>This is an automated confirmation email. Please do not reply to this email.</em></p>
      `
    };

    // Save to database
    const dbResult = await database.saveRegistration(registrationData);
    console.log('Registration saved to database:', dbResult);

    // Send emails
    await transporter.sendMail(adminMailOptions);
    await transporter.sendMail(confirmationMailOptions);

    // Log registration data
    console.log('New Registration Received:', JSON.stringify(registrationData, null, 2));

    // Send success response
    res.status(200).json({
      success: true,
      message: 'Registration submitted successfully',
      registrationId: registrationId,
      databaseId: dbResult.id,
      data: {
        parentName: `${registrationData.parent.firstName} ${registrationData.parent.lastName}`,
        studentName: `${registrationData.student.firstName} ${registrationData.student.lastName}`,
        email: registrationData.parent.email,
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
