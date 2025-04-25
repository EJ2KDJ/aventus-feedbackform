console.log('form.js loaded');

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('container-form');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const contact = document.getElementById('contact').value.trim();
        const rating = document.querySelector('input[name="rating"]:checked')?.value;
        const message = document.getElementById('message').value.trim();

        if (!name || !email || !rating || !message) {
            alert('Please fill in all required fields.');
            return;
        } 

        const feedback = {name, email, contact, rating, message};

        try {
            await fetch('/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(feedback),
            });
            
            form.reset();
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to submit feedback. Please try again.');
        }
    });
});