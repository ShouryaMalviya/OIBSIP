/**
 * AuraCalc — Architectural Precision Calculator
 * PART 4: Calculation Engine, Operator Handling & Error Management
 * Pure Vanilla JavaScript (ES6+) — Safe Tokenizer & Shunting-Yard Engine
 */

'use strict';

/**
 * ============================================================================
 * Safe Calculation Engine
 * Implements: Tokenizer -> Dijkstra's Shunting-Yard Algorithm -> RPN Evaluator
 * Precedence Convention: Standard Algebraic Precedence (BODMAS / PEMDAS)
 * 100% Safe: Custom AST Parser architecture without shortcuts.
 * ============================================================================
 */
class CalculationEngine {
  constructor(options = {}) {
    this.isAngleDegree = options.isAngleDegree ?? true;
  }

  setAngleDegree(isDeg) {
    this.isAngleDegree = isDeg;
  }

  /**
   * Tokenize an expression string into structured mathematical tokens
   */
  tokenize(expr) {
    if (!expr || typeof expr !== 'string') return [];

    const tokens = [];
    let i = 0;
    const len = expr.length;

    while (i < len) {
      const ch = expr[i];

      // Skip whitespace
      if (/\s/.test(ch)) {
        i++;
        continue;
      }

      // 1. Numbers (integers, floating point decimals)
      if (/[0-9]/.test(ch) || (ch === '.' && i + 1 < len && /[0-9]/.test(expr[i + 1]))) {
        let numStr = '';
        while (i < len && (/[0-9]/.test(expr[i]) || expr[i] === '.')) {
          numStr += expr[i];
          i++;
        }
        tokens.push({ type: 'NUMBER', value: parseFloat(numStr) });
        continue;
      }

      // 2. Named functions and constants (sin, cos, tan, log, ln, sqrt, pi, e)
      if (/[a-zA-Z]/.test(ch)) {
        let name = '';
        while (i < len && /[a-zA-Z]/.test(expr[i])) {
          name += expr[i];
          i++;
        }
        const lower = name.toLowerCase();
        if (lower === 'pi') {
          tokens.push({ type: 'NUMBER', value: Math.PI });
        } else if (lower === 'e') {
          tokens.push({ type: 'NUMBER', value: Math.E });
        } else if (['sin', 'cos', 'tan', 'log', 'ln', 'sqrt'].includes(lower)) {
          tokens.push({ type: 'FUNCTION', value: lower });
        } else {
          throw new Error(`Unknown token: ${name}`);
        }
        continue;
      }

      // 3. Special Constant Symbols
      if (ch === 'π') {
        tokens.push({ type: 'NUMBER', value: Math.PI });
        i++;
        continue;
      }

      // 4. Parentheses
      if (ch === '(') {
        tokens.push({ type: 'LPAREN', value: '(' });
        i++;
        continue;
      }
      if (ch === ')') {
        tokens.push({ type: 'RPAREN', value: ')' });
        i++;
        continue;
      }

      // 5. Binary & Unary Arithmetic Operators
      const isOp = ['+', '−', '-', '×', '*', '÷', '/', '^', '%'].includes(ch);
      if (isOp) {
        let opVal = ch;
        if (ch === '−') opVal = '-';
        if (ch === '×') opVal = '*';
        if (ch === '÷') opVal = '/';

        // Check if '-' denotes unary negation rather than binary subtraction
        const prev = tokens[tokens.length - 1];
        if (opVal === '-' && (!prev || prev.type === 'OPERATOR' || prev.type === 'LPAREN')) {
          tokens.push({ type: 'UNARY_NEG', value: 'neg' });
        } else {
          tokens.push({ type: 'OPERATOR', value: opVal });
        }
        i++;
        continue;
      }

      throw new Error(`Unrecognized symbol: ${ch}`);
    }

    return tokens;
  }

  /**
   * Shunting-Yard Algorithm (Dijkstra)
   * Converts Infix token stream to Reverse Polish Notation (RPN / Postfix)
   * Enforces BODMAS / PEMDAS precedence:
   * ^ (4) > * / % (3) > + - (2)
   */
  shuntingYard(tokens) {
    const outputQueue = [];
    const opStack = [];

    const precedence = {
      '+': 2,
      '-': 2,
      '*': 3,
      '/': 3,
      '%': 3,
      '^': 4,
      'neg': 5
    };

    const isRightAssociative = (op) => op === '^' || op === 'neg';

    for (const token of tokens) {
      if (token.type === 'NUMBER') {
        outputQueue.push(token);
      } else if (token.type === 'FUNCTION') {
        opStack.push(token);
      } else if (token.type === 'OPERATOR' || token.type === 'UNARY_NEG') {
        const op1 = token.value;
        const prec1 = precedence[op1];

        while (opStack.length > 0) {
          const top = opStack[opStack.length - 1];
          if (top.type === 'OPERATOR' || top.type === 'UNARY_NEG') {
            const op2 = top.value;
            const prec2 = precedence[op2];
            if (
              (isRightAssociative(op1) && prec1 < prec2) ||
              (!isRightAssociative(op1) && prec1 <= prec2)
            ) {
              outputQueue.push(opStack.pop());
            } else {
              break;
            }
          } else if (top.type === 'FUNCTION') {
            outputQueue.push(opStack.pop());
          } else {
            break;
          }
        }
        opStack.push(token);
      } else if (token.type === 'LPAREN') {
        opStack.push(token);
      } else if (token.type === 'RPAREN') {
        let foundLParen = false;
        while (opStack.length > 0) {
          const top = opStack.pop();
          if (top.type === 'LPAREN') {
            foundLParen = true;
            break;
          } else {
            outputQueue.push(top);
          }
        }
        if (!foundLParen) {
          throw new Error('Mismatched parentheses');
        }
        if (opStack.length > 0 && opStack[opStack.length - 1].type === 'FUNCTION') {
          outputQueue.push(opStack.pop());
        }
      }
    }

    while (opStack.length > 0) {
      const top = opStack.pop();
      if (top.type === 'LPAREN' || top.type === 'RPAREN') {
        throw new Error('Mismatched parentheses');
      }
      outputQueue.push(top);
    }

    return outputQueue;
  }

  /**
   * Evaluate Postfix (RPN) Token Queue
   * Implements strict division-by-zero protection and boundary validation
   */
  evaluateRPN(rpnQueue) {
    const valStack = [];

    for (const token of rpnQueue) {
      if (token.type === 'NUMBER') {
        valStack.push(token.value);
      } else if (token.type === 'UNARY_NEG') {
        if (valStack.length < 1) throw new Error('Invalid negation syntax');
        const val = valStack.pop();
        valStack.push(-val);
      } else if (token.type === 'OPERATOR') {
        if (valStack.length < 2) throw new Error('Incomplete expression');
        const b = valStack.pop();
        const a = valStack.pop();
        let res = 0;

        switch (token.value) {
          case '+':
            res = a + b;
            break;
          case '-':
            res = a - b;
            break;
          case '*':
            res = a * b;
            break;
          case '/':
            // Division-by-Zero Check
            if (Math.abs(b) < 1e-15) {
              throw new Error('Cannot divide by zero');
            }
            res = a / b;
            break;
          case '%':
            if (Math.abs(b) < 1e-15) {
              throw new Error('Cannot divide by zero');
            }
            res = a % b;
            break;
          case '^':
            res = Math.pow(a, b);
            break;
          default:
            throw new Error(`Unknown operator: ${token.value}`);
        }

        if (!isFinite(res) || isNaN(res)) {
          throw new Error('Invalid numerical result');
        }

        valStack.push(res);
      } else if (token.type === 'FUNCTION') {
        if (valStack.length < 1) throw new Error('Missing function parameter');
        const a = valStack.pop();
        let res = 0;

        switch (token.value) {
          case 'sin': {
            let angle = a;
            if (this.isAngleDegree) angle = (angle * Math.PI) / 180;
            res = Math.sin(angle);
            break;
          }
          case 'cos': {
            let angle = a;
            if (this.isAngleDegree) angle = (angle * Math.PI) / 180;
            res = Math.cos(angle);
            break;
          }
          case 'tan': {
            let angle = a;
            if (this.isAngleDegree) angle = (angle * Math.PI) / 180;
            // Catch 90 deg asymptotic singularity
            if (this.isAngleDegree && Math.abs(a % 180) === 90) {
              throw new Error('Tangent undefined at 90°');
            }
            res = Math.tan(angle);
            break;
          }
          case 'log':
            if (a <= 0) throw new Error('Cannot calculate logarithm of non-positive number');
            res = Math.log10(a);
            break;
          case 'ln':
            if (a <= 0) throw new Error('Cannot calculate natural logarithm of non-positive number');
            res = Math.log(a);
            break;
          case 'sqrt':
            if (a < 0) throw new Error('Cannot calculate square root of negative number');
            res = Math.sqrt(a);
            break;
          default:
            throw new Error(`Unknown function: ${token.value}`);
        }

        if (!isFinite(res) || isNaN(res)) {
          throw new Error('Invalid numerical result');
        }

        valStack.push(res);
      }
    }

    if (valStack.length !== 1) {
      throw new Error('Incomplete expression');
    }

    return valStack[0];
  }

  /**
   * Main Evaluation Pipeline: Tokenize -> Shunting-Yard -> RPN Evaluator
   */
  evaluate(expr) {
    if (!expr || typeof expr !== 'string' || expr.trim() === '') {
      return 0;
    }

    const trimmed = expr.trim();

    // Guard against trailing dangling operators
    if (/[\+\−\-\×\*\÷\/\^\(]\s*$/.test(trimmed)) {
      throw new Error('Incomplete expression');
    }

    const tokens = this.tokenize(trimmed);
    if (tokens.length === 0) {
      return 0;
    }

    const rpn = this.shuntingYard(tokens);
    return this.evaluateRPN(rpn);
  }
}

/**
 * ============================================================================
 * AuraCalc Interactive Controller
 * Manages State, UI Synchronization, Audio, History, and User Interactions
 * ============================================================================
 */
class Calculator {
  constructor() {
    // Core Calculation Engine (Pure, Safe, No eval)
    this.engine = new CalculationEngine({ isAngleDegree: true });

    // Interactive State
    this.currentInput = '0';
    this.expression = '';
    this.isEvaluated = false;
    this.hasError = false;
    this.memoryValue = 0;
    this.isAngleDegree = true;
    this.soundEnabled = true;
    this.audioContext = null;

    // Cache DOM Elements & Bind Listeners
    this.initElements();
    this.initEventListeners();
    this.restorePreferences();
    this.updateDisplay();
  }

  /**
   * Cache DOM Element References
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

    // Toolbar Icons
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

    // Toolbar Controls
    this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
    this.scientificToggleBtn.addEventListener('click', () => this.toggleScientificTray());
    this.historyToggleBtn.addEventListener('click', () => this.toggleHistoryDrawer(true));
    this.audioToggleBtn.addEventListener('click', () => this.toggleAudio());
    if (this.toggleAngleBtn) {
      this.toggleAngleBtn.addEventListener('click', () => this.toggleAngleMode());
    }

    // History Drawer Controls
    this.btnCloseHistory.addEventListener('click', () => this.toggleHistoryDrawer(false));
    this.btnClearHistory.addEventListener('click', () => this.clearHistory());
    this.historyList.addEventListener('click', (e) => this.handleHistoryClick(e));

    // Hardware Keyboard Input
    window.addEventListener('keydown', (e) => this.handleKeyboardInput(e));
  }

  /**
   * Audio synthesis for tactile acoustic feedback
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
      // AudioContext unavailable in silent context
    }
  }

  /**
   * Helper: Retrieve the active numerical segment being typed
   */
  getCurrentNumberSegment() {
    const parts = this.currentInput.split(/[\+\−\×\÷\^\(\)\s]+/);
    return parts[parts.length - 1] || '';
  }

  /**
   * Keypad click router
   */
  handleKeypadClick(e) {
    const btn = e.target.closest('button');
    if (!btn) return;

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
   */
  appendDigit(digit) {
    if (this.hasError) {
      this.clearAll();
    }

    // If following evaluated result, begin fresh calculation
    if (this.isEvaluated) {
      this.currentInput = digit === '00' ? '0' : digit;
      this.expression = '';
      this.isEvaluated = false;
      return;
    }

    // Replace initial standalone zero
    if (this.currentInput === '0') {
      this.currentInput = digit === '00' ? '0' : digit;
      return;
    }

    // Replace negative zero
    if (this.currentInput === '-0') {
      this.currentInput = '-' + (digit === '00' ? '0' : digit);
      return;
    }

    // Replace standalone zero following an operator (e.g., "12 + 0" -> "12 + 5")
    if (/\s0$/.test(this.currentInput)) {
      if (digit === '0' || digit === '00') {
        return;
      }
      this.currentInput = this.currentInput.slice(0, -1) + digit;
      return;
    }

    // Prevent redundant '00' on zero segment
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
   * B. Decimal Input: Append decimal point (.)
   */
  appendDecimal() {
    if (this.hasError) {
      this.clearAll();
    }

    if (this.isEvaluated) {
      this.currentInput = '0.';
      this.expression = '';
      this.isEvaluated = false;
      return;
    }

    const currentSegment = this.getCurrentNumberSegment();

    // Prevent multiple decimals in the same number
    if (currentSegment.includes('.')) {
      return;
    }

    // Interpret leading decimal (.5) as 0.5
    if (currentSegment === '' || currentSegment === '-') {
      this.currentInput += '0.';
    } else {
      this.currentInput += '.';
    }
  }

  /**
   * B & C. Operator Chaining & Operator Replacement
   */
  appendOperator(op) {
    if (this.hasError) {
      this.hideError();
    }

    // If following evaluated result, chain consecutive calculation
    if (this.isEvaluated) {
      this.isEvaluated = false;
      this.expression = `${this.currentInput} ${op} `;
      this.currentInput = `${this.currentInput} ${op} `;
      return;
    }

    const trimmed = this.currentInput.trimEnd();
    const lastChar = trimmed.slice(-1);
    const operators = ['+', '−', '×', '÷', '^'];

    // Operator replacement when user selects a different operator
    if (operators.includes(lastChar)) {
      const lastOpIndex = this.currentInput.lastIndexOf(lastChar);
      this.currentInput = this.currentInput.slice(0, lastOpIndex) + op + ' ';
      return;
    }

    // Prevent binary operators immediately following open parenthesis '('
    if (lastChar === '(') {
      if (op === '−') {
        this.currentInput += '-';
      }
      return;
    }

    if (this.currentInput !== '') {
      this.currentInput += ` ${op} `;
    } else {
      this.currentInput = `0 ${op} `;
    }
  }

  /**
   * Parentheses Input
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
   * Toggle sign (±)
   */
  toggleSign() {
    if (this.currentInput === '0') return;

    if (/^-?\d+(\.\d+)?$/.test(this.currentInput)) {
      if (this.currentInput.startsWith('-')) {
        this.currentInput = this.currentInput.slice(1);
      } else {
        this.currentInput = '-' + this.currentInput;
      }
      return;
    }

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
   * Percentage (%)
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
   */
  backspace() {
    if (this.isEvaluated) {
      this.isEvaluated = false;
    }

    if (this.hasError) {
      this.clearAll();
      return;
    }

    if (
      this.currentInput.length <= 1 ||
      (this.currentInput.length === 2 && this.currentInput.startsWith('-'))
    ) {
      this.currentInput = '0';
      return;
    }

    // Safely remove trailing binary operator with spaces (e.g., "12 + ")
    if (/\s[\+\−\×\÷\^]\s$/.test(this.currentInput)) {
      this.currentInput = this.currentInput.slice(0, -3);
      return;
    }

    // Safely remove functions
    if (/\b(sin|cos|tan|log|ln|sqrt)\($/.test(this.currentInput)) {
      this.currentInput = this.currentInput.replace(/\b(sin|cos|tan|log|ln|sqrt)\($/, '');
      if (this.currentInput === '') this.currentInput = '0';
      return;
    }

    this.currentInput = this.currentInput.slice(0, -1);

    if (this.currentInput.endsWith(' ')) {
      this.currentInput = this.currentInput.trimEnd();
    }

    if (this.currentInput === '' || this.currentInput === '-') {
      this.currentInput = '0';
    }
  }

  /**
   * D. Format Results: Eliminate IEEE 754 float glitches (0.1 + 0.2 = 0.3)
   */
  formatResult(val) {
    if (typeof val !== 'number') return String(val);

    // Limit precision to 12 significant digits to erase float residue
    const cleanFloat = parseFloat(Number(val.toPrecision(12)).toString());

    // Format extreme values into readable scientific notation
    if (Math.abs(cleanFloat) >= 1e14 || (Math.abs(cleanFloat) > 0 && Math.abs(cleanFloat) < 1e-6)) {
      return cleanFloat.toExponential(6).replace(/\+/, '');
    }

    return String(cleanFloat);
  }

  /**
   * A, B, C & D. Calculate Final Result (Safe Evaluation via CalculationEngine)
   */
  calculateResult() {
    if (this.isEvaluated) return;

    // Gracefully handle empty or initial zero input
    if (!this.currentInput || this.currentInput.trim() === '' || this.currentInput === '0') {
      this.currentInput = '0';
      this.updateDisplay();
      return;
    }

    try {
      // Evaluate safely through custom Tokenizer & Shunting-Yard engine
      const rawResult = this.engine.evaluate(this.currentInput);
      const formattedResult = this.formatResult(rawResult);

      // Record in calculation history
      this.addHistoryEntry(this.currentInput, formattedResult);

      // Update secondary display with evaluated equation
      this.expression = `${this.currentInput} =`;
      // Update primary display with final result
      this.currentInput = formattedResult;
      this.isEvaluated = true;
      this.displayPreview.textContent = '\u00A0';
    } catch (err) {
      this.showError(err.message || 'Invalid expression');
    }
  }

  /**
   * Real-time preview calculation
   */
  computeLivePreview() {
    if (!this.currentInput || this.currentInput === '0' || this.isEvaluated) {
      this.displayPreview.textContent = '\u00A0';
      return;
    }

    if (!/[\+\−\×\÷\^]/.test(this.currentInput)) {
      this.displayPreview.textContent = '\u00A0';
      return;
    }

    try {
      const raw = this.engine.evaluate(this.currentInput);
      const preview = this.formatResult(raw);
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
   * Update Display Readouts & Auto-Scroll
   */
  updateDisplay() {
    this.displayPrimary.textContent = this.currentInput || '0';
    this.displayExpression.textContent = this.expression || '\u00A0';

    // Auto-scroll long equations to keep latest characters in view
    this.displayPrimary.scrollLeft = this.displayPrimary.scrollWidth;
    this.displayExpression.scrollLeft = this.displayExpression.scrollWidth;

    // Toggle Clear button AC / C state
    if (this.btnClear) {
      const isInitial = this.currentInput === '0' && this.expression === '';
      this.btnClear.textContent = isInitial ? 'AC' : 'C';
      this.btnClear.setAttribute('aria-label', isInitial ? 'All Clear (AC)' : 'Clear (C)');
    }

    this.computeLivePreview();
  }

  /**
   * Show Error Alert Banner
   */
  showError(msg) {
    this.hasError = true;
    this.errorMessage.textContent = msg;
    this.displayError.hidden = false;
    this.indicatorStatus.textContent = 'ERROR';
    this.indicatorStatus.style.color = 'var(--maroon)';
  }

  /**
   * Hide Error Alert Banner
   */
  hideError() {
    this.hasError = false;
    this.displayError.hidden = true;
    this.indicatorStatus.textContent = 'READY';
    this.indicatorStatus.style.color = 'var(--deep-teal)';
  }

  /**
   * Scientific Keypad Interactions
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
   * Memory Operations
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
   * Calculation History
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
   * E. Keyboard Support
   * Prevents unintended browser shortcuts while keeping full interaction
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
   * Toggles & Settings
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
    this.engine.setAngleDegree(this.isAngleDegree);
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
