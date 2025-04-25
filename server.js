const express = require('express');
const { body, check, validationResult } = require('express-validator');
const pool = require('./db');
const cors = require('cors');
const app = express();

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use('cors');

app.post('/submit-feedback',
    [
        /* Name sanitization */
        body('name')
            .trim()
            .escape()
            .notEmpty().withMessage('Name is Required'),

        /* Email Sanitization */
        body('email')
            .trim()
            .normalizeEmail()
            .isEmail().withMessage('Invalid email'),

        /* Tel no. sanitization */
        body('num')
            .trim()
            .escape()
            .isLength({ min: 10, max: 10}).withMessage('Invalid phone number')
            .isNumeric(),

        /* Star rating sanitization */
        body('rating')
            .isInt({ min: 1, max: 5}).withMessage('Invalid rating'),
        
        /* Message box sanitization */
        body('text-area')
            .trim()
            .escape()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(400).json({ errors: err.array() });
        }

        try {
            const {name, email, num, rating, 'text-area': message} = req.body;
            
            await pool.query(
                'INSERT INTO feedback_logs (name, email, phone, rating, message) VALUES ($1, $2, $3, $4, $5)', [name, email, num, rating, message]
            );

            res.send('Feedback submitted succesfully!');
        } catch(err) {
            console.error(err)
            res.status(500).send('Server error');
        }
    }
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));