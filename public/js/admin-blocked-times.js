// Admin Blocked Times Management

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
