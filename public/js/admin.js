(function () {
    const adminScriptFiles = [
        'admin-ui.js',
        'admin-auth.js',
        'admin-bookings.js',
        'admin-blocked-dates.js',
        'admin-blocked-times.js',
        'admin-users.js',
        'admin-main.js'
    ];

    const isNodeRuntime = typeof module !== 'undefined' && typeof module.exports !== 'undefined';

    if (isNodeRuntime) {
        const fs = require('fs');
        const path = require('path');

        adminScriptFiles.forEach((fileName) => {
            const absolutePath = path.join(__dirname, fileName);
            const scriptCode = fs.readFileSync(absolutePath, 'utf8');
            (0, eval)(`${scriptCode}\n//# sourceURL=${absolutePath.replace(/\\/g, '/')}`);
        });

        return;
    }

    const scriptMarker = 'data-admin-legacy-loader';

    adminScriptFiles.forEach((fileName) => {
        const existing = document.querySelector(`script[${scriptMarker}="${fileName}"]`);
        if (existing) {
            return;
        }

        const scriptElement = document.createElement('script');
        scriptElement.src = `/js/${fileName}`;
        scriptElement.defer = true;
        scriptElement.setAttribute(scriptMarker, fileName);
        document.head.appendChild(scriptElement);
    });
})();
