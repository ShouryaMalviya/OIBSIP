/**
 * AuraCalc — Architectural Precision Calculator
 * PART 3: Calculator Interface & Core Functionality
 * Pure Vanilla JavaScript (ES6+)
 */

'use strict';

class Calculator {
  constructor() {
    // Core State Variables
    this.currentInput = '0';
    this.expression = '';
    this.isEvaluated = false;
    this.hasError = false;
    this.memoryValue = 0;
    this.isAngleDegree = true; // true = DEG, false = RAD
    this.soundEnabled = true;
    this.audioContext = null;

    // Cache DOM Elements
    this.initElements();
    // Bind Event Handlers
    this.initEventListeners();
    // Restore Saved Settings
    this.restorePreferences();
    // Initial UI Render
    this.updateDisplay();
  }

  /**
   * Initialize and cache all critical DOM references
   */
  initElements() {
    // Screen Elements
    this.displayPrimary = document.getElementById('display-primary');
    this.displayExpression = document.getElementById('display-expression');
    this.displayPreview = document.getElementById('display-preview');
    this.displayError = document.getElementById('display-error');
    this.errorMessage = document.getElementById('error-message');

    // Status Indicator Chips
    this.indicatorAngleMode = document.getElementById('indicator-angle-mode');
    this.indicatorMemory = document.getElementById('indicator-memory');
    this.indicatorStatus = document.getElementById('indicator-status');

    // Toolbar Controls
    this.themeToggleBtn = document.getElementById('btn-theme-toggle');
    this.historyToggleBtn = document.getElementById('btn-history-toggle');
    this.scientificToggleBtn = document.getElementById('btn-scientific-toggle');
    this.audioToggleBtn = document.getElementById('btn-audio-toggle');
    this.toggleAngleBtn = document.getElementById('btn-toggle-angle');

    // Panels & Drawers
    this.scientificTray = document.getElementById('scientific-tray');
    this.historyPanel = document.getElementById('history-panel');
    this.historyList = document.getElementById('history-list');
    this.historyEmptyMessage = document.getElementById('history-empty-message');
    this.btnClearHistory = document.getElementById('btn-clear-history');
    this.btnCloseHistory = document.getElementById('btn-close-history');

    // Keypads & Ribbons
    this.keypad = document.querySelector('.calculator-keypad');
    this.memoryRibbon = document.querySelector('.memory-ribbon');
    this.btnClear = document.getElementById('btn-clear');
    this.btnEquals = document.getElementById('btn-equals');

    // Icons
    this.iconSun = document.querySelector('.icon-sun');
    this.iconMoon = document.querySelector('.icon-moon');
    this.iconSoundOn = document.querySelector('.icon-sound-on');
    this.iconSoundOff = document.querySelector('.icon-sound-off');
  }

  /**
   * Bind event handlers cleanly using addEventListener (No inline HTML events)
   */
  initEventListeners() {
    // Primary Keypad Event Delegation
    this.keypad.addEventListener('click', (e) => this.handleKeypadClick(e));

    // Scientific Tray Event Delegation
    if (this.scientificTray) {
      this.scientificTray.addEventListener('click', (e) => this.handleScientificClick(e));
    }

    // Memory Ribbon Delegation
    if (this.memoryRibbon) {
      this.memoryRibbon.addEventListener('click', (e) => this.handleMemoryClick(e));
    }

    // Toolbar Utility Buttons
    this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
    this.scientificToggleBtn.addEventListener('click', () => this.toggleScientificTray());
    this.historyToggleBtn.addEventListener('click', () => this.toggleHistoryDrawer(true));
    this.audioToggleBtn.addEventListener('click', () => this.toggleAudio());
    if (this.toggleAngleBtn) {
      this.toggleAngleBtn.addEventListener('click', () => this.toggleAngleMode());
    }

    // History Drawer Actions
    this.btnCloseHistory.addEventListener('click', () => this.toggleHistoryDrawer(false));
    this.btnClearHistory.addEventListener('click', () => this.clearHistory());
    this.historyList.addEventListener('click', (e) => this.handleHistoryClick(e));

    // Hardware Keyboard Navigation
    window.addEventListener('keydown', (e) => this.handleKeyboardInput(e));
  }

  /**
   * Synthesize acoustic tactile click feedback using Web Audio API
   */
  playBeep(freq = 520, type = 'sine', duration = 0.04) {
    if (!this.soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!this.audioContext) {
        this.audioContext = new AudioCtx();
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);

      gain.gain.setValueAtTime(0.04, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      osc.start();
      osc.stop(this.audioContext.currentTime + duration);
    } catch {
      // AudioContext unavailable or restricted
    }
  }

  /**
   * Helper: Get the current active numeric token being typed
   */
  getCurrentNumberSegment() {
    const parts = this.currentInput.split(/[\+\−\×\÷\^\(\)\s]+/);
    return parts[parts.length - 1] || '';
  }

  /**
   * A & B. Handle Primary Keypad Interactions
   */
  handleKeypadClick(e) {
    const btn = e.target.closest('button');
    if (!btn) return;

    // Reset error state on any new interaction
    if (this.hasError) {
      this.hideError();
    }

    const action = btn.dataset.action;
    const value = btn.dataset.value;
    const type = btn.dataset.type;

    if (type === 'digit') {
      this.appendDigit(value);
      this.playBeep(520, 'sine', 0.03);
    } else if (action === 'decimal') {
      this.appendDecimal();
      this.playBeep(520, 'sine', 0.03);
    } else if (action === 'operator') {
      this.appendOperator(btn.dataset.operator || value);
      this.playBeep(580, 'sine', 0.04);
    } else if (action === 'clear') {
      this.clearAll();
      this.playBeep(400, 'sine', 0.05);
    } else if (action === 'backspace') {
      this.backspace();
      this.playBeep(460, 'sine', 0.03);
    } else if (action === 'equals') {
      this.calculateResult();
      this.playBeep(700, 'sine', 0.06);
    } else if (action === 'negate') {
      this.toggleSign();
      this.playBeep(540, 'sine', 0.03);
    } else if (action === 'percent') {
      this.applyPercentage();
      this.playBeep(540, 'sine', 0.03);
    } else if (action === 'open-parenthesis') {
      this.appendParenthesis('(');
      this.playBeep(520, 'sine', 0.03);
    } else if (action === 'close-parenthesis') {
      this.appendParenthesis(')');
      this.playBeep(520, 'sine', 0.03);
    }

    this.updateDisplay();
  }

  /**
   * B. Numeric Input: Append digits (0-9, 00)
   * Requirements:
   * - Prevent unintended leading zeros (e.g. '0' then '5' becomes '5')
   * - Starting a fresh calculation if following an evaluated result
   * - Handling '00' without producing redundant zeros
   */
  appendDigit(digit) {
    // If user previously pressed '=', start a brand new calculation
    if (this.isEvaluated) {
      this.currentInput = digit === '00' ? '0' : digit;
      this.expression = '';
      this.isEvaluated = false;
      return;
    }

    // Standalone zero replacement: '0' -> '5'
    if (this.currentInput === '0') {
      this.currentInput = digit === '00' ? '0' : digit;
      return;
    }

    // Negative zero replacement: '-0' -> '-5'
    if (this.currentInput === '-0') {
      this.currentInput = '-' + (digit === '00' ? '0' : digit);
      return;
    }

    // Trailing zero after operator: e.g. "12 + 0" -> "12 + 5"
    if (/\s0$/.test(this.currentInput)) {
      if (digit === '0' || digit === '00') {
        // Do not add extra zeros to a standalone ' 0'
        return;
      }
      this.currentInput = this.currentInput.slice(0, -1) + digit;
      return;
    }

    // Prevent multiple zeros when user taps '00' on '0'
    if (digit === '00') {
      const currentSegment = this.getCurrentNumberSegment();
      if (currentSegment === '' || currentSegment === '0') {
        this.currentInput += '0';
        return;
      }
    }

    this.currentInput += digit;
  }

  /**
   * B. Numeric Input: Append decimal point (.)
   * Requirements:
   * - Prevent multiple decimal points within a single number
   * - Support numbers starting with a decimal (e.g. '.5' -> '0.5')
   * - Support decimal immediately after operators ('12 + .' -> '12 + 0.')
   */
  appendDecimal() {
    // If following evaluated result, start fresh with '0.'
    if (this.isEvaluated) {
      this.currentInput = '0.';
      this.expression = '';
      this.isEvaluated = false;
      return;
    }

    const currentSegment = this.getCurrentNumberSegment();

    // Prevent multiple decimals in the active number
    if (currentSegment.includes('.')) {
      return;
    }

    // If current segment is empty, or ends with an operator/space, prefix with 0
    if (currentSegment === '' || currentSegment === '-') {
      this.currentInput += '0.';
    } else {
      this.currentInput += '.';
    }
  }

  /**
   * C. Arithmetic Operators: (+, −, ×, ÷)
   * Requirements:
   * - Associating operators with operands
   * - Chaining from evaluated results seamlessly
   * - Operator replacement if changed repeatedly (e.g. '12 + ' then '×' -> '12 × ')
   */
  appendOperator(op) {
    // If following evaluated result, chain from the result
    if (this.isEvaluated) {
      this.isEvaluated = false;
      this.expression = `${this.currentInput} ${op} `;
      this.currentInput = `${this.currentInput} ${op} `;
      return;
    }

    const trimmed = this.currentInput.trimEnd();
    const lastChar = trimmed.slice(-1);
    const operators = ['+', '−', '×', '÷', '^'];

    // Operator replacement when user changes their mind
    if (operators.includes(lastChar)) {
      // Check if preceded by space (standard binary operator)
      const lastOpIndex = this.currentInput.lastIndexOf(lastChar);
      this.currentInput = this.currentInput.slice(0, lastOpIndex) + op + ' ';
      return;
    }

    // Do not append binary operator immediately after an open parenthesis '('
    if (lastChar === '(') {
      if (op === '−') {
        // Allow negative sign after open parenthesis
        this.currentInput += '-';
      }
      return;
    }

    // Append binary operator with balanced spacing
    if (this.currentInput !== '') {
      this.currentInput += ` ${op} `;
    } else {
      this.currentInput = `0 ${op} `;
    }
  }

  /**
   * Handle Parentheses
   */
  appendParenthesis(paren) {
    if (this.isEvaluated) {
      this.currentInput = paren;
      this.expression = '';
      this.isEvaluated = false;
      return;
    }

    if (this.currentInput === '0' && paren === '(') {
      this.currentInput = '(';
    } else {
      this.currentInput += paren;
    }
  }

  /**
   * Toggle positive / negative sign (±)
   * Handles both single numbers and sub-expressions
   */
  toggleSign() {
    if (this.currentInput === '0') return;

    // If single number
    if (/^-?\d+(\.\d+)?$/.test(this.currentInput)) {
      if (this.currentInput.startsWith('-')) {
        this.currentInput = this.currentInput.slice(1);
      } else {
        this.currentInput = '-' + this.currentInput;
      }
      return;
    }

    // If multi-token expression, toggle the last operand
    const match = this.currentInput.match(/(.*[\+\−\×\÷\^\(]\s*)(-?\d+(\.\d+)?)$/);
    if (match) {
      const prefix = match[1];
      const numStr = match[2];
      if (numStr.startsWith('-')) {
        this.currentInput = prefix + numStr.slice(1);
      } else {
        this.currentInput = prefix + `(-${numStr})`;
      }
    }
  }

  /**
   * Apply percentage (%)
   */
  applyPercentage() {
    try {
      const currentSegment = this.getCurrentNumberSegment();
      if (!currentSegment) return;

      const val = parseFloat(currentSegment);
      if (!isNaN(val)) {
        const percentVal = String(val / 100);
        const lastIndex = this.currentInput.lastIndexOf(currentSegment);
        this.currentInput = this.currentInput.slice(0, lastIndex) + percentVal;
      }
    } catch {
      this.showError('Percent calculation error');
    }
  }

  /**
   * D. Control Button: Clear (C / AC)
   * Requirements:
   * - Reset the current calculation
   * - Clear the expression and return calculator to initial state
   */
  clearAll() {
    this.currentInput = '0';
    this.expression = '';
    this.isEvaluated = false;
    this.hasError = false;
    this.displayPreview.textContent = '\u00A0';
    this.hideError();
  }

  /**
   * D. Control Button: Backspace (⌫)
   * Requirements:
   * - Remove the last character from current input
   * - Handle empty input gracefully (revert to '0')
   * - Avoid leaving calculator in an inconsistent state
   */
  backspace() {
    // If editing after an evaluation, allow modification
    if (this.isEvaluated) {
      this.isEvaluated = false;
    }

    if (this.hasError) {
      this.clearAll();
      return;
    }

    // Single digit or negative single digit returns to '0'
    if (
      this.currentInput.length <= 1 ||
      (this.currentInput.length === 2 && this.currentInput.startsWith('-'))
    ) {
      this.currentInput = '0';
      return;
    }

    // If ending with operator and spaces (e.g. "12 + "), remove the operator cleanly
    if (/\s[\+\−\×\÷\^]\s$/.test(this.currentInput)) {
      this.currentInput = this.currentInput.slice(0, -3);
      return;
    }

    // If ending with parenthesis or function tag
    if (/\b(sin|cos|tan|log|ln|sqrt)\($/.test(this.currentInput)) {
      this.currentInput = this.currentInput.replace(/\b(sin|cos|tan|log|ln|sqrt)\($/, '');
      if (this.currentInput === '') this.currentInput = '0';
      return;
    }

    // Default: remove last character
    this.currentInput = this.currentInput.slice(0, -1);

    // Clean up trailing whitespace
    if (this.currentInput.endsWith(' ')) {
      this.currentInput = this.currentInput.trimEnd();
    }

    if (this.currentInput === '' || this.currentInput === '-') {
      this.currentInput = '0';
    }
  }

  /**
   * Evaluate mathematical expression safely & accurately
   * - Replaces custom visual glyphs with standard arithmetic tokens
   * - Detects division by zero explicitly
   * - Mitigates floating-point precision anomalies
   */
  evaluateExpression(expr) {
    if (!expr || expr.trim() === '') {
      throw new Error('Empty expression');
    }

    let clean = expr.trim();

    // Prevent evaluation if ending with an operator
    if (/[\+\−\×\÷\^\(]\s*$/.test(clean)) {
      throw new Error('Incomplete expression');
    }

    // Normalize visual operators to JS math operators
    clean = clean
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/\^/g, '**');

    // Handle Scientific Functions
    clean = clean.replace(/sin\(([^)]+)\)/g, (_, val) => {
      let num = parseFloat(this.evaluateExpression(val));
      if (this.isAngleDegree) num = (num * Math.PI) / 180;
      return Math.sin(num);
    });

    clean = clean.replace(/cos\(([^)]+)\)/g, (_, val) => {
      let num = parseFloat(this.evaluateExpression(val));
      if (this.isAngleDegree) num = (num * Math.PI) / 180;
      return Math.cos(num);
    });

    clean = clean.replace(/tan\(([^)]+)\)/g, (_, val) => {
      let num = parseFloat(this.evaluateExpression(val));
      if (this.isAngleDegree) num = (num * Math.PI) / 180;
      return Math.tan(num);
    });

    clean = clean.replace(/log\(([^)]+)\)/g, (_, val) => {
      const num = parseFloat(this.evaluateExpression(val));
      if (num <= 0) throw new Error('Invalid log operand');
      return Math.log10(num);
    });

    clean = clean.replace(/ln\(([^)]+)\)/g, (_, val) => {
      const num = parseFloat(this.evaluateExpression(val));
      if (num <= 0) throw new Error('Invalid ln operand');
      return Math.log(num);
    });

    clean = clean.replace(/sqrt\(([^)]+)\)/g, (_, val) => {
      const num = parseFloat(this.evaluateExpression(val));
      if (num < 0) throw new Error('Negative square root');
      return Math.sqrt(num);
    });

    // Sanitization: Ensure only safe mathematical characters exist
    if (/[^0-9\+\-\*\/\.\(\)\s\*\^eE]/.test(clean)) {
      throw new Error('Invalid syntax');
    }

    // Check for explicit division by literal 0 before execution
    if (/\/\s*0(?![0-9\.])/.test(clean)) {
      throw new Error('Cannot divide by zero');
    }

    // Compute result in strict isolated execution
    const rawResult = Function(`'use strict'; return (${clean});`)();

    // Check finite boundary & division by zero outcome
    if (!isFinite(rawResult)) {
      throw new Error('Cannot divide by zero');
    }

    if (isNaN(rawResult)) {
      throw new Error('Invalid operation');
    }

    return this.formatResult(rawResult);
  }

  /**
   * Format numeric result to eradicate IEEE 754 float glitches (e.g. 0.1 + 0.2 = 0.3)
   */
  formatResult(val) {
    if (typeof val !== 'number') return String(val);

    // Limit precision to 12 digits to clear rounding residue
    const cleanFloat = parseFloat(Number(val.toPrecision(12)).toString());

    // Switch to clean scientific notation for extreme numbers
    if (Math.abs(cleanFloat) >= 1e14 || (Math.abs(cleanFloat) > 0 && Math.abs(cleanFloat) < 1e-6)) {
      return cleanFloat.toExponential(6).replace(/\+/, '');
    }

    return String(cleanFloat);
  }

  /**
   * D. Control Button: Equals (=)
   * Requirements:
   * - Evaluate current expression
   * - Display final result in primary display
   * - Show completed expression in secondary display
   * - Prevent evaluation when expression is incomplete or invalid
   */
  calculateResult() {
    if (this.isEvaluated) return;

    try {
      const evaluatedValue = this.evaluateExpression(this.currentInput);

      // Save to calculation history
      this.addHistoryEntry(this.currentInput, evaluatedValue);

      // Secondary display shows completed expression with '='
      this.expression = `${this.currentInput} =`;
      // Primary display shows final evaluated result
      this.currentInput = evaluatedValue;
      this.isEvaluated = true;
      this.displayPreview.textContent = '\u00A0';
    } catch (err) {
      this.showError(err.message || 'Syntax Error');
    }
  }

  /**
   * Real-time preview calculation for instant user feedback
   */
  computeLivePreview() {
    if (!this.currentInput || this.currentInput === '0' || this.isEvaluated) {
      this.displayPreview.textContent = '\u00A0';
      return;
    }

    // Only compute live preview if expression contains an operator
    if (!/[\+\−\×\÷\^]/.test(this.currentInput)) {
      this.displayPreview.textContent = '\u00A0';
      return;
    }

    try {
      const preview = this.evaluateExpression(this.currentInput);
      if (preview !== this.currentInput) {
        this.displayPreview.textContent = `= ${preview}`;
      } else {
        this.displayPreview.textContent = '\u00A0';
      }
    } catch {
      this.displayPreview.textContent = '\u00A0';
    }
  }

  /**
   * Update Display Screen & Auto-Scroll to prevent clipping long expressions
   */
  updateDisplay() {
    this.displayPrimary.textContent = this.currentInput || '0';
    this.displayExpression.textContent = this.expression || '\u00A0';

    // Auto-scroll long equations so latest characters are always visible
    this.displayPrimary.scrollLeft = this.displayPrimary.scrollWidth;
    this.displayExpression.scrollLeft = this.displayExpression.scrollWidth;

    // Toggle AC / C label on clear button dynamically
    if (this.btnClear) {
      const isInitial = this.currentInput === '0' && this.expression === '';
      this.btnClear.textContent = isInitial ? 'AC' : 'C';
      this.btnClear.setAttribute('aria-label', isInitial ? 'All Clear (AC)' : 'Clear (C)');
    }

    this.computeLivePreview();
  }

  /**
   * Display Error Banner & update accessibility attributes
   */
  showError(msg) {
    this.hasError = true;
    this.errorMessage.textContent = msg;
    this.displayError.hidden = false;
    this.indicatorStatus.textContent = 'ERROR';
    this.indicatorStatus.style.color = 'var(--maroon)';
  }

  /**
   * Dismiss Error Banner cleanly
   */
  hideError() {
    this.hasError = false;
    this.displayError.hidden = true;
    this.indicatorStatus.textContent = 'READY';
    this.indicatorStatus.style.color = 'var(--deep-teal)';
  }

  /**
   * Scientific Keypad Functions
   */
  handleScientificClick(e) {
    const btn = e.target.closest('button');
    if (!btn) return;

    this.playBeep(640, 'triangle', 0.04);
    this.hideError();

    const action = btn.dataset.action;
    if (action === 'toggle-angle') return;

    if (this.isEvaluated && action !== 'square' && action !== 'reciprocal') {
      this.currentInput = '0';
      this.expression = '';
      this.isEvaluated = false;
    }

    switch (action) {
      case 'sin':
      case 'cos':
      case 'tan':
      case 'ln':
      case 'log':
      case 'sqrt':
        this.applyPrefixFunction(action);
        break;
      case 'square':
        this.applySquare();
        break;
      case 'power':
        this.appendOperator('^');
        break;
      case 'pi':
        this.insertConstant(Math.PI);
        break;
      case 'euler':
        this.insertConstant(Math.E);
        break;
      case 'reciprocal':
        this.applyReciprocal();
        break;
      default:
        break;
    }

    this.updateDisplay();
  }

  applyPrefixFunction(fn) {
    if (this.currentInput === '0') {
      this.currentInput = `${fn}(`;
    } else {
      this.currentInput += `${fn}(`;
    }
  }

  applySquare() {
    try {
      const val = parseFloat(this.currentInput);
      if (!isNaN(val)) {
        this.expression = `(${val})²`;
        this.currentInput = this.formatResult(Math.pow(val, 2));
        this.isEvaluated = true;
      }
    } catch {
      this.showError('Square error');
    }
  }

  applyReciprocal() {
    try {
      const val = parseFloat(this.currentInput);
      if (val === 0) {
        this.showError('Cannot divide by zero');
        return;
      }
      if (!isNaN(val)) {
        this.expression = `1/(${val})`;
        this.currentInput = this.formatResult(1 / val);
        this.isEvaluated = true;
      }
    } catch {
      this.showError('Reciprocal error');
    }
  }

  insertConstant(constVal) {
    const formatted = this.formatResult(constVal);
    if (this.currentInput === '0' || this.isEvaluated) {
      this.currentInput = formatted;
      this.isEvaluated = false;
    } else {
      this.currentInput += formatted;
    }
  }

  /**
   * Memory Ribbon Operations
   */
  handleMemoryClick(e) {
    const btn = e.target.closest('button');
    if (!btn) return;

    this.playBeep(480, 'sine', 0.05);
    const action = btn.dataset.action;
    const currentVal = parseFloat(this.currentInput) || 0;

    switch (action) {
      case 'memory-clear':
        this.memoryValue = 0;
        this.indicatorMemory.hidden = true;
        break;
      case 'memory-recall':
        this.currentInput = this.formatResult(this.memoryValue);
        this.isEvaluated = false;
        break;
      case 'memory-add':
        this.memoryValue += currentVal;
        this.indicatorMemory.hidden = this.memoryValue === 0;
        break;
      case 'memory-subtract':
        this.memoryValue -= currentVal;
        this.indicatorMemory.hidden = this.memoryValue === 0;
        break;
    }
    this.updateDisplay();
  }

  /**
   * Calculation History Operations
   */
  addHistoryEntry(expr, result) {
    if (this.historyEmptyMessage) {
      if (typeof this.historyEmptyMessage.remove === 'function') {
        this.historyEmptyMessage.remove();
      } else if (this.historyEmptyMessage.parentNode) {
        this.historyEmptyMessage.parentNode.removeChild(this.historyEmptyMessage);
      }
      this.historyEmptyMessage = null;
    }

    if (!this.historyList || typeof this.historyList.prepend !== 'function') return;

    const li = document.createElement('li');
    li.className = 'history-item';
    li.setAttribute('tabindex', '0');
    li.setAttribute('role', 'button');
    li.setAttribute('aria-label', `Expression ${expr} equals ${result}`);
    li.setAttribute('data-expr', expr);
    li.setAttribute('data-result', result);

    li.innerHTML = `
      <div class="history-item__expr">${expr} =</div>
      <div class="history-item__result">${result}</div>
    `;

    this.historyList.prepend(li);
  }

  handleHistoryClick(e) {
    const item = e.target.closest('.history-item');
    if (!item) return;

    this.currentInput = item.getAttribute('data-result') || item.dataset?.result || '0';
    this.expression = (item.getAttribute('data-expr') || item.dataset?.expr || '') + ' =';
    this.isEvaluated = true;
    this.updateDisplay();
    this.toggleHistoryDrawer(false);
  }

  clearHistory() {
    this.historyList.innerHTML = `
      <li class="history-empty" id="history-empty-message">
        <div class="history-empty__icon" aria-hidden="true">🕒</div>
        <p class="history-empty__text">No calculations saved yet</p>
        <span class="history-empty__sub">Calculations will appear here automatically</span>
      </li>
    `;
    this.historyEmptyMessage = document.getElementById('history-empty-message');
  }

  /**
   * Hardware Keyboard Event Handler & Visual Feedback
   */
  handleKeyboardInput(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const key = e.key;
    let handled = true;

    if (/[0-9]/.test(key)) {
      this.appendDigit(key);
      this.playBeep(520, 'sine', 0.03);
    } else if (key === '+') {
      this.appendOperator('+');
      this.playBeep(580, 'sine', 0.04);
    } else if (key === '-') {
      this.appendOperator('−');
      this.playBeep(580, 'sine', 0.04);
    } else if (key === '*' || key === 'x' || key === 'X') {
      this.appendOperator('×');
      this.playBeep(580, 'sine', 0.04);
    } else if (key === '/') {
      this.appendOperator('÷');
      this.playBeep(580, 'sine', 0.04);
    } else if (key === '.' || key === ',') {
      this.appendDecimal();
      this.playBeep(520, 'sine', 0.03);
    } else if (key === 'Enter' || key === '=') {
      this.calculateResult();
      this.playBeep(700, 'sine', 0.06);
    } else if (key === 'Backspace') {
      this.backspace();
      this.playBeep(460, 'sine', 0.03);
    } else if (key === 'Escape' || key === 'c' || key === 'C') {
      this.clearAll();
      this.playBeep(400, 'sine', 0.05);
    } else if (key === '(' || key === ')') {
      this.appendParenthesis(key);
      this.playBeep(520, 'sine', 0.03);
    } else if (key === '%') {
      this.applyPercentage();
      this.playBeep(540, 'sine', 0.03);
    } else {
      handled = false;
    }

    if (handled) {
      e.preventDefault();
      this.highlightKey(key);
      this.updateDisplay();
    }
  }

  /**
   * Highlight button corresponding to pressed hardware key
   */
  highlightKey(key) {
    let selector = null;
    if (/[0-9]/.test(key)) {
      selector = `button[data-value="${key}"]`;
    } else if (key === '+') {
      selector = 'button[data-operator="+"]';
    } else if (key === '-') {
      selector = 'button[data-operator="−"]';
    } else if (key === '*' || key === 'x' || key === 'X') {
      selector = 'button[data-operator="×"]';
    } else if (key === '/') {
      selector = 'button[data-operator="÷"]';
    } else if (key === '.' || key === ',') {
      selector = 'button[data-action="decimal"]';
    } else if (key === 'Enter' || key === '=') {
      selector = '#btn-equals';
    } else if (key === 'Backspace') {
      selector = '#btn-backspace';
    } else if (key === 'Escape' || key === 'c' || key === 'C') {
      selector = '#btn-clear';
    }

    if (selector) {
      const btn = document.querySelector(selector);
      if (btn) {
        btn.classList.add('btn-active');
        setTimeout(() => btn.classList.remove('btn-active'), 120);
      }
    }
  }

  /**
   * Drawer & Settings Toggles
   */
  toggleTheme() {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';

    html.setAttribute('data-theme', newTheme);
    this.iconSun.style.display = newTheme === 'light' ? 'none' : 'block';
    this.iconMoon.style.display = newTheme === 'light' ? 'block' : 'none';
    localStorage.setItem('auracalc_theme', newTheme);
  }

  toggleScientificTray() {
    const isCollapsed = this.scientificTray.getAttribute('data-collapsed') === 'true';
    this.scientificTray.setAttribute('data-collapsed', String(!isCollapsed));
    this.scientificToggleBtn.setAttribute('aria-pressed', String(isCollapsed));
  }

  toggleAngleMode() {
    this.isAngleDegree = !this.isAngleDegree;
    this.indicatorAngleMode.textContent = this.isAngleDegree ? 'DEG' : 'RAD';
  }

  toggleAudio() {
    this.soundEnabled = !this.soundEnabled;
    this.audioToggleBtn.setAttribute('aria-pressed', String(this.soundEnabled));
    this.iconSoundOn.style.display = this.soundEnabled ? 'block' : 'none';
    this.iconSoundOff.style.display = this.soundEnabled ? 'none' : 'block';
    localStorage.setItem('auracalc_sound', String(this.soundEnabled));
  }

  toggleHistoryDrawer(open) {
    if (open) {
      this.historyPanel.classList.add('is-open');
      this.historyPanel.setAttribute('aria-hidden', 'false');
      this.historyToggleBtn.setAttribute('aria-expanded', 'true');
    } else {
      this.historyPanel.classList.remove('is-open');
      this.historyPanel.setAttribute('aria-hidden', 'true');
      this.historyToggleBtn.setAttribute('aria-expanded', 'false');
    }
  }

  restorePreferences() {
    const savedSound = localStorage.getItem('auracalc_sound');
    if (savedSound !== null) {
      this.soundEnabled = savedSound === 'true';
      this.audioToggleBtn.setAttribute('aria-pressed', String(this.soundEnabled));
      this.iconSoundOn.style.display = this.soundEnabled ? 'block' : 'none';
      this.iconSoundOff.style.display = this.soundEnabled ? 'none' : 'block';
    }
  }
}

// Instantiate on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  window.auraCalc = new Calculator();
});
