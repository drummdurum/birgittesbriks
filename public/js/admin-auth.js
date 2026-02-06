// Admin Authentication

let currentUser = null;

// Check authentication status on page load
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/admin/auth-status');
        const data = await response.json();
        
        if (data.authenticated) {
            currentUser = data.user;
            showDashboard();
            loadBookings();
            loadBlockedDates();
            loadBlockedTimes();
            loadCompletedBookings();
        } else {
            showLogin();
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        showLogin();
    }
}

// Handle login form submission
async function handleLogin(e) {
    e.preventDefault();
    
    const loginForm = document.getElementById('loginForm');
    const formData = new FormData(loginForm);
    const credentials = {
        username: formData.get('username'),
        password: formData.get('password')
    };
    
    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials)
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            showDashboard();
            loadBookings();
            loadBlockedDates();
            loadCompletedBookings();
            loginForm.reset();
            hideError();
        } else {
            showError(data.message || 'Ugyldig brugernavn eller adgangskode');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('Der opstod en fejl under login. Prøv igen.');
    }
}

// Handle logout
async function handleLogout() {
    try {
        await fetch('/api/admin/logout', { method: 'POST' });
        currentUser = null;
        showLogin();
    } catch (error) {
        console.error('Logout error:', error);
    }
}
