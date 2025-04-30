const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('./db');
const cors = require('cors');
const path = require('path');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public'));

// Debug: log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  if (req.method === 'POST') console.log('Body:', req.body);
  next();
});

// Secure Feedback POST route
app.post('/api/feedback', [
  // Name validation
  body('name')
    .trim()
    .escape()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be 2–50 characters'),

  // Email validation
  body('email')
    .trim()
    .normalizeEmail()
    .isEmail()
    .withMessage('Invalid email'),

  // Contact number (optional, but must be 10 digits if provided)
  body('contact')
    .optional()
    .trim()
    .matches(/^\d{10}$/)
    .withMessage('Contact must be a 10-digit number'),

  // Rating
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),

  // Message
  body('message')
    .trim()
    .escape()
    .isLength({ min: 5, max: 500 })
    .withMessage('Message must be 5–500 characters'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  // Prevent extra fields (anti-spoofing)
  const allowedKeys = ['name', 'email', 'contact', 'rating', 'message'];
  const invalidKeys = Object.keys(req.body).filter(k => !allowedKeys.includes(k));
  if (invalidKeys.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Unexpected fields in request',
      invalidFields: invalidKeys
    });
  }

  try {
    const { name, email, contact, rating, message } = req.body;

    await pool.query(
      'INSERT INTO feedback_logs (name, email, contact, rating, message) VALUES ($1, $2, $3, $4, $5)',
      [name, email, contact, rating, message]
    );

    res.status(200).json({ success: true, message: 'Feedback submitted successfully!' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});