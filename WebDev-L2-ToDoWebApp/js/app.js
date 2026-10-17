/**
 * TaskFlow - Interactive To-Do Web Application
 * Features: Add, Complete, Inline Edit, Delete with Undo, Categorization, 
 *           Priority, Timestamps, Search & Filter, LocalStorage, Sound FX, Confetti.
 */

(() => {
  'use strict';

  // --- Constants & Storage Keys ---
  const STORAGE_KEY = 'taskflow_todos_v1';
  const THEME_KEY = 'taskflow_theme';
  const SOUND_KEY = 'taskflow_sound';

  // Initial demo seed data (only populated on first visit)
  const INITIAL_TASKS = [
    {
      id: 'task-seed-1',
      text: 'Finalize presentation slides for the team review',
      completed: false,
      priority: 'high',
      category: 'work',
      dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      createdAt: Date.now() - 3600000 * 2,
      completedAt: null
    },
    {
      id: 'task-seed-2',
      text: 'Read Chapter 4 of System Design Handbook',
      completed: false,
      priority: 'medium',
      category: 'study',
      dueDate: '',
      createdAt: Date.now() - 3600000 * 5,
      completedAt: null
    },
    {
      id: 'task-seed-3',
      text: 'Morning 5km jog & hydration routine',
      completed: true,
      priority: 'low',
      category: 'health',
      dueDate: '',
      createdAt: Date.now() - 3600000 * 12,
      completedAt: Date.now() - 3600000 * 3
    }
  ];

  // --- State ---
  let tasks = [];
  let deletedTaskCache = null; // for Undo functionality
  let deleteUndoTimer = null;
  let activeEditingTaskId = null;
  let soundEnabled = true;

  // --- DOM Elements ---
  const taskForm = document.getElementById('task-form');
  const taskTitleInput = document.getElementById('task-title-input');
  const taskPrioritySelect = document.getElementById('task-priority-select');
  const taskCategorySelect = document.getElementById('task-category-select');
  const taskDueDate = document.getElementById('task-due-date');

  const pendingTaskList = document.getElementById('pending-task-list');
  const completedTaskList = document.getElementById('completed-task-list');
  const pendingCountBadge = document.getElementById('pending-count-badge');
  const completedCountBadge = document.getElementById('completed-count-badge');
  const pendingEmptyState = document.getElementById('pending-empty-state');
  const completedEmptyState = document.getElementById('completed-empty-state');

  const statPendingCount = document.getElementById('stat-pending-count');
  const statCompletedCount = document.getElementById('stat-completed-count');
  const statTotalCount = document.getElementById('stat-total-count');
  const progressBarFill = document.getElementById('progress-bar-fill');
  const progressPercentageLabel = document.getElementById('progress-percentage-label');
  const progressMotto = document.getElementById('progress-motto');

  const searchInput = document.getElementById('task-search-input');
  const searchClearBtn = document.getElementById('search-clear-btn');
  const categoryFilterSelect = document.getElementById('category-filter-select');
  const priorityFilterSelect = document.getElementById('priority-filter-select');
  const sortSelect = document.getElementById('sort-select');

  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const themeIconSun = document.getElementById('theme-icon-sun');
  const themeIconMoon = document.getElementById('theme-icon-moon');
  const soundToggleBtn = document.getElementById('sound-toggle-btn');
  const soundIconOn = document.getElementById('sound-icon-on');
  const soundIconOff = document.getElementById('sound-icon-off');

  const btnClearCompleted = document.getElementById('btn-clear-completed');
  const btnResetDemo = document.getElementById('btn-reset-demo');
  const exportDataBtn = document.getElementById('export-data-btn');
  const importDataBtn = document.getElementById('import-data-btn');
  const importFileInput = document.getElementById('import-file-input');

  const shortcutsBtn = document.getElementById('shortcuts-btn');
  const footerShortcutsTrigger = document.getElementById('footer-shortcuts-trigger');
  const shortcutsModal = document.getElementById('shortcuts-modal');
  const shortcutsModalClose = document.getElementById('shortcuts-modal-close');
  const toastContainer = document.getElementById('toast-container');

  // --- Sound Effects Synthesizer (Zero External Assets) ---
  const AudioEngine = {
    ctx: null,

    init() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
    },

    playTone(frequency, type, duration, gainStart, gainEnd) {
      if (!soundEnabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') {
          this.ctx.resume();
        }

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

        gain.gain.setValueAtTime(gainStart, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, gainEnd), this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {
        // Fallback silently if audio context is blocked
      }
    },

    click() {
      this.playTone(600, 'sine', 0.04, 0.1, 0.001);
    },

    add() {
      this.playTone(440, 'triangle', 0.08, 0.15, 0.001);
      setTimeout(() => this.playTone(660, 'triangle', 0.1, 0.15, 0.001), 60);
    },

    complete() {
      this.playTone(523.25, 'sine', 0.1, 0.2, 0.01); // C5
      setTimeout(() => this.playTone(659.25, 'sine', 0.12, 0.22, 0.01), 80); // E5
      setTimeout(() => this.playTone(783.99, 'sine', 0.2, 0.25, 0.001), 160); // G5
    },

    uncomplete() {
      this.playTone(440, 'sine', 0.08, 0.15, 0.001);
      setTimeout(() => this.playTone(349.23, 'sine', 0.1, 0.15, 0.001), 60);
    },

    delete() {
      this.playTone(280, 'sawtooth', 0.09, 0.12, 0.001);
    }
  };

  // --- Confetti Animation Helper ---
  function triggerCelebration() {
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b']
      });
    }
  }

  // --- LocalStorage Operations ---
  function loadTasks() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        tasks = JSON.parse(data);
      } else {
        tasks = [...INITIAL_TASKS];
        saveTasks();
      }
    } catch (e) {
      console.error('Error reading localStorage:', e);
      tasks = [...INITIAL_TASKS];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error('Error saving to localStorage:', e);
      showToast('Could not save to local storage: storage quota exceeded.', 'danger');
    }
  }

  // --- Theme Controller ---
  function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeUI(savedTheme);
  }

  function toggleTheme() {
    AudioEngine.click();
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem(THEME_KEY, nextTheme);
    updateThemeUI(nextTheme);
    showToast(`Switched to ${nextTheme === 'dark' ? 'Dark' : 'Light'} theme`);
  }

  function updateThemeUI(theme) {
    if (theme === 'dark') {
      themeIconSun.style.display = 'none';
      themeIconMoon.style.display = 'block';
    } else {
      themeIconSun.style.display = 'block';
      themeIconMoon.style.display = 'none';
    }
  }

  // --- Sound Toggle Controller ---
  function initSound() {
    const savedSound = localStorage.getItem(SOUND_KEY);
    soundEnabled = savedSound !== null ? savedSound === 'true' : true;
    updateSoundUI();
  }

  function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem(SOUND_KEY, soundEnabled);
    updateSoundUI();
    if (soundEnabled) {
      AudioEngine.click();
      showToast('Audio feedback enabled');
    } else {
      showToast('Audio feedback muted');
    }
  }

  function updateSoundUI() {
    soundToggleBtn.setAttribute('aria-pressed', soundEnabled ? 'true' : 'false');
    soundIconOn.style.display = soundEnabled ? 'block' : 'none';
    soundIconOff.style.display = soundEnabled ? 'none' : 'block';
  }

  // --- Utility Functions ---
  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDateTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isToday) {
      return `Today at ${timeStr}`;
    }

    const monthStr = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    return `${monthStr} ${day}, ${timeStr}`;
  }

  function formatRelativeTime(timestamp) {
    if (!timestamp) return '';
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  function formatDueDate(dateString) {
    if (!dateString) return null;
    const [year, month, day] = dateString.split('-');
    const date = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isOverdue = date < today;
    const monthName = date.toLocaleString('default', { month: 'short' });
    return {
      text: `${monthName} ${day}`,
      isOverdue
    };
  }

  // --- Toast Notification System ---
  function showToast(message, type = 'info', undoCallback = null) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'danger') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    } else if (type === 'success') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    } else {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `
      <div class="toast-icon">${iconSvg}</div>
      <div class="toast-message">${escapeHTML(message)}</div>
    `;

    if (undoCallback) {
      const undoBtn = document.createElement('button');
      undoBtn.className = 'toast-undo-btn';
      undoBtn.textContent = 'Undo';
      undoBtn.onclick = () => {
        undoCallback();
        toast.remove();
      };
      toast.appendChild(undoBtn);
    }

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('is-leaving');
      setTimeout(() => toast.remove(), 250);
    }, 4500);
  }

  // --- Filtering & Sorting Helpers ---
  function getFilteredAndSortedTasks() {
    const searchTerm = (searchInput.value || '').trim().toLowerCase();
    const categoryFilter = categoryFilterSelect.value;
    const priorityFilter = priorityFilterSelect.value;
    const sortMethod = sortSelect.value;

    return tasks.filter(task => {
      // Search matching
      const matchesSearch = !searchTerm || task.text.toLowerCase().includes(searchTerm);
      // Category filter
      const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter;
      // Priority filter
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

      return matchesSearch && matchesCategory && matchesPriority;
    }).sort((a, b) => {
      if (sortMethod === 'newest') {
        return (b.createdAt || 0) - (a.createdAt || 0);
      }
      if (sortMethod === 'oldest') {
        return (a.createdAt || 0) - (b.createdAt || 0);
      }
      if (sortMethod === 'alphabetical') {
        return a.text.localeCompare(b.text);
      }
      if (sortMethod === 'priority') {
        const priorityWeights = { high: 3, medium: 2, low: 1 };
        return (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0);
      }
      return 0;
    });
  }

  // --- Task Card Renderer ---
  function renderTaskCard(task) {
    const li = document.createElement('li');
    li.className = `task-card priority-${task.priority} ${task.completed ? 'is-completed' : ''}`;
    li.id = `task-card-${task.id}`;
    li.dataset.id = task.id;

    // Check if task is currently undergoing inline editing
    if (activeEditingTaskId === task.id) {
      li.innerHTML = `
        <div class="inline-edit-form">
          <input type="text" class="inline-edit-input" id="edit-input-${task.id}" value="${escapeHTML(task.text)}" aria-label="Edit task title">
          <div class="inline-edit-controls">
            <div class="inline-edit-meta">
              <select class="pill-select" id="edit-priority-${task.id}">
                <option value="high" ${task.priority === 'high' ? 'selected' : ''}>🔥 High</option>
                <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>⚡ Medium</option>
                <option value="low" ${task.priority === 'low' ? 'selected' : ''}>🌱 Low</option>
              </select>
              <select class="pill-select" id="edit-category-${task.id}">
                <option value="work" ${task.category === 'work' ? 'selected' : ''}>💼 Work</option>
                <option value="personal" ${task.category === 'personal' ? 'selected' : ''}>🏠 Personal</option>
                <option value="study" ${task.category === 'study' ? 'selected' : ''}>📚 Study</option>
                <option value="health" ${task.category === 'health' ? 'selected' : ''}>🏃 Health</option>
                <option value="shopping" ${task.category === 'shopping' ? 'selected' : ''}>🛒 Shopping</option>
                <option value="other" ${task.category === 'other' ? 'selected' : ''}>✨ Other</option>
              </select>
            </div>
            <div class="inline-edit-actions">
              <button type="button" class="btn-inline-save" data-action="save-edit" aria-label="Save changes">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                Save
              </button>
              <button type="button" class="btn-inline-cancel" data-action="cancel-edit" aria-label="Cancel editing">
                Cancel
              </button>
            </div>
          </div>
        </div>
      `;
      setTimeout(() => {
        const input = document.getElementById(`edit-input-${task.id}`);
        if (input) {
          input.focus();
          input.select();
          input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              window.TaskFlowApp.saveInlineEdit(task.id);
            } else if (e.key === 'Escape') {
              e.preventDefault();
              window.TaskFlowApp.cancelInlineEdit();
            }
          });
        }
      }, 50);
      return li;
    }

    // Standard card content
    const categoryIcons = {
      work: '💼',
      personal: '🏠',
      study: '📚',
      health: '🏃',
      shopping: '🛒',
      other: '✨'
    };

    const dueDateInfo = formatDueDate(task.dueDate);

    li.innerHTML = `
      <button 
        type="button" 
        class="task-toggle-btn" 
        data-action="toggle" 
        aria-label="${task.completed ? 'Mark task incomplete' : 'Mark task complete'}"
        title="${task.completed ? 'Mark as incomplete' : 'Mark as complete'}"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </button>

      <div class="task-details">
        <span class="task-text">${escapeHTML(task.text)}</span>
        
        <div class="task-meta-row">
          <!-- Category Badge -->
          <span class="badge-tag tag-${task.category || 'other'}">
            ${categoryIcons[task.category] || '✨'} ${(task.category || 'other').charAt(0).toUpperCase() + (task.category || 'other').slice(1)}
          </span>

          <!-- Priority Badge -->
          <span class="priority-badge ${task.priority || 'medium'}">
            ${task.priority ? task.priority.toUpperCase() : 'MED'}
          </span>

          <!-- Due Date Badge if exists -->
          ${dueDateInfo ? `
            <span class="due-date-badge ${dueDateInfo.isOverdue && !task.completed ? 'is-overdue' : ''}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              ${dueDateInfo.text} ${dueDateInfo.isOverdue && !task.completed ? '(Overdue)' : ''}
            </span>
          ` : ''}

          <!-- Timestamps -->
          <span class="task-timestamp" title="Added on ${new Date(task.createdAt).toLocaleString()}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            ${formatRelativeTime(task.createdAt)}
          </span>

          ${task.completed && task.completedAt ? `
            <span class="task-timestamp completed-time" title="Completed on ${new Date(task.completedAt).toLocaleString()}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              Done ${formatRelativeTime(task.completedAt)}
            </span>
          ` : ''}
        </div>
      </div>

      <div class="task-item-actions">
        <button 
          type="button" 
          class="action-btn edit-btn" 
          data-action="edit" 
          data-tooltip="Edit task"
          aria-label="Edit task"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>

        <button 
          type="button" 
          class="action-btn delete-btn" 
          data-action="delete" 
          data-tooltip="Delete task"
          aria-label="Delete task"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      </div>
    `;

    return li;
  }

  // --- Render Entire UI ---
  function render() {
    const filteredTasks = getFilteredAndSortedTasks();
    const pendingList = filteredTasks.filter(t => !t.completed);
    const completedList = filteredTasks.filter(t => t.completed);

    // Global counts (from full tasks list, regardless of search filter)
    const totalCount = tasks.length;
    const totalPending = tasks.filter(t => !t.completed).length;
    const totalCompleted = tasks.filter(t => t.completed).length;

    // Update Badges & Dashboard
    pendingCountBadge.textContent = `${totalPending} pending`;
    completedCountBadge.textContent = `${totalCompleted} completed`;

    statPendingCount.textContent = totalPending;
    statCompletedCount.textContent = totalCompleted;
    statTotalCount.textContent = totalCount;

    const completionRate = totalCount === 0 ? 0 : Math.round((totalCompleted / totalCount) * 100);
    progressBarFill.style.width = `${completionRate}%`;
    progressBarFill.parentElement.setAttribute('aria-valuenow', completionRate);
    progressPercentageLabel.textContent = `${completionRate}%`;

    // Dynamic encouragement motto
    if (totalCount === 0) {
      progressMotto.textContent = 'No tasks yet. Create one to begin your productive day!';
    } else if (completionRate === 100) {
      progressMotto.textContent = 'Awesome! Every single task completed. You crushed it today! 🌟';
    } else if (completionRate >= 50) {
      progressMotto.textContent = 'More than halfway there! Keep this steady momentum going. 🚀';
    } else {
      progressMotto.textContent = 'Every task checked off is one step closer to your goals. ⚡';
    }

    // Render Pending List
    pendingTaskList.innerHTML = '';
    if (pendingList.length === 0) {
      pendingEmptyState.style.display = 'flex';
      const isSearching = (searchInput.value || '').trim().length > 0;
      if (isSearching) {
        pendingEmptyState.querySelector('h3').textContent = 'No matching pending tasks';
        pendingEmptyState.querySelector('p').textContent = 'Try adjusting your search query or filter tags.';
      } else {
        pendingEmptyState.querySelector('h3').textContent = 'All caught up! 🎉';
        pendingEmptyState.querySelector('p').textContent = 'You have no pending tasks right now. Sit back, relax, or add a fresh goal above!';
      }
    } else {
      pendingEmptyState.style.display = 'none';
      pendingList.forEach(task => {
        pendingTaskList.appendChild(renderTaskCard(task));
      });
    }

    // Render Completed List
    completedTaskList.innerHTML = '';
    if (completedList.length === 0) {
      completedEmptyState.style.display = 'flex';
      const isSearching = (searchInput.value || '').trim().length > 0;
      if (isSearching) {
        completedEmptyState.querySelector('h3').textContent = 'No matching completed tasks';
        completedEmptyState.querySelector('p').textContent = 'Try clearing your search query to see completed items.';
      } else {
        completedEmptyState.querySelector('h3').textContent = 'No tasks finished yet';
        completedEmptyState.querySelector('p').textContent = 'Check off tasks in your pending list as you accomplish them to see your victory wall here!';
      }
    } else {
      completedEmptyState.style.display = 'none';
      completedList.forEach(task => {
        completedTaskList.appendChild(renderTaskCard(task));
      });
    }

    // Clear completed button state
    btnClearCompleted.style.display = totalCompleted > 0 ? 'inline-block' : 'none';

    // Search clear button visibility
    if (searchInput.value.trim().length > 0) {
      searchClearBtn.classList.add('visible');
    } else {
      searchClearBtn.classList.remove('visible');
    }
  }

  // --- Task Operations ---
  function addTask(text, priority = 'medium', category = 'work', dueDate = '') {
    const trimmed = text.trim();
    if (!trimmed) {
      showToast('Please type a task description first.', 'danger');
      return;
    }

    const newTask = {
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      text: trimmed,
      completed: false,
      priority,
      category,
      dueDate,
      createdAt: Date.now(),
      completedAt: null
    };

    tasks.unshift(newTask);
    saveTasks();
    AudioEngine.add();
    render();
    showToast(`Task added to pending list!`, 'success');
  }

  function toggleTaskComplete(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    task.completed = !task.completed;
    if (task.completed) {
      task.completedAt = Date.now();
      AudioEngine.complete();
      triggerCelebration();
      showToast('Task marked complete! Great job! 🎉', 'success');
    } else {
      task.completedAt = null;
      AudioEngine.uncomplete();
      showToast('Task moved back to pending list');
    }

    saveTasks();
    render();
  }

  function deleteTask(id) {
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return;

    const [removed] = tasks.splice(index, 1);
    saveTasks();
    AudioEngine.delete();

    // Cache removed task for Undo
    deletedTaskCache = {
      task: removed,
      originalIndex: index
    };

    render();

    showToast(`Task deleted`, 'danger', () => {
      // Undo callback
      if (deletedTaskCache && deletedTaskCache.task) {
        tasks.splice(deletedTaskCache.originalIndex, 0, deletedTaskCache.task);
        saveTasks();
        deletedTaskCache = null;
        AudioEngine.add();
        render();
        showToast('Task restored successfully', 'success');
      }
    });
  }

  function startInlineEdit(id) {
    activeEditingTaskId = id;
    AudioEngine.click();
    render();
  }

  function saveInlineEdit(id) {
    const input = document.getElementById(`edit-input-${id}`);
    const prioritySelect = document.getElementById(`edit-priority-${id}`);
    const categorySelect = document.getElementById(`edit-category-${id}`);

    if (!input) return;
    const newText = input.value.trim();

    if (!newText) {
      showToast('Task title cannot be empty.', 'danger');
      input.focus();
      return;
    }

    const task = tasks.find(t => t.id === id);
    if (task) {
      task.text = newText;
      if (prioritySelect) task.priority = prioritySelect.value;
      if (categorySelect) task.category = categorySelect.value;
      saveTasks();
      AudioEngine.add();
      showToast('Task updated');
    }

    activeEditingTaskId = null;
    render();
  }

  function cancelInlineEdit() {
    activeEditingTaskId = null;
    AudioEngine.click();
    render();
  }

  function clearAllCompleted() {
    const completedTasks = tasks.filter(t => t.completed);
    if (completedTasks.length === 0) return;

    const previousTasks = [...tasks];
    tasks = tasks.filter(t => !t.completed);
    saveTasks();
    AudioEngine.delete();
    render();

    showToast(`Cleared ${completedTasks.length} completed task(s)`, 'danger', () => {
      tasks = previousTasks;
      saveTasks();
      AudioEngine.add();
      render();
      showToast('Cleared tasks restored', 'success');
    });
  }

  // --- Export and Import JSON ---
  function exportTasksToJSON() {
    AudioEngine.click();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tasks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `TaskFlow_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Tasks exported to JSON file');
  }

  function importTasksFromJSON(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (Array.isArray(imported)) {
          tasks = imported;
          saveTasks();
          AudioEngine.add();
          render();
          showToast(`Successfully imported ${imported.length} tasks!`, 'success');
        } else {
          showToast('Invalid JSON file format.', 'danger');
        }
      } catch (err) {
        showToast('Error reading JSON file.', 'danger');
      }
    };
    reader.readAsText(file);
  }

  // --- Reset Sample Demo Data ---
  function resetSampleDemoData() {
    if (confirm('Reset to initial sample tasks? This will replace your current tasks.')) {
      tasks = [
        {
          id: 'task-seed-1',
          text: 'Finalize presentation slides for the team review',
          completed: false,
          priority: 'high',
          category: 'work',
          dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          createdAt: Date.now() - 3600000 * 2,
          completedAt: null
        },
        {
          id: 'task-seed-2',
          text: 'Read Chapter 4 of System Design Handbook',
          completed: false,
          priority: 'medium',
          category: 'study',
          dueDate: '',
          createdAt: Date.now() - 3600000 * 5,
          completedAt: null
        },
        {
          id: 'task-seed-3',
          text: 'Morning 5km jog & hydration routine',
          completed: true,
          priority: 'low',
          category: 'health',
          dueDate: '',
          createdAt: Date.now() - 3600000 * 12,
          completedAt: Date.now() - 3600000 * 3
        }
      ];
      saveTasks();
      AudioEngine.click();
      render();
      showToast('Sample tasks restored', 'info');
    }
  }

  // --- Event Delegation & Listeners ---
  function bindEvents() {
    // Form Submission
    taskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      addTask(
        taskTitleInput.value,
        taskPrioritySelect.value,
        taskCategorySelect.value,
        taskDueDate.value
      );
      taskTitleInput.value = '';
      taskDueDate.value = '';
      taskTitleInput.focus();
    });

    // Delegated actions on tasks lists (Toggle, Edit, Delete)
    const handleListClick = (e) => {
      const target = e.target;
      const card = target.closest('.task-card');
      if (!card) return;

      const taskId = card.dataset.id;
      const toggleBtn = target.closest('[data-action="toggle"]');
      const editBtn = target.closest('[data-action="edit"]');
      const deleteBtn = target.closest('[data-action="delete"]');
      const saveEditBtn = target.closest('[data-action="save-edit"]');
      const cancelEditBtn = target.closest('[data-action="cancel-edit"]');

      if (saveEditBtn) {
        e.stopPropagation();
        saveInlineEdit(taskId);
      } else if (cancelEditBtn) {
        e.stopPropagation();
        cancelInlineEdit();
      } else if (toggleBtn) {
        e.stopPropagation();
        toggleTaskComplete(taskId);
      } else if (editBtn) {
        e.stopPropagation();
        startInlineEdit(taskId);
      } else if (deleteBtn) {
        e.stopPropagation();
        card.classList.add('is-removing');
        setTimeout(() => {
          deleteTask(taskId);
        }, 220);
      }
    };

    const handleListDblClick = (e) => {
      const taskText = e.target.closest('.task-text');
      if (!taskText) return;
      const card = taskText.closest('.task-card');
      if (card && card.dataset.id) {
        startInlineEdit(card.dataset.id);
      }
    };

    pendingTaskList.addEventListener('click', handleListClick);
    completedTaskList.addEventListener('click', handleListClick);
    pendingTaskList.addEventListener('dblclick', handleListDblClick);
    completedTaskList.addEventListener('dblclick', handleListDblClick);

    // Search and Filters
    searchInput.addEventListener('input', () => render());
    searchClearBtn.addEventListener('click', () => {
      searchInput.value = '';
      AudioEngine.click();
      searchInput.focus();
      render();
    });

    categoryFilterSelect.addEventListener('change', () => {
      AudioEngine.click();
      render();
    });

    priorityFilterSelect.addEventListener('change', () => {
      AudioEngine.click();
      render();
    });

    sortSelect.addEventListener('change', () => {
      AudioEngine.click();
      render();
    });

    // Theme & Sound
    themeToggleBtn.addEventListener('click', toggleTheme);
    soundToggleBtn.addEventListener('click', toggleSound);

    // Bulk Actions
    btnClearCompleted.addEventListener('click', clearAllCompleted);
    btnResetDemo.addEventListener('click', resetSampleDemoData);

    // Import / Export
    exportDataBtn.addEventListener('click', exportTasksToJSON);
    importDataBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        importTasksFromJSON(e.target.files[0]);
        e.target.value = '';
      }
    });

    // Shortcuts Modal
    const openShortcuts = () => {
      AudioEngine.click();
      shortcutsModal.classList.add('is-open');
    };
    const closeShortcuts = () => {
      AudioEngine.click();
      shortcutsModal.classList.remove('is-open');
    };

    shortcutsBtn.addEventListener('click', openShortcuts);
    footerShortcutsTrigger.addEventListener('click', openShortcuts);
    shortcutsModalClose.addEventListener('click', closeShortcuts);
    shortcutsModal.addEventListener('click', (e) => {
      if (e.target === shortcutsModal) closeShortcuts();
    });

    // Global Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      const isInputActive = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

      // Escape closes modal or cancels inline edit
      if (e.key === 'Escape') {
        if (shortcutsModal.classList.contains('is-open')) {
          closeShortcuts();
        } else if (activeEditingTaskId) {
          cancelInlineEdit();
        } else if (searchInput.value) {
          searchInput.value = '';
          render();
        }
        return;
      }

      // If typing in input, don't hijack alphanumeric hotkeys
      if (isInputActive) return;

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        taskTitleInput.focus();
      } else if (e.key === '/') {
        e.preventDefault();
        searchInput.focus();
      } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        toggleTheme();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleSound();
      } else if (e.key === '?') {
        e.preventDefault();
        openShortcuts();
      }
    });
  }

  // --- Public API for Inline Edit Callbacks ---
  window.TaskFlowApp = {
    saveInlineEdit,
    cancelInlineEdit
  };

  // --- Initialization ---
  function init() {
    initTheme();
    initSound();
    loadTasks();
    bindEvents();
    render();
    console.log('TaskFlow app initialized successfully.');
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
