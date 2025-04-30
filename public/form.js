'use strict';

console.log('form.js loaded');

document.addEventListener('DOMContentLoaded', () => {
    const secretKey = 'a9884abbdc81065904aefab2b487124b8c9f971fb95610612e824c6cb4257023';
    const form = document.getElementById('container-form');
    const submitButton = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Form submitted');

        // Get and trim input values
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const contact = document.getElementById('contact').value.trim();
        const rating = document.querySelector('input[name="rating"]:checked')?.value;
        const message = document.getElementById('message').value.trim();

        // Simple frontend validation (matches backend)
        if (name.length < 2 || name.length > 50 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
            (contact && !/^\d{10}$/.test(contact)) ||
            !rating || message.length < 5 || message.length > 500) {
            console.warn('Client-side validation failed.');
            return;
        }

        const encryptedName = CryptoJS.AES.encrypt(name, secretKey).toString();
        const encryptedEmail = CryptoJS.AES.encrypt(email, secretKey).toString();
        const encryptedContact = CryptoJS.AES.encrypt(contact, secretKey).toString();
        const encryptedRating = CryptoJS.AES.encrypt(rating, secretKey).toString();
        const encryptedMessage = CryptoJS.AES.encrypt(message, secretKey).toString();
    
        const feedback = {
            name: encryptedName,
            email: encryptedEmail,
            contact: encryptedContact,
            rating: encryptedRating,
            message: encryptedMessage
        };

        console.log('Sending feedback:', feedback);

        try {
            // Disable button during submission
            submitButton.disabled = true;
            submitButton.textContent = 'Submitting...';

            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(feedback),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                console.log('Feedback sent successfully');
                form.reset();
            } else {
                console.error('Validation/server error:', data);
            }

        } catch (error) {
            console.error('Network or server error:', error);
        } finally {
            // Re-enable submit button
            submitButton.disabled = false;
            submitButton.textContent = 'Submit';
        }
    });
});
