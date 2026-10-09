/**
 * Temperature Converter - Vanilla JavaScript
 * Handles temperature conversions between Celsius, Fahrenheit, and Kelvin,
 * input validation, error handling, and UI state updates.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Element References
  const form = document.getElementById('converter-form');
  const tempInput = document.getElementById('temperature-input');
  const unitSelect = document.getElementById('unit-select');
  const resetBtn = document.getElementById('reset-btn');
  const quickClearBtn = document.getElementById('quick-clear-btn');
  const errorMessage = document.getElementById('error-message');
  const resultsPlaceholder = document.getElementById('results-placeholder');

  // Result value displays
  const celsiusResult = document.getElementById('celsius-result');
  const fahrenheitResult = document.getElementById('fahrenheit-result');
  const kelvinResult = document.getElementById('kelvin-result');

  // Absolute zero constants for validation warnings
  const ABSOLUTE_ZERO = {
    celsius: -273.15,
    fahrenheit: -459.67,
    kelvin: 0
  };

  /**
   * Displays an error message to the user and hides result cards.
   * @param {string} message - Validation error description.
   */
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.hidden = false;
    tempInput.setAttribute('aria-invalid', 'true');
    tempInput.focus();
  }

  /**
   * Clears any active error message.
   */
  function clearError() {
    errorMessage.textContent = '';
    errorMessage.hidden = true;
    tempInput.removeAttribute('aria-invalid');
  }

  /**
   * Formats numbers to avoid floating point imprecision.
   * Strips unnecessary trailing zeroes (e.g., 25.00 -> 25).
   * @param {number} value
   * @returns {string}
   */
  function formatTemperature(value) {
    // Round to 2 decimal places
    const rounded = Number(Math.round(Number(value + 'e2')) + 'e-2');
    return rounded.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  }

  /**
   * Converts a valid temperature value based on selected source unit.
   * @param {number} value - Numeric temperature input
   * @param {string} unit - Source unit ('celsius', 'fahrenheit', 'kelvin')
   * @returns {{celsius: number, fahrenheit: number, kelvin: number}}
   */
  function convertTemperature(value, unit) {
    let celsius, fahrenheit, kelvin;

    switch (unit) {
      case 'celsius':
        celsius = value;
        fahrenheit = (value * 9 / 5) + 32;
        kelvin = value + 273.15;
        break;

      case 'fahrenheit':
        celsius = (value - 32) * 5 / 9;
        fahrenheit = value;
        kelvin = (value - 32) * 5 / 9 + 273.15;
        break;

      case 'kelvin':
        celsius = value - 273.15;
        fahrenheit = (value - 273.15) * 9 / 5 + 32;
        kelvin = value;
        break;

      default:
        throw new Error(`Unknown unit: ${unit}`);
    }

    return { celsius, fahrenheit, kelvin };
  }

  /**
   * Validates the input string for valid positive/negative integers or decimals.
   * @param {string} rawInput
   * @returns {{isValid: boolean, value?: number, error?: string}}
   */
  function validateInput(rawInput) {
    const trimmed = rawInput.trim();

    if (trimmed === '') {
      return { isValid: false, error: 'Please enter a temperature value to convert.' };
    }

    // Strict regex for valid signed decimal or integer numbers
    const numberRegex = /^[+-]?(\d+(\.\d*)?|\.\d+)$/;
    if (!numberRegex.test(trimmed)) {
      return { 
        isValid: false, 
        error: `"${trimmed}" is not a valid number. Please enter a valid positive or negative decimal (e.g. 25, -10, 36.5).` 
      };
    }

    const numValue = parseFloat(trimmed);
    if (isNaN(numValue)) {
      return { isValid: false, error: 'Invalid numeric input. Please try again.' };
    }

    const unit = unitSelect.value;
    const minAllowed = ABSOLUTE_ZERO[unit];
    if (minAllowed !== undefined && numValue < minAllowed) {
      const unitSymbols = { celsius: '°C', fahrenheit: '°F', kelvin: 'K' };
      return {
        isValid: false,
        error: `Temperature cannot fall below absolute zero (${minAllowed} ${unitSymbols[unit]}).`
      };
    }

    return { isValid: true, value: numValue };
  }

  /**
   * Updates the UI result display cards.
   * @param {{celsius: number, fahrenheit: number, kelvin: number}} results
   */
  function displayResults(results) {
    celsiusResult.textContent = formatTemperature(results.celsius);
    fahrenheitResult.textContent = formatTemperature(results.fahrenheit);
    kelvinResult.textContent = formatTemperature(results.kelvin);

    // Hide initial placeholder banner once results are displayed
    if (resultsPlaceholder) {
      resultsPlaceholder.hidden = true;
    }
  }

  /**
   * Resets the entire form and restores initial placeholder state.
   */
  function resetConverter() {
    clearError();
    tempInput.value = '';
    unitSelect.value = 'celsius';
    celsiusResult.textContent = '--';
    fahrenheitResult.textContent = '--';
    kelvinResult.textContent = '--';
    
    if (resultsPlaceholder) {
      resultsPlaceholder.hidden = false;
    }
    
    if (quickClearBtn) {
      quickClearBtn.hidden = true;
    }

    tempInput.focus();
  }

  /**
   * Main submission handler.
   */
  function handleConvert(e) {
    if (e) e.preventDefault();

    clearError();
    const validation = validateInput(tempInput.value);

    if (!validation.isValid) {
      showError(validation.error);
      return;
    }

    const results = convertTemperature(validation.value, unitSelect.value);
    displayResults(results);
  }

  // --- Event Listeners ---

  // Form submission
  form.addEventListener('submit', handleConvert);

  // Clear/Reset button
  resetBtn.addEventListener('click', resetConverter);

  // Quick clear button inside input
  if (quickClearBtn) {
    quickClearBtn.addEventListener('click', () => {
      tempInput.value = '';
      quickClearBtn.hidden = true;
      clearError();
      tempInput.focus();
    });
  }

  // Live input changes: clear errors on typing & toggle quick-clear button
  tempInput.addEventListener('input', () => {
    if (errorMessage.textContent) {
      clearError();
    }
    if (quickClearBtn) {
      quickClearBtn.hidden = tempInput.value.length === 0;
    }
  });

  // Re-run conversion if unit changes and valid value exists
  unitSelect.addEventListener('change', () => {
    if (tempInput.value.trim() !== '') {
      handleConvert();
    }
  });
});
