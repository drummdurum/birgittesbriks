// Admin Panel JavaScript
let currentUser = null;

// DOM Elements
const loginSection = document.getElementById('loginSection');
const adminDashboard = document.getElementById('adminDashboard');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');

// Tab functionality
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

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
        
        if (blockStartDate) blockStartDate.min = today;
        if (blockEndDate) blockEndDate.min = today;
        if (manualDato) manualDato.min = today;
    } catch (error) {
        console.error('Initialization error:', error);
    }
});

// Setup event listeners
function setupEventListeners() {
    // Login form
    loginForm.addEventListener('submit', handleLogin);
    
    // Logout button
    logoutBtn.addEventListener('click', handleLogout);
    
    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // Block date form
    document.getElementById('blockDateForm').addEventListener('submit', handleBlockDate);
    
    // Manual booking form
    document.getElementById('manualBookingForm').addEventListener('submit', handleManualBooking);
    
    // Update end date minimum when start date changes
    document.getElementById('blockStartDate').addEventListener('change', function() {
        document.getElementById('blockEndDate').min = this.value;
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
            }
        }
        
        if (e.target.classList.contains('blocked-action-btn')) {
            const action = e.target.dataset.action;
            const blockedId = e.target.dataset.blockedId;
            
            if (action === 'remove-blocked') {
                removeBlockedDate(blockedId);
            }
        }
    });
}

// Check authentication status
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/admin/auth-status');
        const data = await response.json();
        
        if (data.authenticated) {
            currentUser = data.user;
            showDashboard();
            loadBookings();
            loadBlockedDates();
        } else {
            showLogin();
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        showLogin();
    }
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
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

// Show/hide sections
function showLogin() {
    loginSection.classList.remove('hidden');
    adminDashboard.classList.add('hidden');
}

function showDashboard() {
    loginSection.classList.add('hidden');
    adminDashboard.classList.remove('hidden');
}

// Error handling
function showError(message) {
    loginError.textContent = message;
    loginError.classList.remove('hidden');
}

function hideError() {
    loginError.classList.add('hidden');
}

// Tab switching
function switchTab(tabName) {
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
    }
}

// Load bookings
async function loadBookings() {
    try {
        const response = await fetch('/api/admin/bookings');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const bookings = await response.json();
        
        // Ensure bookings is an array
        if (!Array.isArray(bookings)) {
            throw new Error('Invalid response format: expected array');
        }
        
        const bookingsList = document.getElementById('bookingsList');
        
        if (bookings.length === 0) {
            bookingsList.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <div class="text-6xl mb-4">📝</div>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Ingen bookinger endnu</h3>
                    <p class="text-gray-500">Når kunder laver bookinger, vil de vises her</p>
                </div>
            `;
            return;
        }
        
        bookingsList.innerHTML = bookings.map(booking => `
            <div class="admin-card p-6 ${booking.status === 'confirmed' ? 'border-l-4 border-green-500' : booking.status === 'cancelled' ? 'border-l-4 border-red-500' : 'border-l-4 border-yellow-500'}">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="font-medium text-xl text-dark-gray mb-1">${booking.navn}</h3>
                        <p class="text-sm text-gray-500">Booking #${booking.id}</p>
                    </div>
                    <span class="status-badge status-${booking.status}">
                        ${getStatusText(booking.status)}
                    </span>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div class="space-y-3">
                        <div class="flex items-center gap-3">
                            <span class="text-lg">📞</span>
                            <div>
                                <p class="text-sm text-gray-500">Telefon</p>
                                <p class="font-medium">${booking.telefon}</p>
                            </div>
                        </div>
                        ${booking.email ? `
                            <div class="flex items-center gap-3">
                                <span class="text-lg">✉️</span>
                                <div>
                                    <p class="text-sm text-gray-500">Email</p>
                                    <p class="font-medium">${booking.email}</p>
                                </div>
                            </div>
                        ` : ''}
                        <div class="flex items-center gap-3">
                            <span class="text-lg">📅</span>
                            <div>
                                <p class="text-sm text-gray-500">Dato & Tid</p>
                                <p class="font-medium">${formatDate(booking.ønsket_dato)} kl. ${booking.ønsket_tid}</p>
                            </div>
                        </div>
                    </div>
                    <div class="space-y-3">
                        <div class="flex items-center gap-3">
                            <span class="text-lg">💆‍♀️</span>
                            <div>
                                <p class="text-sm text-gray-500">Behandling</p>
                                <p class="font-medium">${booking.behandling_type}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3">
                            <span class="text-lg">🕒</span>
                            <div>
                                <p class="text-sm text-gray-500">Oprettet</p>
                                <p class="font-medium">${formatDateTime(booking.created_at)}</p>
                            </div>
                        </div>
                        ${booking.besked ? `
                            <div class="flex items-start gap-3">
                                <span class="text-lg">💬</span>
                                <div>
                                    <p class="text-sm text-gray-500">Besked</p>
                                    <p class="font-medium text-sm">${booking.besked}</p>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="flex gap-3 pt-4 border-t border-gray-100">
                    ${booking.status !== 'confirmed' ? 
                        `<button data-action="confirm" data-booking-id="${booking.id}" 
                                class="booking-action-btn flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                            ✅ Bekræft booking
                        </button>` : ''
                    }
                    ${booking.status !== 'cancelled' ?
                        `<button data-action="cancel" data-booking-id="${booking.id}" 
                                class="booking-action-btn flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                            ❌ Annuller booking
                        </button>` : ''
                    }
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading bookings:', error);
        document.getElementById('bookingsList').innerHTML = 
            '<p class="text-red-500 text-center py-8">Fejl ved indlæsning af bookinger.</p>';
    }
}

// Update booking status
async function updateBookingStatus(bookingId, status) {
    try {
        const response = await fetch(`/api/admin/bookings/${bookingId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status })
        });
        
        const result = await response.json();
        
        if (result.success) {
            loadBookings(); // Reload the bookings list
            showNotification(`Booking ${status === 'confirmed' ? 'bekræftet' : 'annulleret'}`, 'success');
        } else {
            showNotification('Fejl ved opdatering af booking', 'error');
        }
    } catch (error) {
        console.error('Error updating booking:', error);
        showNotification('Fejl ved opdatering af booking', 'error');
    }
}

// Load blocked dates
async function loadBlockedDates() {
    try {
        const response = await fetch('/api/admin/blocked-dates');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blockedDates = await response.json();
        
        // Ensure blockedDates is an array
        if (!Array.isArray(blockedDates)) {
            throw new Error('Invalid response format: expected array');
        }
        
        const blockedDatesList = document.getElementById('blockedDatesList');
        
        if (blockedDates.length === 0) {
            blockedDatesList.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-4xl mb-3">📅</div>
                    <h3 class="font-medium text-gray-900 mb-1">Ingen blokerede datoer</h3>
                    <p class="text-gray-500 text-sm">Tilføj datoer du ikke er tilgængelig</p>
                </div>
            `;
            return;
        }
        
        blockedDatesList.innerHTML = blockedDates.map(blocked => `
            <div class="flex justify-between items-center p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                <div class="flex items-center gap-3">
                    <span class="text-lg">🚫</span>
                    <div>
                        <p class="font-medium text-gray-900">
                            ${formatDate(blocked.start_date)}${blocked.end_date && blocked.end_date !== blocked.start_date ? ` - ${formatDate(blocked.end_date)}` : ''}
                        </p>
                        ${blocked.reason ? `<p class="text-sm text-gray-600">${blocked.reason}</p>` : ''}
                    </div>
                </div>
                <button data-action="remove-blocked" data-blocked-id="${blocked.id}" 
                        class="blocked-action-btn bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1">
                    🗑️ Fjern
                </button>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading blocked dates:', error);
        document.getElementById('blockedDatesList').innerHTML = 
            '<p class="text-red-500 text-center py-4">Fejl ved indlæsning af blokerede datoer.</p>';
    }
}

// Handle block date form
async function handleBlockDate(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const blockData = {
        startDate: formData.get('startDate'),
        endDate: formData.get('endDate') || null,
        reason: formData.get('reason') || null
    };
    
    try {
        const response = await fetch('/api/admin/blocked-dates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(blockData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            e.target.reset();
            loadBlockedDates();
            showNotification('Dato(er) blokeret succesfuldt', 'success');
        } else {
            showNotification(result.message || 'Fejl ved blokering af dato', 'error');
        }
    } catch (error) {
        console.error('Error blocking date:', error);
        showNotification('Fejl ved blokering af dato', 'error');
    }
}

// Remove blocked date
async function removeBlockedDate(blockedId) {
    if (!confirm('Er du sikker på at du vil fjerne denne blokerede periode?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/blocked-dates/${blockedId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            loadBlockedDates();
            showNotification('Blokeret periode fjernet', 'success');
        } else {
            showNotification('Fejl ved fjernelse af blokeret periode', 'error');
        }
    } catch (error) {
        console.error('Error removing blocked date:', error);
        showNotification('Fejl ved fjernelse af blokeret periode', 'error');
    }
}

// Handle manual booking
async function handleManualBooking(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const bookingData = {
        navn: formData.get('navn'),
        telefon: formData.get('telefon'),
        email: formData.get('email') || null,
        ønsket_dato: formData.get('ønsket_dato'),
        ønsket_tid: formData.get('ønsket_tid'),
        behandling_type: formData.get('behandling_type'),
        besked: formData.get('besked') || null,
        status: 'confirmed', // Manual bookings are automatically confirmed
        created_by_admin: true
    };
    
    try {
        const response = await fetch('/api/admin/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookingData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            e.target.reset();
            showNotification('Manuel booking oprettet succesfuldt', 'success');
            
            // Switch to bookings tab to show the new booking
            switchTab('bookings');
        } else {
            showNotification(result.message || 'Fejl ved oprettelse af booking', 'error');
        }
    } catch (error) {
        console.error('Error creating manual booking:', error);
        showNotification('Fejl ved oprettelse af booking', 'error');
    }
}

// Utility functions
function getStatusColor(status) {
    switch (status) {
        case 'confirmed': return 'bg-green-100 text-green-800';
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'cancelled': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function getStatusText(status) {
    switch (status) {
        case 'confirmed': return 'Bekræftet';
        case 'pending': return 'Afventer';
        case 'cancelled': return 'Annulleret';
        default: return status;
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('da-DK');
}

function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString('da-DK') + ' ' + date.toLocaleTimeString('da-DK', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// Notification system
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