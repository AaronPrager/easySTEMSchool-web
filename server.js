const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Import API routes
const contactRoutes = require('./routes/contact');
const registrationRoutes = require('./routes/registration');
const studentsRoutes = require('./routes/students');
const studentUpdateRoutes = require('./routes/student-update');
const lessonsRoutes = require('./routes/lessons');
const database = require('./database');

// Use API routes
app.use('/api/contact', contactRoutes);
app.use('/api/registration', registrationRoutes);
app.use('/api', studentsRoutes);
app.use('/api', studentUpdateRoutes);
app.use('/api', lessonsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Admin endpoints (in production, add authentication)
app.get('/api/admin/stats', async (req, res) => {
  try {
    const stats = await database.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ success: false, message: 'Error getting statistics' });
  }
});

app.get('/api/admin/registrations', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const registrations = await database.getAllRegistrations(limit, offset);
    res.json({ success: true, data: registrations });
  } catch (error) {
    console.error('Error getting registrations:', error);
    res.status(500).json({ success: false, message: 'Error getting registrations' });
  }
});

app.get('/api/admin/contacts', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const contacts = await database.getAllContacts(limit, offset);
    res.json({ success: true, data: contacts });
  } catch (error) {
    console.error('Error getting contacts:', error);
    res.status(500).json({ success: false, message: 'Error getting contacts' });
  }
});

app.get('/api/admin/registration/:id', async (req, res) => {
  try {
    const registration = await database.getRegistration(req.params.id);
    if (registration) {
      res.json({ success: true, data: registration });
    } else {
      res.status(404).json({ success: false, message: 'Registration not found' });
    }
  } catch (error) {
    console.error('Error getting registration:', error);
    res.status(500).json({ success: false, message: 'Error getting registration' });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve the registration page
app.get('/registration', (req, res) => {
  res.sendFile(path.join(__dirname, 'registration.html'));
});

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'API endpoint not found' 
  });
});

// Handle 404 for all other routes (SPA fallback)
app.get('*', (req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error' 
  });
});

// Start server with error handling
const server = app.listen(PORT, () => {
  console.log(`🚀 Easy STEM School server running on port ${PORT}`);
  console.log(`📧 Email configured: ${process.env.EMAIL_USER ? 'Yes' : 'No'}`);
  console.log(`🌐 Access your site at: http://localhost:${PORT}`);
  console.log(`📝 Registration page: http://localhost:${PORT}/registration`);
});

// Handle port already in use error
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`❌ Port ${PORT} is already in use.`);
    console.log(`💡 Try one of these solutions:`);
    console.log(`   1. Kill existing server: pkill -f "node server.js"`);
    console.log(`   2. Use different port: PORT=3001 node server.js`);
    console.log(`   3. Check what's using port ${PORT}: lsof -i :${PORT}`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});

module.exports = app;
