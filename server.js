const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('./db');
const cors = require('cors');
const path = require('path');
const app = express();

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors());
app.use(express.static('public'));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} request to ${req.path}`);
  if (req.method === 'POST') {
    console.log('Request body:', req.body);
  }
  next();
});

// API endpoints
app.post('/api/feedback', [
    // Validation rules as before
    body('name').trim().escape().notEmpty().withMessage('Name is Required'),
    body('email').trim().normalizeEmail().isEmail().withMessage('Invalid email'),
    body('contact').optional().trim().escape().isLength({ min: 10, max: 10}).withMessage('Invalid phone number'),
    body('rating').isInt({ min: 1, max: 5}).withMessage('Invalid rating'),
    body('message').trim().escape()
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const {name, email, contact, rating, message} = req.body;
        
        console.log('Inserting feedback:', { name, email, contact, rating, message });
        
        await pool.query(
            'INSERT INTO feedback_logs (name, email, contact, rating, message) VALUES ($1, $2, $3, $4, $5)', 
            [name, email, contact, rating, message]
        );

        res.status(200).json({ success: true, message: 'Feedback submitted successfully!' });
    } catch(err) {
        console.error('Database error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Health check API endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// IMPORTANT: Catch-all route handler for SPA - must come AFTER API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access the app at: http://localhost:${PORT}`);
});