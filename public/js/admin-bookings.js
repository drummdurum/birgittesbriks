// Admin Bookings Management

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
                <div>💆‍♀️ ${booking.behandling || 'Kropsterapi'} - ${booking.betaling}</div>
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
                    <div>💆‍♀️ ${booking.behandling || 'Kropsterapi'} - ${booking.betaling}</div>
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
                    <div>💆‍♀️ ${booking.behandling || 'Kropsterapi'} - ${booking.betaling}</div>
                    ${booking.besked ? `<div class="mt-2">💬 ${booking.besked}</div>` : ''}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading cancelled bookings:', error);
        document.getElementById('cancelledList').innerHTML = '<p class="text-red-500 text-center py-4">Fejl ved indlæsning af annullerede bookinger.</p>';
    }
}

// Handle manual booking form
async function handleManualBooking(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const bookingData = {
        navn: formData.get('navn'),
        telefon: formData.get('telefon'),
        email: formData.get('email') || null,
        ønsket_dato: formData.get('ønsket_dato'),
        ønsket_tid: formData.get('ønsket_tid'),
        behandling: formData.get('behandling') || 'Kropsterapi',
        betaling: formData.get('betaling'),
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

// Fetch availability for a specific date
async function getAvailabilityForDate(date) {
    try {
        const res = await fetch(`/api/availability?date=${encodeURIComponent(date)}`);
        const data = await res.json();
        
        if (!res.ok) {
            console.warn('Availability fetch error:', data);
            return null;
        }
        
        return data;
    } catch (err) {
        console.error('Error fetching availability:', err);
        return null;
    }
}

// Display availability info for manual booking (shows booked and blocked times)
function showManualAvailabilityInfo(date) {
    const container = document.getElementById('manualAvailabilityInfo');
    const contentDiv = document.getElementById('manualAvailabilityContent');
    
    if (!container || !contentDiv) return;

    container.classList.remove('hidden');
    contentDiv.innerHTML = '<div class="text-sm text-gray-500">🔄 Henter tilgængelighed...</div>';

    getAvailabilityForDate(date).then(data => {
        if (!data) {
            contentDiv.innerHTML = '<div class="text-sm text-red-600">❌ Kunne ikke hente tilgængelighed</div>';
            return;
        }

        if (data.blocked) {
            contentDiv.innerHTML = '<div class="text-sm text-red-700 font-medium">🚫 Hele dagen er blokeret</div>';
            return;
        }

        const booked = data.bookedTimes || [];
        const blocked = data.blockedTimes || [];
        const allTimes = ['10:00', '11:30', '13:00', '14:30', '16:00', '17:30', '19:00'];

        let bookedTimes = [];
        let availableTimes = [];
        let blockedTimes = [];

        allTimes.forEach(time => {
            if (booked.includes(time)) {
                bookedTimes.push(time);
            } else if (blocked.includes(time)) {
                blockedTimes.push(time);
            } else {
                availableTimes.push(time);
            }
        });

        let html = '';

        if (availableTimes.length > 0) {
            html += `<div class="flex flex-wrap gap-2">`;
            availableTimes.forEach(time => {
                html += `<span class="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">✅ ${time}</span>`;
            });
            html += `</div>`;
        }

        if (bookedTimes.length > 0 || blockedTimes.length > 0) {
            html += `<div class="flex flex-wrap gap-2 mt-2">`;
            bookedTimes.forEach(time => {
                html += `<span class="inline-block bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">🔴 ${time} (Optaget)</span>`;
            });
            blockedTimes.forEach(time => {
                html += `<span class="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">⏱️ ${time} (Blokeret)</span>`;
            });
            html += `</div>`;
        }

        if (availableTimes.length === 0) {
            html = '<div class="text-sm text-red-600 font-medium">❌ Ingen ledige tider på denne dato</div>';
        }

        contentDiv.innerHTML = html;
    });
}

// Setup manual booking availability listener
function setupManualAvailabilityListener() {
    const dateInput = document.getElementById('manualDato');
    if (dateInput) {
        dateInput.addEventListener('change', (e) => {
            const date = e.target.value;
            if (date) {
                showManualAvailabilityInfo(date);
            } else {
                document.getElementById('manualAvailabilityInfo').classList.add('hidden');
            }
        });
    }
}
