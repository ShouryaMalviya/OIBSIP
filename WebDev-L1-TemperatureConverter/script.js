/**
 * Temperature Converter Engine - Vanilla JavaScript
 * Part 4: Comprehensive Real-Time Validation & Edge-Case Handling
 */

// ============================================================================
// 1. Physical Constants & Pure Calculation Functions
// ============================================================================

/**
 * Absolute zero limits defined specifically for each supported unit.
 * Used for strict pre-conversion physical validation.
 */
const ABSOLUTE_ZERO = {
  celsius: { min: -273.15, symbol: '°C' },
  fahrenheit: { min: -459.67, symbol: '°F' },
  kelvin: { min: 0, symbol: 'K' }
};

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
 * Normalizes any supported input unit into a standard Celsius base.
 * @param {number} value
 * @param {string} unit - 'celsius' | 'fahrenheit' | 'kelvin'
 * @returns {number}
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
 * Calculates Celsius, Fahrenheit, and Kelvin simultaneously.
 * Protects against floating-point precision quirks such as -0.00.
 * @param {number} value
 * @param {string} unit - 'celsius' | 'fahrenheit' | 'kelvin'
 * @returns {{celsius: number, fahrenheit: number, kelvin: number}}
 */
function calculateTemperatures(value, unit) {
  let celsius = toStandardCelsius(value, unit);
  let fahrenheit = celsiusToFahrenheit(celsius);
  let kelvin = celsiusToKelvin(celsius);

  // Normalize floating-point near-zero values to clean 0 (avoids -0.00)
  if (Math.abs(celsius) < 1e-10) celsius = 0;
  if (Math.abs(fahrenheit) < 1e-10) fahrenheit = 0;
  if (Math.abs(kelvin) < 1e-10) kelvin = 0;

  return { celsius, fahrenheit, kelvin };
}

/**
 * Formats a numeric temperature to exactly two decimal places.
 * Guarantees no NaN, Infinity, or unintended floating-point strings appear.
 * @param {number} value
 * @returns {string}
 */
function formatTemperature(value) {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return '--';
  }
  return Number(value.toFixed(2)).toFixed(2);
}

// ============================================================================
// 2. Strict Input Validation Helpers
// ============================================================================

/**
 * Strict regex for valid signed numbers (integers or decimals).
 * Accepts: 25, -10, 36.5, -273.15, 0, +15, .5, -.5, 25.
 * Rejects: abc, hello, 25abc, --10, isolated '.', isolated '-', isolated '+', 12.3.4.
 */
const STRICT_NUMBER_REGEX = /^[+-]?(\d+(\.\d*)?|\.\d+)$/;

/**
 * Performs strict validation on the temperature input.
 * Evaluates empty input, non-numeric strings, and unit-specific physical limits.
 *
 * @param {string} rawInput - Untrimmed or trimmed input string
 * @param {string} unit - Selected unit ('celsius', 'fahrenheit', 'kelvin')
 * @returns {{isValid: boolean, value?: number, error?: string, isEmpty?: boolean, isPartial?: boolean}}
 */
function validateTemperatureInput(rawInput, unit) {
  const trimmed = rawInput.trim();

  // 1. Empty Check
  if (trimmed === '') {
    return {
      isValid: false,
      isEmpty: true,
      error: 'Please enter a temperature.'
    };
  }

  // 2. Partial Input Check (during typing: single sign or isolated dot)
  if (trimmed === '-' || trimmed === '+' || trimmed === '.') {
    return {
      isValid: false,
      isPartial: true,
      error: 'Please enter a valid numeric temperature.'
    };
  }

  // 3. Strict Syntax & Non-Numeric Validation
  // Rejects 25abc, abc, --10, 12.3.4, etc. without relying on permissive parseFloat()
  if (!STRICT_NUMBER_REGEX.test(trimmed)) {
    return {
      isValid: false,
      error: 'Please enter a valid numeric temperature.'
    };
  }

  const numericValue = Number(trimmed);
  if (isNaN(numericValue) || !isFinite(numericValue)) {
    return {
      isValid: false,
      error: 'Please enter a valid numeric temperature.'
    };
  }

  // 4. Absolute Zero Physical Limit Check
  // Compare original input value directly against applicable unit threshold
  const unitLimit = ABSOLUTE_ZERO[unit];
  if (unitLimit && numericValue < unitLimit.min) {
    return {
      isValid: false,
      error: 'This temperature is below absolute zero. Please enter a physically valid temperature.'
    };
  }

  return {
    isValid: true,
    value: numericValue
  };
}

// ============================================================================
// 3. Application Lifecycle & Real-Time Controller
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // DOM References
  const form = document.getElementById('converter-form');
  const tempInput = document.getElementById('temperature-input');
  const unitSelect = document.getElementById('unit-select');
  const resetBtn = document.getElementById('reset-btn');
  const quickClearBtn = document.getElementById('quick-clear-btn');
  const errorMessage = document.getElementById('error-message');
  const resultsPlaceholder = document.getElementById('results-placeholder');

  // Result card display elements
  const celsiusResult = document.getElementById('celsius-result');
  const fahrenheitResult = document.getElementById('fahrenheit-result');
  const kelvinResult = document.getElementById('kelvin-result');

  /**
   * Displays an accessible error message and applies invalid styles.
   * @param {string} message
   * @param {boolean} shouldFocus - Whether to shift keyboard focus to the input
   */
  function showError(message, shouldFocus = false) {
    errorMessage.textContent = message;
    errorMessage.hidden = false;
    tempInput.setAttribute('aria-invalid', 'true');
    tempInput.classList.add('is-invalid');
    if (shouldFocus) {
      tempInput.focus();
    }
  }

  /**
   * Clears active error messages and removes invalid styling.
   */
  function clearError() {
    errorMessage.textContent = '';
    errorMessage.hidden = true;
    tempInput.removeAttribute('aria-invalid');
    tempInput.classList.remove('is-invalid');
  }

  /**
   * Resets result cards to placeholder state so obsolete results do not linger.
   */
  function clearResults() {
    celsiusResult.textContent = '--';
    fahrenheitResult.textContent = '--';
    kelvinResult.textContent = '--';
    if (resultsPlaceholder) {
      resultsPlaceholder.hidden = false;
    }
  }

  /**
   * Renders calculated results onto the three unit cards.
   * @param {{celsius: number, fahrenheit: number, kelvin: number}} results
   */
  function displayResults(results) {
    celsiusResult.textContent = formatTemperature(results.celsius);
    fahrenheitResult.textContent = formatTemperature(results.fahrenheit);
    kelvinResult.textContent = formatTemperature(results.kelvin);
    if (resultsPlaceholder) {
      resultsPlaceholder.hidden = true;
    }
  }

  /**
   * Performs real-time validation as the user types or edits the input.
   * - Clears obsolete errors as soon as input becomes valid.
   * - Does not show misleading errors for an untouched or freshly cleared empty field.
   * - Ensures previous results do not linger and falsely represent invalid/partial input.
   */
  function handleRealtimeInput() {
    const rawValue = tempInput.value;
    const trimmed = rawValue.trim();

    // Toggle in-field quick clear button visibility
    if (quickClearBtn) {
      quickClearBtn.hidden = trimmed.length === 0;
    }

    // 1. If field is empty: clear errors & clear old results (no misleading empty error while typing)
    if (trimmed === '') {
      clearError();
      clearResults();
      return;
    }

    // 2. If intermediate typing state (e.g. typing '-' before a negative number):
    if (trimmed === '-' || trimmed === '+' || trimmed === '.') {
      clearError();
      clearResults();
      return;
    }

    // 3. Validate current input against selected unit
    const validation = validateTemperatureInput(trimmed, unitSelect.value);

    if (!validation.isValid) {
      // Input is definitively invalid (e.g. "abc", "25abc", "--10", or below absolute zero)
      showError(validation.error, false);
      clearResults();
    } else {
      // Input is valid: clear obsolete error immediately and update conversions
      clearError();
      const results = calculateTemperatures(validation.value, unitSelect.value);
      displayResults(results);
    }
  }

  /**
   * Handles explicit Convert submission (clicking Convert or pressing Enter).
   * Performs full validation, including empty field validation.
   * @param {Event} [e]
   */
  function handleConvert(e) {
    if (e) e.preventDefault();

    const validation = validateTemperatureInput(tempInput.value, unitSelect.value);

    if (!validation.isValid) {
      showError(validation.error, true);
      clearResults();
      return;
    }

    clearError();
    const results = calculateTemperatures(validation.value, unitSelect.value);
    displayResults(results);
  }

  /**
   * Resets all inputs, dropdown, errors, and restores the initial placeholder UI.
   */
  function handleReset() {
    clearError();
    tempInput.value = '';
    unitSelect.value = 'celsius';
    clearResults();

    if (quickClearBtn) {
      quickClearBtn.hidden = true;
    }

    tempInput.focus();
  }

  // ==========================================================================
  // 4. Event Listeners
  // ==========================================================================

  // Form submit (Convert button click / keyboard Enter submission)
  form.addEventListener('submit', handleConvert);

  // Keyboard Enter key within the temperature input field
  tempInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConvert();
    }
  });

  // Real-time input monitoring for immediate validation and results synchronization
  tempInput.addEventListener('input', handleRealtimeInput);

  // Unit dropdown change listener: re-evaluates validation against newly selected unit
  unitSelect.addEventListener('change', () => {
    if (tempInput.value.trim() !== '') {
      handleRealtimeInput();
    }
  });

  // Clear / Reset button click
  resetBtn.addEventListener('click', (e) => {
    e.preventDefault();
    handleReset();
  });

  // In-field quick clear button click
  if (quickClearBtn) {
    quickClearBtn.addEventListener('click', () => {
      tempInput.value = '';
      quickClearBtn.hidden = true;
      clearError();
      clearResults();
      tempInput.focus();
    });
  }
});
