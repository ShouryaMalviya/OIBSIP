/**
 * AuraCalc — Modern Precision Calculator
 * Core Logic & Interactive Controller
 * Pure Vanilla JavaScript (ES6+)
 */

'use strict';

class Calculator {
  constructor() {
    // State management
    this.currentInput = '0';
    this.expression = '';
    this.lastResult = null;
    this.memoryValue = 0;
    this.isAngleDegree = true; // true = DEG, false = RAD
    this.soundEnabled = true;
    this.audioContext = null;

    // Cache DOM Elements
    this.initElements();
    // Bind Event Listeners
    this.initEventListeners();
    // Check local storage for preferences
    this.restorePreferences();
    // Initial UI render
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

    // Indicator Elements
    this.indicatorAngleMode = document.getElementById('indicator-angle-mode');
    this.indicatorMemory = document.getElementById('indicator-memory');
    this.indicatorStatus = document.getElementById('indicator-status');

    // Controls & Toolbars
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

    // Keypads
    this.keypad = document.querySelector('.calculator-keypad');
    this.memoryRibbon = document.querySelector('.memory-ribbon');

    // Theme icons
    this.iconSun = document.querySelector('.icon-sun');
    this.iconMoon = document.querySelector('.icon-moon');
    this.iconSoundOn = document.querySelector('.icon-sound-on');
    this.iconSoundOff = document.querySelector('.icon-sound-off');
  }

  /**
   * Bind event handlers to keypad, toolbar, and global keyboard
   */
  initEventListeners() {
    // Keypad Event Delegation
    this.keypad.addEventListener('click', (e) => this.handleKeypadClick(e));

    // Scientific Tray Event Delegation
    if (this.scientificTray) {
      this.scientificTray.addEventListener('click', (e) => this.handleScientificClick(e));
    }

    // Memory Ribbon Delegation
    if (this.memoryRibbon) {
      this.memoryRibbon.addEventListener('click', (e) => this.handleMemoryClick(e));
    }

    // Tool Buttons
    this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
    this.scientificToggleBtn.addEventListener('click', () => this.toggleScientificTray());
    this.historyToggleBtn.addEventListener('click', () => this.toggleHistoryDrawer(true));
    this.audioToggleBtn.addEventListener('click', () => this.toggleAudio());
    if (this.toggleAngleBtn) {
      this.toggleAngleBtn.addEventListener('click', () => this.toggleAngleMode());
    }

    // History Actions
    this.btnCloseHistory.addEventListener('click', () => this.toggleHistoryDrawer(false));
    this.btnClearHistory.addEventListener('click', () => this.clearHistory());
    this.historyList.addEventListener('click', (e) => this.handleHistoryClick(e));

    // Global Keyboard Support
    window.addEventListener('keydown', (e) => this.handleKeyboardInput(e));
  }

  /**
   * Subtle Web Audio API synthesis for tactile acoustic feedback
   */
  playBeep(freq = 440, type = 'sine', duration = 0.05) {
    if (!this.soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
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
   * Handle primary keypad clicks
   */
  handleKeypadClick(e) {
    const btn = e.target.closest('button');
    if (!btn) return;

    this.playBeep(520, 'sine', 0.04);
    this.hideError();

    const action = btn.dataset.action;
    const value = btn.dataset.value;
    const type = btn.dataset.type;

    if (type === 'digit') {
      this.appendDigit(value);
    } else if (action === 'operator') {
      this.appendOperator(btn.dataset.operator || value);
    } else if (action === 'decimal') {
      this.appendDecimal();
    } else if (action === 'clear') {
      this.clearAll();
    } else if (action === 'backspace') {
      this.backspace();
    } else if (action === 'equals') {
      this.calculateResult();
    } else if (action === 'negate') {
      this.toggleSign();
    } else if (action === 'percent') {
      this.applyPercentage();
    } else if (action === 'open-parenthesis') {
      this.appendParenthesis('(');
    } else if (action === 'close-parenthesis') {
      this.appendParenthesis(')');
    }

    this.updateDisplay();
  }

  /**
   * Handle Scientific Tray clicks
   */
  handleScientificClick(e) {
    const btn = e.target.closest('button');
    if (!btn) return;

    this.playBeep(640, 'triangle', 0.05);
    this.hideError();

    const action = btn.dataset.action;
    if (action === 'toggle-angle') return;

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

  /**
   * Handle memory button clicks
   */
  handleMemoryClick(e) {
    const btn = e.target.closest('button');
    if (!btn) return;

    this.playBeep(480, 'sine', 0.06);
    const action = btn.dataset.action;
    const currentVal = parseFloat(this.currentInput) || 0;

    switch (action) {
      case 'memory-clear':
        this.memoryValue = 0;
        this.indicatorMemory.hidden = true;
        break;
      case 'memory-recall':
        this.currentInput = String(this.memoryValue);
        break;
      case 'memory-add':
        this.memoryValue += currentVal;
        this.indicatorMemory.hidden = (this.memoryValue === 0);
        break;
      case 'memory-subtract':
        this.memoryValue -= currentVal;
        this.indicatorMemory.hidden = (this.memoryValue === 0);
        break;
    }
    this.updateDisplay();
  }

  /**
   * Append digit (0-9, 00)
   */
  appendDigit(digit) {
    if (this.currentInput === '0' && digit !== '.') {
      this.currentInput = digit;
    } else if (this.currentInput === '-0' && digit !== '.') {
      this.currentInput = '-' + digit;
    } else {
      this.currentInput += digit;
    }
  }

  /**
   * Append decimal point safely
   */
  appendDecimal() {
    // Find the current active numeric segment
    const parts = this.currentInput.split(/[\+\−\×\÷\^\(\)]/);
    const lastPart = parts[parts.length - 1];

    if (!lastPart.includes('.')) {
      if (lastPart === '' || lastPart === '-') {
        this.currentInput += '0.';
      } else {
        this.currentInput += '.';
      }
    }
  }

  /**
   * Append binary operator (+, −, ×, ÷, ^)
   */
  appendOperator(op) {
    const lastChar = this.currentInput.trim().slice(-1);
    const operators = ['+', '−', '×', '÷', '^'];

    if (operators.includes(lastChar)) {
      // Replace existing operator
      this.currentInput = this.currentInput.trim().slice(0, -1) + ' ' + op + ' ';
    } else if (this.currentInput !== '') {
      this.currentInput += ' ' + op + ' ';
    }
  }

  /**
   * Append parentheses
   */
  appendParenthesis(paren) {
    if (this.currentInput === '0' && paren === '(') {
      this.currentInput = '(';
    } else {
      this.currentInput += paren;
    }
  }

  /**
   * Toggle sign (±)
   */
  toggleSign() {
    if (this.currentInput === '0') return;
    if (this.currentInput.startsWith('-')) {
      this.currentInput = this.currentInput.slice(1);
    } else {
      this.currentInput = '-' + this.currentInput;
    }
  }

  /**
   * Apply percentage (%)
   */
  applyPercentage() {
    try {
      const val = parseFloat(this.currentInput);
      if (!isNaN(val)) {
        this.currentInput = String(val / 100);
      }
    } catch {
      this.showError('Percent calculation error');
    }
  }

  /**
   * Scientific prefix math functions
   */
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
        this.expression = `${val}²`;
        this.currentInput = String(Math.pow(val, 2));
      }
    } catch {
      this.showError('Square calculation error');
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
        this.currentInput = String(1 / val);
      }
    } catch {
      this.showError('Reciprocal calculation error');
    }
  }

  insertConstant(constVal) {
    if (this.currentInput === '0') {
      this.currentInput = String(constVal);
    } else {
      this.currentInput += String(constVal);
    }
  }

  /**
   * Clear all inputs
   */
  clearAll() {
    this.currentInput = '0';
    this.expression = '';
    this.displayPreview.textContent = '\u00A0';
    this.hideError();
  }

  /**
   * Delete last character
   */
  backspace() {
    if (this.currentInput.length <= 1 || (this.currentInput.length === 2 && this.currentInput.startsWith('-'))) {
      this.currentInput = '0';
    } else {
      // Remove trailing space if after operator
      if (this.currentInput.endsWith(' ')) {
        this.currentInput = this.currentInput.trimEnd();
      }
      this.currentInput = this.currentInput.slice(0, -1).trimEnd();
      if (this.currentInput === '') this.currentInput = '0';
    }
  }

  /**
   * Evaluate mathematical expression safely
   */
  evaluateExpression(expr) {
    // Normalize custom operators to standard JS operators
    let clean = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/\^/g, '**');

    // Handle scientific functions
    clean = clean.replace(/sin\(([^)]+)\)/g, (_, val) => {
      let num = parseFloat(val);
      if (this.isAngleDegree) num = (num * Math.PI) / 180;
      return Math.sin(num);
    });

    clean = clean.replace(/cos\(([^)]+)\)/g, (_, val) => {
      let num = parseFloat(val);
      if (this.isAngleDegree) num = (num * Math.PI) / 180;
      return Math.cos(num);
    });

    clean = clean.replace(/tan\(([^)]+)\)/g, (_, val) => {
      let num = parseFloat(val);
      if (this.isAngleDegree) num = (num * Math.PI) / 180;
      return Math.tan(num);
    });

    clean = clean.replace(/log\(([^)]+)\)/g, (_, val) => Math.log10(parseFloat(val)));
    clean = clean.replace(/ln\(([^)]+)\)/g, (_, val) => Math.log(parseFloat(val)));
    clean = clean.replace(/sqrt\(([^)]+)\)/g, (_, val) => Math.sqrt(parseFloat(val)));

    // Prevent unsafe execution: only allow digits, operators, parens, decimal, spaces, Math
    if (/[^0-9\+\-\*\/\.\(\)\s\*\^eE]/.test(clean)) {
      throw new Error('Invalid syntax');
    }

    // Evaluate using Function constructor in isolated strict scope
    const result = Function(`'use strict'; return (${clean});`)();

    if (!isFinite(result)) {
      throw new Error('Result undefined / divide by zero');
    }

    // Round precision to eliminate floating point issues (e.g. 0.1 + 0.2 = 0.3)
    return parseFloat(result.toFixed(10));
  }

  /**
   * Compute final result
   */
  calculateResult() {
    try {
      const result = this.evaluateExpression(this.currentInput);
      const formattedResult = String(result);

      this.addHistoryEntry(this.currentInput, formattedResult);
      this.expression = `${this.currentInput} =`;
      this.currentInput = formattedResult;
      this.displayPreview.textContent = '\u00A0';
    } catch (err) {
      this.showError(err.message || 'Syntax Error');
    }
  }

  /**
   * Instant live preview for fast user feedback
   */
  computeLivePreview() {
    if (!this.currentInput || this.currentInput === '0') {
      this.displayPreview.textContent = '\u00A0';
      return;
    }

    try {
      const res = this.evaluateExpression(this.currentInput);
      if (String(res) !== this.currentInput) {
        this.displayPreview.textContent = `= ${res}`;
      } else {
        this.displayPreview.textContent = '\u00A0';
      }
    } catch {
      this.displayPreview.textContent = '\u00A0';
    }
  }

  /**
   * Update all screen labels
   */
  updateDisplay() {
    this.displayPrimary.textContent = this.currentInput || '0';
    this.displayExpression.textContent = this.expression || '\u00A0';
    this.computeLivePreview();
  }

  /**
   * Show error badge
   */
  showError(msg) {
    this.errorMessage.textContent = msg;
    this.displayError.hidden = false;
    this.indicatorStatus.textContent = 'ERROR';
    this.indicatorStatus.style.color = 'var(--maroon)';
  }

  /**
   * Hide error badge
   */
  hideError() {
    this.displayError.hidden = true;
    this.indicatorStatus.textContent = 'READY';
    this.indicatorStatus.style.color = 'var(--deep-teal)';
  }

  /**
   * Toggle between Dark and Light modes
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

  /**
   * Toggle Scientific Function tray
   */
  toggleScientificTray() {
    const isCollapsed = this.scientificTray.getAttribute('data-collapsed') === 'true';
    this.scientificTray.setAttribute('data-collapsed', String(!isCollapsed));
    this.scientificToggleBtn.setAttribute('aria-pressed', String(isCollapsed));
  }

  /**
   * Toggle DEG / RAD mode
   */
  toggleAngleMode() {
    this.isAngleDegree = !this.isAngleDegree;
    const mode = this.isAngleDegree ? 'DEG' : 'RAD';
    this.indicatorAngleMode.textContent = mode;
  }

  /**
   * Toggle audio feedback
   */
  toggleAudio() {
    this.soundEnabled = !this.soundEnabled;
    this.audioToggleBtn.setAttribute('aria-pressed', String(this.soundEnabled));
    this.iconSoundOn.style.display = this.soundEnabled ? 'block' : 'none';
    this.iconSoundOff.style.display = this.soundEnabled ? 'none' : 'block';
    localStorage.setItem('auracalc_sound', String(this.soundEnabled));
  }

  /**
   * Toggle slide-out history drawer
   */
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

  /**
   * Add a calculation to the history log
   */
  addHistoryEntry(expr, result) {
    if (this.historyEmptyMessage) {
      this.historyEmptyMessage.remove();
      this.historyEmptyMessage = null;
    }

    const li = document.createElement('li');
    li.className = 'history-item';
    li.setAttribute('tabindex', '0');
    li.setAttribute('role', 'button');
    li.setAttribute('aria-label', `Expression ${expr} equals ${result}`);
    li.dataset.expr = expr;
    li.dataset.result = result;

    li.innerHTML = `
      <div class="history-item__expr">${expr} =</div>
      <div class="history-item__result">${result}</div>
    `;

    this.historyList.prepend(li);
  }

  /**
   * History entry selection
   */
  handleHistoryClick(e) {
    const item = e.target.closest('.history-item');
    if (!item) return;

    this.currentInput = item.dataset.result;
    this.expression = item.dataset.expr + ' =';
    this.updateDisplay();
    this.toggleHistoryDrawer(false);
  }

  /**
   * Clear history
   */
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
   * Keyboard support handler
   */
  handleKeyboardInput(e) {
    // Ignore when focusing inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const key = e.key;

    if (/[0-9]/.test(key)) {
      e.preventDefault();
      this.appendDigit(key);
      this.playBeep(520, 'sine', 0.04);
    } else if (key === '+') {
      e.preventDefault();
      this.appendOperator('+');
      this.playBeep(520, 'sine', 0.04);
    } else if (key === '-') {
      e.preventDefault();
      this.appendOperator('−');
      this.playBeep(520, 'sine', 0.04);
    } else if (key === '*') {
      e.preventDefault();
      this.appendOperator('×');
      this.playBeep(520, 'sine', 0.04);
    } else if (key === '/') {
      e.preventDefault();
      this.appendOperator('÷');
      this.playBeep(520, 'sine', 0.04);
    } else if (key === '.' || key === ',') {
      e.preventDefault();
      this.appendDecimal();
      this.playBeep(520, 'sine', 0.04);
    } else if (key === 'Enter' || key === '=') {
      e.preventDefault();
      this.calculateResult();
      this.playBeep(680, 'sine', 0.08);
    } else if (key === 'Backspace') {
      e.preventDefault();
      this.backspace();
      this.playBeep(420, 'sine', 0.04);
    } else if (key === 'Escape') {
      e.preventDefault();
      this.clearAll();
      this.playBeep(380, 'sine', 0.04);
    } else if (key === '(' || key === ')') {
      e.preventDefault();
      this.appendParenthesis(key);
    } else if (key === '%') {
      e.preventDefault();
      this.applyPercentage();
    }

    this.updateDisplay();
  }

  /**
   * Restore stored theme & sound settings
   */
  restorePreferences() {
    const savedTheme = localStorage.getItem('auracalc_theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
      this.iconSun.style.display = savedTheme === 'light' ? 'none' : 'block';
      this.iconMoon.style.display = savedTheme === 'light' ? 'block' : 'none';
    }

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
