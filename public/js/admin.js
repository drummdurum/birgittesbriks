// Admin Panel JavaScript
let currentUser = null;
let selectedDates = []; // Array to store multiple selected dates

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
    safeAddListener(document.getElementById('blockDateForm'), 'submit', handleBlockDate);
    
    // Multiple dates form
    safeAddListener(document.getElementById('blockMultipleDatesForm'), 'submit', handleBlockMultipleDates);
    safeAddListener(document.getElementById('addDateBtn'), 'click', addDateToList);
    safeAddListener(document.getElementById('multipleDatePicker'), 'keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addDateToList();
        }
    });

    // Block time form
    safeAddListener(document.getElementById('blockTimeForm'), 'submit', handleBlockTime);
    
    // Manual booking form
    safeAddListener(document.getElementById('manualBookingForm'), 'submit', handleManualBooking);
    
    // User search
    safeAddListener(document.getElementById('userSearch'), 'input', handleUserSearch);
    safeAddListener(document.getElementById('userSearch'), 'focus', function() {
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
    safeAddListener(document.getElementById('blockStartDate'), 'change', function() {
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
        loadBlockedTimes();
    } else if (tabName === 'completed') {
        loadCompletedBookings();
    } else if (tabName === 'cancelled') {
        loadCancelledBookings();
    }
}

// Load bookings and show clickable days + per-day list
async function loadBookings() {
    try {
        const response = await fetch('/api/admin/bookings');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const bookings = await response.json();

        if (!Array.isArray(bookings)) {
            throw new Error('Invalid response format: expected array');
        }

        const bookingDaysEl = document.getElementById('bookingDays');
        const bookingsOfDayEl = document.getElementById('bookingsOfDay');

        // Only consider ufærdige AND not cancelled bookings for the days list and per-day view
        const incompleteBookings = bookings.filter(b => !b.completed && b.status !== 'cancelled');

        if (incompleteBookings.length === 0) {
            bookingDaysEl.innerHTML = `<div class="text-center py-8"><div class="text-4xl mb-3">📝</div><p class="text-gray-500">Ingen ufærdige bookinger</p></div>`;
            bookingsOfDayEl.innerHTML = '';
            return;
        }

        // Group by ønsket_dato
        const grouped = incompleteBookings.reduce((acc, b) => {
            const date = b.ønsket_dato;
            if (!acc[date]) acc[date] = [];
            acc[date].push(b);
            return acc;
        }, {});

        const days = Object.keys(grouped).sort();

        bookingDaysEl.innerHTML = days.map(d => `
            <button data-date="${d}" class="day-btn w-full text-left p-3 rounded-lg hover:bg-gray-100 flex items-center justify-between">
                <div>
                    <div class="font-medium">${formatDate(d)}</div>
                    <div class="text-sm text-gray-500">${grouped[d].length} booking${grouped[d].length>1?'er':''}</div>
                </div>
                <div class="text-sm text-gray-400">›</div>
            </button>
        `).join('');

        // Attach click handlers
        document.querySelectorAll('#bookingDays .day-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const date = btn.dataset.date;
                // mark active
                document.querySelectorAll('#bookingDays .day-btn').forEach(b => b.classList.remove('bg-sage-green', 'text-white'));
                btn.classList.add('bg-sage-green', 'text-white');
                renderBookingsForDate(grouped[date], bookingsOfDayEl);
            });
        });

        // Auto-select first day
        if (days.length > 0) {
            const firstBtn = document.querySelector(`#bookingDays .day-btn[data-date="${days[0]}"]`);
            if (firstBtn) firstBtn.click();
        }

    } catch (error) {
        console.error('Error loading bookings:', error);
        document.getElementById('bookingsList').innerHTML = '<p class="text-red-500 text-center py-8">Fejl ved indlæsning af bookinger.</p>';
    }
}

// Load and render completed bookings into the Completed tab
async function loadCompletedBookings() {
    try {
        const response = await fetch('/api/admin/bookings');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const bookings = await response.json();
        const completed = bookings.filter(b => b.completed);
        const container = document.getElementById('completedList');

        if (!Array.isArray(completed) || completed.length === 0) {
            container.innerHTML = `<div class="text-center py-8"><div class="text-4xl mb-3">✅</div><p class="text-gray-500">Ingen færdige bookinger</p></div>`;
            return;
        }

        container.innerHTML = completed.map(booking => `
            <div class="admin-card p-4 border-l-4 border-gray-500">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <h4 class="font-medium text-lg">${booking.navn}</h4>
                        <p class="text-sm text-gray-500">Booking #${booking.id} · ${formatDate(booking.ønsket_dato)} · kl. ${booking.ønsket_tid}</p>
                    </div>
                    <div class="text-sm status-badge status-completed">Færdig</div>
                </div>
                <div class="text-sm text-gray-700 mb-3">
                    <div>📞 ${booking.telefon}</div>
                    ${booking.email ? `<div>✉️ ${booking.email}</div>` : ''}
                    <div>💆‍♀️ ${booking.behandling_type}</div>
                    ${booking.besked ? `<div class="mt-2">💬 ${booking.besked}</div>` : ''}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading completed bookings:', error);
        document.getElementById('completedList').innerHTML = '<p class="text-red-500 text-center py-4">Fejl ved indlæsning af færdige bookinger.</p>';
    }
}

// Load and render cancelled bookings into the Cancelled tab
async function loadCancelledBookings() {
    try {
        const response = await fetch('/api/admin/bookings');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const bookings = await response.json();
        const cancelled = bookings.filter(b => b.status === 'cancelled');
        const container = document.getElementById('cancelledList');

        if (!Array.isArray(cancelled) || cancelled.length === 0) {
            container.innerHTML = `<div class="text-center py-8"><div class="text-4xl mb-3">❌</div><p class="text-gray-500">Ingen annullerede bookinger</p></div>`;
            return;
        }

        container.innerHTML = cancelled.map(booking => `
            <div class="admin-card p-4 border-l-4 border-red-500">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <h4 class="font-medium text-lg">${booking.navn}</h4>
                        <p class="text-sm text-gray-500">Booking #${booking.id} · ${formatDate(booking.ønsket_dato)} · kl. ${booking.ønsket_tid}</p>
                    </div>
                    <div class="text-sm status-badge status-cancelled">Annulleret</div>
                </div>
                <div class="text-sm text-gray-700 mb-3">
                    <div>📞 ${booking.telefon}</div>
                    ${booking.email ? `<div>✉️ ${booking.email}</div>` : ''}
                    <div>💆‍♀️ ${booking.behandling_type}</div>
                    ${booking.besked ? `<div class="mt-2">💬 ${booking.besked}</div>` : ''}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading cancelled bookings:', error);
        document.getElementById('cancelledList').innerHTML = '<p class="text-red-500 text-center py-4">Fejl ved indlæsning af annullerede bookinger.</p>';
    }
}

// Render bookings for a specific date into the provided container
function renderBookingsForDate(bookingsForDate, containerEl) {
    containerEl.innerHTML = bookingsForDate.map(booking => `
        <div class="admin-card p-4 ${booking.status === 'confirmed' ? 'border-l-4 border-green-500' : booking.status === 'cancelled' ? 'border-l-4 border-red-500' : 'border-l-4 border-yellow-500'}">
            <div class="flex justify-between items-start mb-2">
                <div>
                    <h4 class="font-medium text-lg">${booking.navn}</h4>
                    <p class="text-sm text-gray-500">Booking #${booking.id} · kl. ${booking.ønsket_tid}</p>
                </div>
                <div class="text-sm status-badge status-${booking.status}">${getStatusText(booking.status)}</div>
            </div>
            <div class="text-sm text-gray-700 mb-3">
                <div>📞 ${booking.telefon}</div>
                ${booking.email ? `<div>✉️ ${booking.email}</div>` : ''}
                <div>💆‍♀️ ${booking.behandling_type}</div>
                ${booking.besked ? `<div class="mt-2">💬 ${booking.besked}</div>` : ''}
            </div>
            <div class="flex gap-3 pt-2 border-t border-gray-100">
                ${booking.status !== 'confirmed' ? `<button data-action="confirm" data-booking-id="${booking.id}" class="booking-action-btn flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium">✅ Bekræft</button>` : ''}
                ${booking.status !== 'cancelled' ? `<button data-action="cancel" data-booking-id="${booking.id}" class="booking-action-btn flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium">❌ Annuller</button>` : ''}
                ${booking.status !== 'completed' ? `<button data-action="complete" data-booking-id="${booking.id}" class="booking-action-btn flex-1 bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded-lg text-sm font-semibold shadow-md ring-2 ring-blue-200 focus:outline-none focus:ring-4 transition">✔️ Færdig</button>` : ''}
            </div>
        </div>
    `).join('');
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
            loadBookings(); // Reload the bookings list (shows only ufærdige)
            loadCompletedBookings(); // Reload færdige tab
            loadCancelledBookings(); // Reload annullerede tab
            const msg = status === 'confirmed' ? 'bekræftet' : status === 'cancelled' ? 'annulleret' : status === 'completed' ? 'markeret som færdig' : 'opdateret';
            showNotification(`Booking ${msg}`, 'success');

            // If we just confirmed, attempt to send the final confirmation email and show result
            if (status === 'confirmed') {
                try {
                    const mailResp = await fetch(`/api/admin/bookings/${bookingId}/send-final`, { method: 'POST' });
                    const mailJson = await mailResp.json();
                    if (mailResp.ok && mailJson.success) {
                        showNotification('Bekræftelsesmail sendt', 'success');
                    } else {
                        console.error('Send-final response error:', mailJson);
                        showNotification(mailJson.message || 'Kunne ikke sende bekræftelsesmail', 'error');
                    }
                } catch (err) {
                    console.error('Error sending final confirmation:', err);
                    showNotification('Fejl ved afsendelse af bekræftelsesmail', 'error');
                }
            }
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

// Load blocked times
async function loadBlockedTimes() {
    try {
        const response = await fetch('/api/admin/blocked-times');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blockedTimes = await response.json();

        if (!Array.isArray(blockedTimes)) {
            throw new Error('Invalid response format: expected array');
        }

        const blockedTimesList = document.getElementById('blockedTimesList');

        if (blockedTimes.length === 0) {
            blockedTimesList.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-4xl mb-3">🕒</div>
                    <h3 class="font-medium text-gray-900 mb-1">Ingen blokerede tidspunkter</h3>
                    <p class="text-gray-500 text-sm">Tilføj tidspunkter du ikke er tilgængelig</p>
                </div>
            `;
            return;
        }

        blockedTimesList.innerHTML = blockedTimes.map(blocked => `
            <div class="flex justify-between items-center p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                <div class="flex items-center gap-3">
                    <span class="text-lg">⏰</span>
                    <div>
                        <p class="font-medium text-gray-900">
                            ${formatDate(blocked.date)} · ${blocked.time}
                        </p>
                        ${blocked.reason ? `<p class="text-sm text-gray-600">${blocked.reason}</p>` : ''}
                    </div>
                </div>
                <button data-action="remove-blocked-time" data-blocked-id="${blocked.id}" 
                        class="blocked-time-action-btn bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1">
                    🗑️ Fjern
                </button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading blocked times:', error);
        document.getElementById('blockedTimesList').innerHTML = 
            '<p class="text-red-500 text-center py-4">Fejl ved indlæsning af blokerede tidspunkter.</p>';
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

// Add date to selected dates list
function addDateToList() {
    const datePicker = document.getElementById('multipleDatePicker');
    const selectedDate = datePicker.value;
    
    if (!selectedDate) {
        showNotification('Vælg en dato først', 'error');
        return;
    }
    
    // Check if date is already selected
    if (selectedDates.includes(selectedDate)) {
        showNotification('Denne dato er allerede valgt', 'error');
        return;
    }
    
    // Add date to array
    selectedDates.push(selectedDate);
    
    // Update UI
    renderSelectedDates();
    
    // Clear input
    datePicker.value = '';
}

// Render selected dates
function renderSelectedDates() {
    const container = document.getElementById('selectedDatesList');
    
    if (selectedDates.length === 0) {
        container.innerHTML = '<span class="text-sm text-gray-400">Ingen datoer valgt</span>';
        return;
    }
    
    container.innerHTML = selectedDates.map(date => `
        <span class="inline-flex items-center gap-2 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
            ${formatDate(date)}
            <button type="button" onclick="removeDateFromList('${date}')" class="hover:text-orange-600 font-bold">×</button>
        </span>
    `).join('');
}

// Remove date from selected list
function removeDateFromList(date) {
    selectedDates = selectedDates.filter(d => d !== date);
    renderSelectedDates();
}

// Handle block multiple dates
async function handleBlockMultipleDates(e) {
    e.preventDefault();
    
    if (selectedDates.length === 0) {
        showNotification('Vælg mindst én dato', 'error');
        return;
    }
    
    const formData = new FormData(e.target);
    const reason = formData.get('reason') || null;
    
    try {
        // Block each date individually
        const promises = selectedDates.map(date => 
            fetch('/api/admin/blocked-dates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    startDate: date,
                    endDate: null,
                    reason: reason
                })
            })
        );
        
        const results = await Promise.all(promises);
        const allSuccessful = results.every(r => r.ok);
        
        if (allSuccessful) {
            e.target.reset();
            selectedDates = [];
            renderSelectedDates();
            loadBlockedDates();
            showNotification(`${results.length} dato${results.length > 1 ? 'er' : ''} blokeret succesfuldt`, 'success');
        } else {
            showNotification('Nogle datoer kunne ikke blokeres', 'error');
            loadBlockedDates();
        }
    } catch (error) {
        console.error('Error blocking multiple dates:', error);
        showNotification('Fejl ved blokering af datoer', 'error');
    }
}

// Handle user search
async function handleUserSearch(e) {
    const query = e.target.value.trim();
    const resultsContainer = document.getElementById('userSearchResults');
    
    if (query.length < 2) {
        resultsContainer.classList.add('hidden');
        return;
    }
    
    try {
        const response = await fetch(`/api/bookings/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.success && data.users && data.users.length > 0) {
            resultsContainer.innerHTML = data.users.map(user => `
                <li class="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0 transition-colors"
                    onclick="selectUser(${user.id}, '${user.navn} ${user.efternavn}', '${user.telefon}', '${user.email || ''}')">
                    <div class="font-medium text-gray-900">${user.navn} ${user.efternavn}</div>
                    <div class="text-sm text-gray-600">${user.telefon}${user.email ? ' • ' + user.email : ''}</div>
                </li>
            `).join('');
            resultsContainer.classList.remove('hidden');
        } else {
            resultsContainer.innerHTML = '<li class="px-4 py-3 text-gray-500 text-center">Ingen brugere fundet</li>';
            resultsContainer.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Search error:', error);
        resultsContainer.innerHTML = '<li class="px-4 py-3 text-red-500 text-center">Fejl ved søgning</li>';
        resultsContainer.classList.remove('hidden');
    }
}

// Select user and fill form
function selectUser(userId, fullName, telefon, email) {
    document.getElementById('manualNavn').value = fullName;
    document.getElementById('manualTelefon').value = telefon;
    if (document.getElementById('manualEmail')) {
        document.getElementById('manualEmail').value = email;
    }
    document.getElementById('userSearch').value = '';
    document.getElementById('userSearchResults').classList.add('hidden');
    document.getElementById('manualNavn').focus();
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

// Handle block time form
async function handleBlockTime(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const blockData = {
        date: formData.get('date'),
        time: formData.get('time'),
        reason: formData.get('reason') || null
    };

    try {
        const response = await fetch('/api/admin/blocked-times', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(blockData)
        });

        const result = await response.json();

        if (result.success) {
            e.target.reset();
            loadBlockedTimes();
            showNotification('Tidspunkt blokeret succesfuldt', 'success');
        } else {
            showNotification(result.message || 'Fejl ved blokering af tidspunkt', 'error');
        }
    } catch (error) {
        console.error('Error blocking time:', error);
        showNotification('Fejl ved blokering af tidspunkt', 'error');
    }
}

// Remove blocked time
async function removeBlockedTime(blockedId) {
    if (!confirm('Er du sikker på at du vil fjerne dette blokerede tidspunkt?')) {
        return;
    }

    try {
        const response = await fetch(`/api/admin/blocked-times/${blockedId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            loadBlockedTimes();
            showNotification('Blokeret tidspunkt fjernet', 'success');
        } else {
            showNotification('Fejl ved fjernelse af blokeret tidspunkt', 'error');
        }
    } catch (error) {
        console.error('Error removing blocked time:', error);
        showNotification('Fejl ved fjernelse af blokeret tidspunkt', 'error');
    }
}