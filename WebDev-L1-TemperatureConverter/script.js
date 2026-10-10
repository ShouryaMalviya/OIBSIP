/**
 * Temperature Converter Engine - Vanilla JavaScript
 * Handles calculations across Celsius (°C), Fahrenheit (°F), and Kelvin (K),
 * input validation, formatting to two decimal places, error handling, and UI updates.
 */

// ============================================================================
// 1. Reusable Calculation Functions (Pure Math Helpers)
// ============================================================================

/**
 * Converts Celsius to Fahrenheit: °F = (°C × 9/5) + 32
 * @param {number} celsius
 * @returns {number}
 */
function celsiusToFahrenheit(celsius) {
  return (celsius * 9 / 5) + 32;
}

/**
 * Converts Fahrenheit to Celsius: °C = (°F − 32) × 5/9
 * @param {number} fahrenheit
 * @returns {number}
 */
function fahrenheitToCelsius(fahrenheit) {
  return (fahrenheit - 32) * 5 / 9;
}

/**
 * Converts Celsius to Kelvin: K = °C + 273.15
 * @param {number} celsius
 * @returns {number}
 */
function celsiusToKelvin(celsius) {
  return celsius + 273.15;
}

/**
 * Converts Kelvin to Celsius: °C = K − 273.15
 * @param {number} kelvin
 * @returns {number}
 */
function kelvinToCelsius(kelvin) {
  return kelvin - 273.15;
}

/**
 * Converts any supported unit to standard Celsius representation.
 * @param {number} value - Numeric temperature
 * @param {string} unit - 'celsius' | 'fahrenheit' | 'kelvin'
 * @returns {number} Temperature in Celsius
 */
function toStandardCelsius(value, unit) {
  switch (unit) {
    case 'celsius':
      return value;
    case 'fahrenheit':
      return fahrenheitToCelsius(value);
    case 'kelvin':
      return kelvinToCelsius(value);
    default:
      throw new Error(`Unsupported temperature unit: "${unit}"`);
  }
}

/**
 * Calculates equivalent temperatures in Celsius, Fahrenheit, and Kelvin.
 * @param {number} value - Numeric temperature
 * @param {string} unit - 'celsius' | 'fahrenheit' | 'kelvin'
 * @returns {{celsius: number, fahrenheit: number, kelvin: number}}
 */
function calculateTemperatures(value, unit) {
  // Convert to standard Celsius base
  const celsius = toStandardCelsius(value, unit);

  // Derive Fahrenheit and Kelvin from standard Celsius base
  const fahrenheit = celsiusToFahrenheit(celsius);
  const kelvin = celsiusToKelvin(celsius);

  return { celsius, fahrenheit, kelvin };
}

/**
 * Formats a temperature value to exactly two decimal places.
 * Avoids unintended floating point precision artifacts (e.g. 77.00000000000001 -> 77.00).
 * @param {number} value
 * @returns {string}
 */
function formatTemperature(value) {
  return Number(value).toFixed(2);
}

// ============================================================================
// 2. DOM Controller & Application Lifecycle
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // DOM References
  const converterForm = document.getElementById('converter-form');
  const tempInput = document.getElementById('temperature-input');
  const unitSelect = document.getElementById('unit-select');
  const convertBtn = document.getElementById('convert-btn');
  const resetBtn = document.getElementById('reset-btn');
  const quickClearBtn = document.getElementById('quick-clear-btn');
  const errorMessage = document.getElementById('error-message');
  const resultsPlaceholder = document.getElementById('results-placeholder');

  // Result display nodes
  const celsiusResult = document.getElementById('celsius-result');
  const fahrenheitResult = document.getElementById('fahrenheit-result');
  const kelvinResult = document.getElementById('kelvin-result');

  // Physical absolute zero constants for validation
  const ABSOLUTE_ZERO = {
    celsius: { min: -273.15, symbol: '°C' },
    fahrenheit: { min: -459.67, symbol: '°F' },
    kelvin: { min: 0, symbol: 'K' }
  };

  /**
   * Displays an accessible validation error.
   * @param {string} message
   */
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.hidden = false;
    tempInput.setAttribute('aria-invalid', 'true');
    tempInput.classList.add('is-invalid');
    tempInput.focus();
  }

  /**
   * Clears any active error message and invalid styling.
   */
  function clearError() {
    errorMessage.textContent = '';
    errorMessage.hidden = true;
    tempInput.removeAttribute('aria-invalid');
    tempInput.classList.remove('is-invalid');
  }

  /**
   * Validates raw user input string.
   * Detects invalid text, signs, empty fields, and values below absolute zero.
   * @param {string} raw
   * @returns {{isValid: boolean, value?: number, error?: string}}
   */
  function validateInput(raw) {
    const trimmed = raw.trim();

    if (trimmed === '') {
      return { 
        isValid: false, 
        error: 'Please enter a temperature value to convert.' 
      };
    }

    // Strict regex checking for signed integer or decimal (e.g. 25, -10, 36.5, -273.15, 0)
    const validNumberRegex = /^[+-]?(\d+(\.\d*)?|\.\d+)$/;
    if (!validNumberRegex.test(trimmed)) {
      return {
        isValid: false,
        error: `"${trimmed}" is not a valid number. Please enter a valid decimal or integer (e.g. 25, -10, 36.5).`
      };
    }

    const numericValue = parseFloat(trimmed);
    if (isNaN(numericValue) || !isFinite(numericValue)) {
      return {
        isValid: false,
        error: 'Invalid numeric input. Please enter a real number.'
      };
    }

    // Physical limit validation (Absolute Zero)
    const currentUnit = unitSelect.value;
    const limit = ABSOLUTE_ZERO[currentUnit];
    if (limit && numericValue < limit.min) {
      return {
        isValid: false,
        error: `Temperature cannot fall below absolute zero (${limit.min} ${limit.symbol}).`
      };
    }

    return { isValid: true, value: numericValue };
  }

  /**
   * Renders the calculated temperatures onto the three result cards.
   * @param {{celsius: number, fahrenheit: number, kelvin: number}} results
   */
  function displayResults(results) {
    celsiusResult.textContent = formatTemperature(results.celsius);
    fahrenheitResult.textContent = formatTemperature(results.fahrenheit);
    kelvinResult.textContent = formatTemperature(results.kelvin);

    // Hide the initial placeholder message once results are available
    if (resultsPlaceholder) {
      resultsPlaceholder.hidden = true;
    }
  }

  /**
   * Executes the complete conversion workflow:
   * 1. Reads input & selected unit
   * 2. Validates input
   * 3. Performs multi-unit conversion
   * 4. Updates UI cards
   */
  function runConversion() {
    clearError();

    const validation = validateInput(tempInput.value);
    if (!validation.isValid) {
      showError(validation.error);
      return;
    }

    const selectedUnit = unitSelect.value;
    const results = calculateTemperatures(validation.value, selectedUnit);
    displayResults(results);
  }

  /**
   * Resets input field, unit dropdown, and restores result placeholders.
   */
  function resetAll() {
    clearError();

    // Reset input and dropdown
    tempInput.value = '';
    unitSelect.value = 'celsius';

    // Reset result cards to initial placeholder state
    celsiusResult.textContent = '--';
    fahrenheitResult.textContent = '--';
    kelvinResult.textContent = '--';

    // Show initial placeholder banner
    if (resultsPlaceholder) {
      resultsPlaceholder.hidden = false;
    }

    // Hide in-field quick clear button
    if (quickClearBtn) {
      quickClearBtn.hidden = true;
    }

    // Return focus to input field
    tempInput.focus();
  }

  // ==========================================================================
  // 3. Event Listeners & Keyboard Interaction
  // ==========================================================================

  // Form submit handles Convert button click and standard form submission
  converterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    runConversion();
  });

  // Explicit keyboard Enter listener on the temperature input field
  tempInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      runConversion();
    }
  });

  // Clear button click listener
  resetBtn.addEventListener('click', (e) => {
    e.preventDefault();
    resetAll();
  });

  // In-field quick clear button
  if (quickClearBtn) {
    quickClearBtn.addEventListener('click', () => {
      tempInput.value = '';
      quickClearBtn.hidden = true;
      clearError();
      tempInput.focus();
    });
  }

  // Live input changes: dismiss error on edit and toggle quick clear button
  tempInput.addEventListener('input', () => {
    if (!errorMessage.hidden) {
      clearError();
    }
    if (quickClearBtn) {
      quickClearBtn.hidden = tempInput.value.trim().length === 0;
    }
  });

  // Unit dropdown change listener: auto-update if valid value is present
  unitSelect.addEventListener('change', () => {
    if (tempInput.value.trim() !== '') {
      runConversion();
    }
  });
});
