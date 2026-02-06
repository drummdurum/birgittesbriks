// Admin Panel Main Initialization

// Prevent Chrome extension runtime errors
window.addEventListener('error', function(e) {
    if (e.message && e.message.includes('runtime.lastError')) {
        e.preventDefault();
        return false;
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    try {
        checkAuthStatus();
        setupEventListeners();
        
        // Set minimum date to today for date inputs
        const today = new Date().toISOString().split('T')[0];
        const blockStartDate = document.getElementById('blockStartDate');
        const blockEndDate = document.getElementById('blockEndDate');
        const manualDato = document.getElementById('manualDato');
        const blockTimeDate = document.getElementById('blockTimeDate');
        
        if (blockStartDate) blockStartDate.min = today;
        if (blockEndDate) blockEndDate.min = today;
        if (manualDato) manualDato.min = today;
        if (blockTimeDate) blockTimeDate.min = today;
    } catch (error) {
        console.error('Initialization error:', error);
    }
});

// Setup event listeners
function setupEventListeners() {
    // DOM Elements
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const blockDateForm = document.getElementById('blockDateForm');
    const blockMultipleDatesForm = document.getElementById('blockMultipleDatesForm');
    const addDateBtn = document.getElementById('addDateBtn');
    const multipleDatePicker = document.getElementById('multipleDatePicker');
    const blockTimeForm = document.getElementById('blockTimeForm');
    const manualBookingForm = document.getElementById('manualBookingForm');
    const importUsersForm = document.getElementById('importUsersForm');
    const userSearch = document.getElementById('userSearch');
    const blockStartDate = document.getElementById('blockStartDate');

    const safeAddListener = (el, event, handler) => {
        if (el) {
            el.addEventListener(event, handler);
        }
    };

    // Login form
    safeAddListener(loginForm, 'submit', handleLogin);
    
    // Logout button
    safeAddListener(logoutBtn, 'click', handleLogout);
    
    // Tab switching
    tabBtns.forEach(btn => {
        safeAddListener(btn, 'click', () => switchTab(btn.dataset.tab));
    });
    
    // Block date form
    safeAddListener(blockDateForm, 'submit', handleBlockDate);
    
    // Multiple dates form
    safeAddListener(blockMultipleDatesForm, 'submit', handleBlockMultipleDates);
    safeAddListener(addDateBtn, 'click', addDateToList);
    safeAddListener(multipleDatePicker, 'keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addDateToList();
        }
    });

    // Block time form
    safeAddListener(blockTimeForm, 'submit', handleBlockTime);
    
    // Manual booking form
    safeAddListener(manualBookingForm, 'submit', handleManualBooking);
    
    // Import users form
    safeAddListener(importUsersForm, 'submit', handleImportUsers);
    
    // User search
    safeAddListener(userSearch, 'input', handleUserSearch);
    safeAddListener(userSearch, 'focus', function() {
        if (this.value.length >= 2) {
            document.getElementById('userSearchResults').classList.remove('hidden');
        }
    });
    document.addEventListener('click', function(e) {
        if (!e.target.matches('#userSearch') && !e.target.closest('#userSearchResults')) {
            document.getElementById('userSearchResults').classList.add('hidden');
        }
    });
    
    // Update end date minimum when start date changes
    safeAddListener(blockStartDate, 'change', function() {
        const blockEndDate = document.getElementById('blockEndDate');
        if (blockEndDate) {
            blockEndDate.min = this.value;
        }
    });
    
    // Event delegation for booking action buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('booking-action-btn')) {
            const action = e.target.dataset.action;
            const bookingId = e.target.dataset.bookingId;

            if (action === 'confirm') {
                updateBookingStatus(bookingId, 'confirmed');
            } else if (action === 'cancel') {
                updateBookingStatus(bookingId, 'cancelled');
            } else if (action === 'complete') {
                if (confirm('Markér denne booking som færdig?')) {
                    updateBookingStatus(bookingId, 'completed');
                }
            }
        }
        
        if (e.target.classList.contains('blocked-action-btn')) {
            const action = e.target.dataset.action;
            const blockedId = e.target.dataset.blockedId;
            
            if (action === 'remove-blocked') {
                removeBlockedDate(blockedId);
            }
        }

        if (e.target.classList.contains('blocked-time-action-btn')) {
            const action = e.target.dataset.action;
            const blockedId = e.target.dataset.blockedId;

            if (action === 'remove-blocked-time') {
                removeBlockedTime(blockedId);
            }
        }
    });
}
