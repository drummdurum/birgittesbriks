/** @jest-environment jsdom */

// Tests for multiple date selection in admin panel

describe('Admin - Multiple date selection', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="loginSection" class="hidden"></div>
      <div id="adminDashboard" class="hidden"></div>
      <form id="loginForm"></form>
      <div id="loginError" class="hidden"></div>
      <button id="logoutBtn"></button>

      <form id="blockDateForm"></form>
      <form id="blockMultipleDatesForm"></form>
      <button id="addDateBtn" type="button"></button>
      <input id="multipleDatePicker" type="date" />
      <div id="selectedDatesList">
        <span class="text-sm text-gray-400">Ingen datoer valgt</span>
      </div>

      <form id="manualBookingForm"></form>
      <input id="blockStartDate" type="date" />
      <input id="blockEndDate" type="date" />
      <input id="manualDato" type="date" />
    `;

    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ authenticated: false })
    });

    jest.resetModules();
    require('../public/js/admin.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('adds selected date and prevents duplicates', () => {
    const datePicker = document.getElementById('multipleDatePicker');
    const addButton = document.getElementById('addDateBtn');
    const selectedDatesList = document.getElementById('selectedDatesList');

    datePicker.value = '2025-02-14';
    addButton.click();

    expect(selectedDatesList.textContent).not.toContain('Ingen datoer valgt');
    expect(selectedDatesList.textContent).toContain('2025');
    expect(selectedDatesList.querySelectorAll('button').length).toBe(1);

    datePicker.value = '2025-02-14';
    addButton.click();

    expect(selectedDatesList.querySelectorAll('button').length).toBe(1);

    const notification = document.querySelector('.notification');
    expect(notification).toBeTruthy();
    expect(notification.textContent).toContain('Denne dato er allerede valgt');
  });
});
