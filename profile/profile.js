// Profile page: who is logged in. The data is what the login returned, so no backend call is needed here.

// Show the user data
function loadUserData(user) {
    document.getElementById('username').textContent = user.username;
    document.getElementById('userEmail').textContent = user.email;
    document.getElementById('userId').textContent = user.id;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    const user = requireLogin();
    if (!user) {
        return;
    }

    renderNav('profile');
    loadUserData(user);
});
