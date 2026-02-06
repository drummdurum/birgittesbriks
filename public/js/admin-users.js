// Admin User Management

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

// Handle import of users
async function handleImportUsers(e) {
    e.preventDefault();
    
    const textarea = document.getElementById('usersJson');
    const statusDiv = document.getElementById('importStatus');
    
    try {
        const users = JSON.parse(textarea.value);
        
        if (!Array.isArray(users) || users.length === 0) {
            statusDiv.className = 'mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg';
            statusDiv.innerHTML = '❌ Ugyldig format. Skal være et JSON array med brugere.';
            statusDiv.classList.remove('hidden');
            return;
        }

        statusDiv.className = 'mt-6 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg';
        statusDiv.innerHTML = '⏳ Importerer brugere...';
        statusDiv.classList.remove('hidden');
        
        const response = await fetch('/api/admin/import-users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ users })
        });
        
        const result = await response.json();
        
        if (result.success) {
            statusDiv.className = 'mt-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg';
            let html = `✅ ${result.message}<br>`;
            html += `• Oprettet: ${result.created}<br>`;
            html += `• Eksisterede allerede: ${result.skipped}`;
            
            if (result.errors && result.errors.length > 0) {
                html += `<br><br>⚠️ Fejl:<br>`;
                result.errors.forEach(err => {
                    html += `• ${err}<br>`;
                });
            }
            
            statusDiv.innerHTML = html;
            textarea.value = '';
        } else {
            statusDiv.className = 'mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg';
            statusDiv.innerHTML = `❌ ${result.message}`;
        }
    } catch (error) {
        statusDiv.className = 'mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg';
        statusDiv.innerHTML = `❌ Fejl: ${error.message}`;
        statusDiv.classList.remove('hidden');
    }
}
