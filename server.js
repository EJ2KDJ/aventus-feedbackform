const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('./db');
const cors = require('cors');
const CryptoJS = require('crypto-js');
require('dotenv').config();

const app = express();
const SECRET_KEY = process.env.CRYPTO_KEY || 'default_secret';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-token';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Routes

// 🔐 Admin Login Route
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ token: ADMIN_TOKEN });
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
});

//Submit Feedback Route (decryption → validation → re-encryption → DB)
app.post('/api/feedback', async (req, res) => {

  function safeDecrypt(value) {
    try {
      return CryptoJS.AES.decrypt(value, SECRET_KEY).toString(CryptoJS.enc.Utf8);
    } catch (err) {
      console.error('Decryption error:', err.message);
      return null;
    }
  }
  
  try {
    // Step 1: Decrypt incoming encrypted data
    const decrypted = {
      name: safeDecrypt(req.body.name),
      email: safeDecrypt(req.body.email),
      contact: safeDecrypt(req.body.contact),
      rating: safeDecrypt(req.body.rating),
      message: safeDecrypt(req.body.message),
    };
    
    if (!decrypted.name || !decrypted.email || !decrypted.contact || !decrypted.rating || !decrypted.message) {
      return res.status(400).json({ success: false, message: 'Failed to decrypt one or more fields.' });
    }
    

    // Step 2: Validate decrypted values
    await Promise.all([
      body('name').isLength({ min: 2, max: 50 }).run({ body: decrypted }),
      body('email').isEmail().run({ body: decrypted }),
      body('contact').matches(/^\d{10}$/).run({ body: decrypted }),
      body('rating').isInt({ min: 1, max: 5 }).run({ body: decrypted }),
      body('message').isLength({ min: 5, max: 500 }).run({ body: decrypted }),
    ]);

    const result = validationResult({ body: decrypted });
    if (!result.isEmpty()) {
      return res.status(400).json({ success: false, errors: result.array() });
    }

    // Step 3: Re-encrypt validated data
    const reEncrypted = {
      name: CryptoJS.AES.encrypt(decrypted.name, SECRET_KEY).toString(),
      email: CryptoJS.AES.encrypt(decrypted.email, SECRET_KEY).toString(),
      contact: CryptoJS.AES.encrypt(decrypted.contact, SECRET_KEY).toString(),
      rating: CryptoJS.AES.encrypt(decrypted.rating, SECRET_KEY).toString(),
      message: CryptoJS.AES.encrypt(decrypted.message, SECRET_KEY).toString(),
    };

    // Step 4: Insert into database
    await pool.query(
      'INSERT INTO feedback_logs (name, email, contact, rating, message, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
      [reEncrypted.name, reEncrypted.email, reEncrypted.contact, reEncrypted.rating, reEncrypted.message]
    );

    res.status(200).json({ success: true, message: 'Feedback submitted successfully' });

  } catch (err) {
    console.error('Decryption or DB error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/admin/feedback', async (req, res) => {
  const token = req.headers.authorization;

  if (token !== `Bearer ${ADMIN_TOKEN}`) {
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
      rating: safeDecrypt(entry.rating),
      message: safeDecrypt(entry.message),
    }));

    res.json(decrypted);
  } catch (err) {
    console.error('Error fetching admin feedback:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
