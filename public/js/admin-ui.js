// Admin Panel UI Utilities

// Format date to Danish format
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('da-DK');
}

// Format date and time to Danish format
function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString('da-DK') + ' ' + date.toLocaleTimeString('da-DK', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// Get status badge color
function getStatusColor(status) {
    switch (status) {
        case 'confirmed': return 'bg-green-100 text-green-800';
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'cancelled': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

// Get status text in Danish
function getStatusText(status) {
    switch (status) {
        case 'confirmed': return 'Bekræftet';
        case 'pending': return 'Afventer';
        case 'cancelled': return 'Annulleret';
        default: return status;
    }
}

// Show notification toast
function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }
    
    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
        type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Switch tabs
function switchTab(tabName) {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Update tab buttons
    tabBtns.forEach(btn => {
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active', 'bg-sage-green', 'text-white');
            btn.classList.remove('text-gray-600', 'hover:bg-gray-100');
        } else {
            btn.classList.remove('active', 'bg-sage-green', 'text-white');
            btn.classList.add('text-gray-600', 'hover:bg-gray-100');
        }
    });
    
    // Update tab content
    tabContents.forEach(content => {
        if (content.id === `${tabName}Tab`) {
            content.classList.remove('hidden');
        } else {
            content.classList.add('hidden');
        }
    });
    
    // Load specific data for active tab
    if (tabName === 'bookings') {
        loadBookings();
    } else if (tabName === 'blocked-dates') {
        loadBlockedDates();
        loadBlockedTimes();
    } else if (tabName === 'completed') {
        loadCompletedBookings();
    } else if (tabName === 'cancelled') {
        loadCancelledBookings();
    } else if (tabName === 'manual-booking') {
        loadAllUsers();
    }
}

// Show/hide sections
function showLogin() {
    const loginSection = document.getElementById('loginSection');
    const adminDashboard = document.getElementById('adminDashboard');
    loginSection.classList.remove('hidden');
    adminDashboard.classList.add('hidden');
}

function showDashboard() {
    const loginSection = document.getElementById('loginSection');
    const adminDashboard = document.getElementById('adminDashboard');
    loginSection.classList.add('hidden');
    adminDashboard.classList.remove('hidden');
}

// Error handling for login
function showError(message) {
    const loginError = document.getElementById('loginError');
    loginError.textContent = message;
    loginError.classList.remove('hidden');
}

function hideError() {
    const loginError = document.getElementById('loginError');
    loginError.classList.add('hidden');
}
