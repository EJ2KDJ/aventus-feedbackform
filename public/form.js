'use strict';

console.log('form.js loaded');

document.addEventListener('DOMContentLoaded', () => {
    // Use the exact same key as in server.js
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
        const branch = document.getElementById('branch').value;

        console.log('Form values:', { name, email, contact, rating, message });

        // Simple frontend validation
        if (name.length < 2 || name.length > 50) {
            console.warn('Name must be between 2 and 50 characters');
            return;
        }
        
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            console.warn('Invalid email format');
            return;
        }
        
        if (contact && !/^\d{10}$/.test(contact)) {
            console.warn('Contact must be 10 digits');
            return;
        }
        
        if (!rating) {
            console.warn('Rating is required');
            return;
        }
        
        if (message.length < 5 || message.length > 500) {
            console.warn('Message must be between 5 and 500 characters');
            return;
        }

        console.log('Validation passed, encrypting data...');

        try {
            // Encrypt data
            const encryptedName = CryptoJS.AES.encrypt(name, secretKey).toString();
            const encryptedEmail = CryptoJS.AES.encrypt(email, secretKey).toString();
            const encryptedContact = CryptoJS.AES.encrypt(contact || '', secretKey).toString();
            const encryptedRating = CryptoJS.AES.encrypt(rating, secretKey).toString();
            const encryptedMessage = CryptoJS.AES.encrypt(message, secretKey).toString();
            const encryptedBranch = CryptoJS.AES.encrypt(branch, secretKey).toString();
            
            console.log('Encryption successful');
        
            const feedback = {
                name: encryptedName,
                email: encryptedEmail,
                contact: encryptedContact,
                rating: encryptedRating,
                message: encryptedMessage,
                branch: encryptedBranch
            };

            console.log('Sending feedback data');

            // Disable button during submission
            submitButton.disabled = true;
            submitButton.textContent = 'Submitting...';

            console.log('Making fetch request to /api/feedback');
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(feedback),
            });

            console.log('Server response status:', res.status);
            const data = await res.json();
            console.log('Server response data:', data);
            
            if (res.ok && data.success) {
                console.log('Feedback sent successfully');
                form.reset();
                alert('Thank you for your feedback!');
            } else {
                console.error('Server validation error:', data);
                alert('Error submitting feedback: ' + (data.message || 'Unknown error'));
            }

        } catch (error) {
            console.error('Network or processing error:', error);
            alert('Error processing your request. Please try again later.');
        } finally {
            // Re-enable submit button
            submitButton.disabled = false;
            submitButton.textContent = 'Submit';
        }
    });
});