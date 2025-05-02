const tokenData = JSON.parse(sessionStorage.getItem('admin-token'));
const token = tokenData?.token;

const sanitize = (str) => {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

if (!token || Date.now() > tokenData?.expires) {
  sessionStorage.removeItem('admin-token');
  window.location.href = '/login.html';
}

window.addEventListener('beforeunload', () => {
  sessionStorage.removeItem('admin-token');
});

document.getElementById('logout-btn').addEventListener('click', () => {
  sessionStorage.removeItem('admin-token');
  window.location.href = '/login.html';
});

document.addEventListener('DOMContentLoaded', async () => {
  const tokenData = sessionStorage.getItem('admin-token');

  try {
    const res = await fetch('/api/admin/feedback', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });


    if (!tokenData || Date.now() > tokenData.expires) {
      sessionStorage.removeItem('admin-token');
      window.location.href = '/login.html';
    }

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
          <td>${sanitize(entry.name)}</td>
          <td>${sanitize(entry.email)}</td>
          <td>${sanitize(entry.contact)}</td>
          <td>${sanitize(entry.branch)}</td>
          <td>${sanitize(entry.rating)}</td>
          <td>${sanitize(entry.message)}</td>
          <td>${new Date(entry.created_at).toLocaleString()}</td>
          <td><button class="delete-btn" data-id="${entry.id}">Delete</button></td>
        `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error('Error loading feedback:', err);
  }
});

document.addEventListener('click', async (e) => {
  if (e.target.classList.contains('delete-btn')) {
    const id = e.target.dataset.id;
    if (confirm('Are you sure you want to delete this entry?')) {
      try {
        const res = await fetch(`/api/admin/feedback/${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          e.target.closest('tr').remove();
        } else {
          alert('Failed to delete entry');
        }
      } catch (err) {
        console.error('Delete error:', err);
        alert('Error deleting entry');
      }
    }
  }
});
