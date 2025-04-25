document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('container-form');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const contact = document.getElementById('num').value.trim();
        const rating = document.getElementById('input[name="rating"]:checked')?.value;
        const message = document.getElementById('message').value.trim();

        if (!name || !email || !contact || !rating || !message) {
            alert('Please fill in all the fields.');
            return;
        } 

        const feedback = {name, email, num, rating, message};

        try {
            const res = await fetch('/submit-feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(feedback),
            });

            const result = await res.text();
            alert(result);
            form.reset();
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to submit feedback. Please try again.');
        }
    });
});