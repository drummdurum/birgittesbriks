// Admin Blocked Dates Management

let selectedDates = [];

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
