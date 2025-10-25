import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      parentFirstName,
      parentLastName,
      parentEmail,
      parentPhone,
      studentFirstName,
      studentLastName,
      studentEmail,
      studentPhone,
      studentGrade,
      emergencyName,
      emergencyRelationship,
      emergencyPhone,
      emergencyEmail,
      subjects,
      learningGoals,
      previousExperience,
      privacyAgreement,
      safetyAgreement,
      servicesAgreement,
      communicationConsent,
      registrationDate,
      userAgent
    } = req.body;

    // Validate required fields
    const requiredFields = {
      parentFirstName,
      parentLastName,
      parentEmail,
      parentPhone,
      studentFirstName,
      studentLastName,
      emergencyName,
      emergencyRelationship,
      emergencyPhone,
      privacyAgreement,
      safetyAgreement,
      servicesAgreement,
      communicationConsent
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
    const cleanEmergencyPhone = emergencyPhone.replace(/[\s\-\(\)]/g, '');
    
    if (!phoneRegex.test(cleanParentPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid parent phone number format'
      });
    }

    if (!phoneRegex.test(cleanEmergencyPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid emergency contact phone number format'
      });
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
      parent: {
        firstName: parentFirstName.trim(),
        lastName: parentLastName.trim(),
        email: parentEmail.trim().toLowerCase(),
        phone: parentPhone.trim()
      },
      student: {
        firstName: studentFirstName.trim(),
        lastName: studentLastName.trim(),
        email: studentEmail ? studentEmail.trim().toLowerCase() : null,
        phone: studentPhone ? studentPhone.trim() : null,
        grade: studentGrade || null
      },
      emergencyContact: {
        name: emergencyName.trim(),
        relationship: emergencyRelationship,
        phone: emergencyPhone.trim(),
        email: emergencyEmail ? emergencyEmail.trim().toLowerCase() : null
      },
      additionalInfo: {
        subjects: Array.isArray(subjects) ? subjects : (subjects ? [subjects] : []),
        learningGoals: learningGoals ? learningGoals.trim() : null,
        previousExperience: previousExperience ? previousExperience.trim() : null
      },
      agreements: {
        privacy: privacyAgreement,
        safety: safetyAgreement,
        services: servicesAgreement,
        communication: communicationConsent
      },
      metadata: {
        registrationDate: registrationDate || new Date().toISOString(),
        userAgent: userAgent,
        ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        timestamp: new Date().toISOString()
      }
    };

    // Create transporter using Gmail SMTP
    const transporter = nodemailer.createTransporter({
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
        <p><strong>Name:</strong> ${registrationData.parent.firstName} ${registrationData.parent.lastName}</p>
        <p><strong>Email:</strong> ${registrationData.parent.email}</p>
        <p><strong>Phone:</strong> ${registrationData.parent.phone}</p>
        
        <h3>Student Information</h3>
        <p><strong>Name:</strong> ${registrationData.student.firstName} ${registrationData.student.lastName}</p>
        <p><strong>Email:</strong> ${registrationData.student.email || 'Not provided'}</p>
        <p><strong>Phone:</strong> ${registrationData.student.phone || 'Not provided'}</p>
        <p><strong>Grade Level:</strong> ${registrationData.student.grade || 'Not specified'}</p>
        
        <h3>Emergency Contact</h3>
        <p><strong>Name:</strong> ${registrationData.emergencyContact.name}</p>
        <p><strong>Relationship:</strong> ${registrationData.emergencyContact.relationship}</p>
        <p><strong>Phone:</strong> ${registrationData.emergencyContact.phone}</p>
        <p><strong>Email:</strong> ${registrationData.emergencyContact.email || 'Not provided'}</p>
        
        <h3>Additional Information</h3>
        <p><strong>Subjects of Interest:</strong> ${registrationData.additionalInfo.subjects.join(', ') || 'None selected'}</p>
        <p><strong>Learning Goals:</strong></p>
        <p>${registrationData.additionalInfo.learningGoals ? registrationData.additionalInfo.learningGoals.replace(/\n/g, '<br>') : 'Not provided'}</p>
        <p><strong>Previous Experience:</strong></p>
        <p>${registrationData.additionalInfo.previousExperience ? registrationData.additionalInfo.previousExperience.replace(/\n/g, '<br>') : 'Not provided'}</p>
        
        <h3>Agreements</h3>
        <p><strong>Privacy Policy:</strong> ${registrationData.agreements.privacy ? 'Agreed' : 'Not agreed'}</p>
        <p><strong>Safety & Conduct:</strong> ${registrationData.agreements.safety ? 'Agreed' : 'Not agreed'}</p>
        <p><strong>Services Agreement:</strong> ${registrationData.agreements.services ? 'Agreed' : 'Not agreed'}</p>
        <p><strong>Communication Consent:</strong> ${registrationData.agreements.communication ? 'Agreed' : 'Not agreed'}</p>
        
        <hr>
        <p><em>This registration was submitted through the Easy STEM School website.</em></p>
      `
    };

    // Email content for parent confirmation
    const confirmationMailOptions = {
      from: process.env.EMAIL_USER,
      to: registrationData.parent.email,
      subject: 'Registration Confirmation - Easy STEM School',
      html: `
        <h2>Registration Confirmation</h2>
        <p>Dear ${registrationData.parent.firstName} ${registrationData.parent.lastName},</p>
        
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
}

// Generate a unique registration ID
function generateRegistrationId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `REG-${timestamp}-${random}`.toUpperCase();
}
