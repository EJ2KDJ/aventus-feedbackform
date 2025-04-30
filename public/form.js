console.log('form.js loaded');

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('container-form');
    
    // Show status message function
    function showStatus(message, isError = false) {
        const statusDiv = document.createElement('div');
        statusDiv.className = 'status-message';
        statusDiv.textContent = message;
        statusDiv.style.padding = '10px';
        statusDiv.style.marginTop = '15px';
        statusDiv.style.borderRadius = '4px';
        statusDiv.style.textAlign = 'center';
        
        if (isError) {
            statusDiv.style.backgroundColor = '#ffebee';
            statusDiv.style.color = '#c62828';
        } else {
            statusDiv.style.backgroundColor = '#e8f5e9';
            statusDiv.style.color = '#2e7d32';
        }
        
        // Remove any existing status message
        const existingStatus = document.querySelector('.status-message');
        if (existingStatus) {
            existingStatus.remove();
        }
        
        form.appendChild(statusDiv);
        
        // Auto-remove success messages after 5 seconds
        if (!isError) {
            setTimeout(() => {
                statusDiv.remove();
            }, 5000);
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Form submitted');

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const contact = document.getElementById('contact').value.trim();
        const rating = document.querySelector('input[name="rating"]:checked')?.value;
        const message = document.getElementById('message').value.trim();

        if (!name || !email || !rating || !message) {
            showStatus('Please fill in all required fields.', true);
            return;
        } 

        const feedback = {name, email, contact, rating, message};
        console.log('Sending feedback data:', feedback);

        try {
            // Show loading indicator
            const submitButton = form.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = 'Submitting...';
            
            // Make the request with full URL to avoid confusion
            const fullUrl = window.location.origin + '/api/feedback';
            console.log('Submitting to:', fullUrl);
            
            const res = await fetch(fullUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(feedback),
            });
            
            console.log('Response status:', res.status);
            
            // Handle response
            if (res.ok) {
                const data = await res.json();
                console.log('Success response:', data);
                showStatus(data.message || 'Feedback submitted successfully!');
                form.reset();
            } else {
                const errorData = await res.json().catch(() => null);
                console.error('Error response:', errorData);
                if (errorData && errorData.errors) {
                    // Format validation errors
                    const errorMessages = errorData.errors.map(err => err.msg).join(', ');
                    showStatus(`Validation error: ${errorMessages}`, true);
                } else {
                    showStatus('Server error. Please try again later.', true);
                }
            }
        } catch (error) {
            console.error('Fetch error:', error);
            showStatus('Failed to submit feedback. Network error or server unavailable.', true);
        } finally {
            // Re-enable submit button
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });
});