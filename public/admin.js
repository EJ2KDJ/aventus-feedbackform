const token = localStorage.getItem('admin-token');

if (!token) window.location.href = '/login.html';


document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('admin-token');
  window.location.href = '/login.html';
});

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('/api/admin/feedback', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 403) {
      localStorage.removeItem('admin-token');
      window.location.href = '/login.html';
      return;
    }

    const data = await res.json();
    const tbody = document.querySelector('#feedback-table tbody');

    data.forEach(entry => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${entry.name}</td>
        <td>${entry.email}</td>
        <td>${entry.contact}</td>
        <td>${entry.rating}</td>
        <td>${entry.message}</td>
        <td>${new Date(entry.created_at).toLocaleString()}</td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error('Error loading feedback:', err);
  }
});
