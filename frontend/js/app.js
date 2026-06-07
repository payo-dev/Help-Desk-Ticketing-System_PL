document.addEventListener('DOMContentLoaded', () => {
    const userString = localStorage.getItem('user');
    if (!userString) {
        window.location.href = 'login.html';
        return;
    }

    const user = JSON.parse(userString);

    // This connects the name
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        userNameElement.textContent = `${user.first_name} ${user.last_name}`;
    }
    
    // THIS CONNECTS THE ROLE DIRECTLY FROM YOUR DATABASE!
    const userRoleElement = document.getElementById('user-role');
    if (userRoleElement) {
        userRoleElement.textContent = user.role; // If they are Admin, this prints "Admin"
    }
});

// Create a global logout function that the sidebar "Log out" button can use
window.logout = function() {
    // Clear the local storage
    localStorage.removeItem('user');
    
    // Tell the backend to destroy the session
    fetch('http://127.0.0.1:3000/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
    }).then(() => {
        window.location.href = 'login.html';
    });
};