const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('./db');
const cors = require('cors');
const CryptoJS = require('crypto-js');
require('dotenv').config();

const app = express();
// Hardcoded key matching client-side key
const SECRET_KEY = 'a9884abbdc81065904aefab2b487124b8c9f971fb95610612e824c6cb4257023';
const ADMIN_TOKEN_EXPIRATION = 60*60*1000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-token';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler caught:', err);
  res.status(500).json({
    success: false,
    message: 'Server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Routes

// Admin Login Route
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ 
      token: ADMIN_TOKEN,
      expires: Date.now() + ADMIN_TOKEN_EXPIRATION
     });
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
});

//Submit Feedback Route with enhanced debugging
app.post('/api/feedback', async (req, res) => {
  console.log('Received feedback submission');

  // Check if request body exists
  if (!req.body) {
    console.error('No request body received');
    return res.status(400).json({ success: false, message: 'No data received' });
  }

  console.log('Request body keys:', Object.keys(req.body));

  function safeDecrypt(value) {
    if (!value) {
      console.log('Empty value provided to safeDecrypt');
      return '';
    }

    try {
      console.log(`Attempting to decrypt value of type: ${typeof value}`);
      const decrypted = CryptoJS.AES.decrypt(value, SECRET_KEY).toString(CryptoJS.enc.Utf8);
      console.log(`Decryption successful, length: ${decrypted.length}`);
      return decrypted;
    } catch (err) {
      console.error('Decryption error:', err.message);
      return '';
    }
  }

  try {
    // Step 1: Safely decrypt incoming encrypted data
    console.log('Beginning decryption process');

    const decrypted = {
      name: safeDecrypt(req.body.name),
      email: safeDecrypt(req.body.email),
      contact: safeDecrypt(req.body.contact),
      rating: safeDecrypt(req.body.rating),
      message: safeDecrypt(req.body.message),
      branch: safeDecrypt(req.body.branch)
    };

    console.log('Decryption complete. Checking required fields.');

    // Check required fields
    if (!decrypted.name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    if (!decrypted.email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    if (!decrypted.rating) {
      return res.status(400).json({ success: false, message: 'Rating is required' });
    }

    if (!decrypted.message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    if (!decrypted.branch) {
      return res.status(400).json({ success: false, message: 'Branch selection is required' });
    }

    console.log('Required fields present. Validating data.');

    // Step 2: Manual validation with improved error handling
    const errors = [];

    if (decrypted.name.length < 2 || decrypted.name.length > 50) {
      errors.push('Name must be between 2 and 50 characters');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(decrypted.email)) {
      errors.push('Invalid email format');
    }

    // Contact is optional but validate if provided
    if (decrypted.contact && !/^\d{10}$/.test(decrypted.contact)) {
      errors.push('Contact must be 10 digits');
    }

    const ratingNum = parseInt(decrypted.rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      errors.push('Rating must be between 1 and 5');
    }

    if (decrypted.message.length < 5 || decrypted.message.length > 500) {
      errors.push('Message must be between 5 and 500 characters');
    }

    if (errors.length > 0) {
      console.log('Validation errors:', errors);
      return res.status(400).json({ success: false, errors });
    }

    console.log('Validation passed. Re-encrypting data.');

    // Step 3: Re-encrypt validated data
    const reEncrypted = {
      name: CryptoJS.AES.encrypt(decrypted.name, SECRET_KEY).toString(),
      email: CryptoJS.AES.encrypt(decrypted.email, SECRET_KEY).toString(),
      contact: CryptoJS.AES.encrypt(decrypted.contact || '', SECRET_KEY).toString(),
      branch: CryptoJS.AES.encrypt(decrypted.branch, SECRET_KEY).toString(),
      rating: CryptoJS.AES.encrypt(decrypted.rating.toString(), SECRET_KEY).toString(),
      message: CryptoJS.AES.encrypt(decrypted.message, SECRET_KEY).toString(),
    };

    console.log('Re-encryption complete. Preparing database query.');

    // Step 4: Insert into database
    try {
      console.log('Executing database query...');

      console.log('Inserting into DB with:', {
        name: reEncrypted.name,
        email: reEncrypted.email,
        contact: reEncrypted.contact,
        rating: reEncrypted.rating,
        message: reEncrypted.message,
        branch: reEncrypted.branch // Verify this exists
      });

      await pool.query(
        'INSERT INTO feedback_logs (name, email, contact, branch, rating, message, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
        [
          reEncrypted.name,
          reEncrypted.email,
          reEncrypted.contact,
          reEncrypted.branch,
          reEncrypted.rating,
          reEncrypted.message,
        ]
      );
      console.log('Database insertion successful');
    } catch (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({
        success: false,
        message: dbError.message,
        query: dbError.query, // This will show the actual SQL query
        parameters: dbError.parameters
      });
    }

    console.log('Feedback submission complete');
    res.status(200).json({ success: true, message: 'Feedback submitted successfully' });

  } catch (err) {
    console.error('Unhandled server error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

app.get('/api/admin/feedback', async (req, res) => {
  const receivedToken = req.headers.authorization?.split(' ')[1];

  if (receivedToken !== ADMIN_TOKEN) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  try {
    const result = await pool.query('SELECT * FROM feedback_logs ORDER BY created_at DESC');

    const safeDecrypt = (encrypted) => {
      try {
        return CryptoJS.AES.decrypt(encrypted, SECRET_KEY).toString(CryptoJS.enc.Utf8);
      } catch {
        return '[Invalid or Unreadable]';
      }
    };

    const decrypted = result.rows.map(entry => ({
      ...entry,
      name: safeDecrypt(entry.name),
      email: safeDecrypt(entry.email),
      contact: safeDecrypt(entry.contact),
      branch: safeDecrypt(entry.branch),
      rating: safeDecrypt(entry.rating),
      message: safeDecrypt(entry.message),
    }));

    res.json(decrypted);
  } catch (err) {
    console.error('Error fetching admin feedback:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

app.delete('/api/admin/feedback/:id', async (req, res) => {
  const receivedToken = req.headers.authorization;

  if (receivedToken !== ADMIN_TOKEN) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  try {
    await pool.query('DELETE FROM feedback_logs WHERE id = $1', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({
      success: false,
      message: 'Database error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});