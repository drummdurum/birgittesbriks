// Test script for booking functionality
console.log('🧪 Testing booking form validation...');

// Test if all required elements exist
const requiredElements = [
    'booking-form',
    'navn',
    'email', 
    'telefon',
    'behandling_type',
    'ønsket_dato',
    'ønsket_tid',
    'besked',
    'gdpr_samtykke',
    'submit-btn'
];

function testBookingForm() {
    let allElementsFound = true;
    
    requiredElements.forEach(id => {
        const element = document.getElementById(id);
        if (!element) {
            console.error(`❌ Missing element: ${id}`);
            allElementsFound = false;
        } else {
            console.log(`✅ Found element: ${id}`);
        }
    });
    
    // Test error message divs
    const errorDivs = document.querySelectorAll('.error-message');
    console.log(`📋 Found ${errorDivs.length} error message containers`);
    
    if (errorDivs.length < 8) {
        console.warn('⚠️ Some fields might be missing error message containers');
    }
    
    return allElementsFound;
}

// Run test when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', testBookingForm);
} else {
    testBookingForm();
}