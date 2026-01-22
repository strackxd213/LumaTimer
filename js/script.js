// LumaTimer - Enhanced Pomodoro Timer
// Features: Task Management, Statistics, Dark Theme

let timerState = {
    mode: 'focus',
    timeLeft: 25 * 60,
    totalTime: 25 * 60,
    isRunning: false,
    timerInterval: null,
    sessionCount: 1,
    completedSessions: 0,
    activeTaskId: null
};

let settings = {
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
    soundEnabled: true,
    autoStartBreaks: true,
    autoStartFocus: false
};

let tasks = [];
let nextTaskId = 1;

let stats = {
    today: { pomodoros: 0, minutes: 0 },
    total: { pomodoros: 0, minutes: 0 },
    weekly: Array(7).fill(0)
};

function loadData() {
    const savedSettings = localStorage.getItem('pomodoroSettings');
    const savedTasks = localStorage.getItem('pomodoroTasks');
    const savedStats = localStorage.getItem('pomodoroStats');
    const savedTheme = localStorage.getItem('pomodoroTheme');
    
    if (savedSettings) {
        settings = { ...settings, ...JSON.parse(savedSettings) };
        updateSettingsInputs();
    }
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
        nextTaskId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
        renderTasks();
    }
    if (savedStats) {
        stats = { ...stats, ...JSON.parse(savedStats) };
    }
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    }
}

function saveSettings() {
    localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
}

function saveTasks() {
    localStorage.setItem('pomodoroTasks', JSON.stringify(tasks));
}

function saveStats() {
    localStorage.setItem('pomodoroStats', JSON.stringify(stats));
}

function saveTheme(theme) {
    localStorage.setItem('pomodoroTheme', theme);
}

const timeDisplay = document.getElementById('timeDisplay');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const focusBtn = document.getElementById('focusBtn');
const shortBreakBtn = document.getElementById('shortBreakBtn');
const longBreakBtn = document.getElementById('longBreakBtn');
const sessionNumber = document.getElementById('sessionNumber');
const estimateTime = document.getElementById('estimateTime');
const settingsBtn = document.getElementById('settingsBtn');
const statsBtn = document.getElementById('statsBtn');
const themeBtn = document.getElementById('themeBtn');
const settingsModal = document.getElementById('settingsModal');
const statsModal = document.getElementById('statsModal');
const completionModal = document.getElementById('completionModal');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const closeStatsBtn = document.getElementById('closeStatsBtn');
const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const completionTitle = document.getElementById('completionTitle');
const completionMessage = document.getElementById('completionMessage');
const completionBtn = document.getElementById('completionBtn');
const taskInput = document.getElementById('taskInput');
const taskEstimate = document.getElementById('taskEstimate');
const addTaskBtn = document.getElementById('addTaskBtn');
const tasksList = document.getElementById('tasksList');
const clearTasksBtn = document.getElementById('clearTasksBtn');
const progressRingCircle = document.querySelector('.progress-ring-circle');

const radius = 135;
const circumference = 2 * Math.PI * radius;
progressRingCircle.style.strokeDasharray = `${circumference} ${circumference}`;
progressRingCircle.style.strokeDashoffset = '0';

function updateProgressRing() {
    const progress = timerState.timeLeft / timerState.totalTime;
    const offset = circumference * (1 - progress);
    progressRingCircle.style.strokeDashoffset = offset;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateDisplay() {
    timeDisplay.textContent = formatTime(timerState.timeLeft);
    updateProgressRing();
    sessionNumber.textContent = timerState.sessionCount;
    updateEstimateTime();
    
    if (timerState.mode === 'focus') {
        progressRingCircle.style.stroke = '#6366f1';
    } else {
        progressRingCircle.style.stroke = '#f59e0b';
    }
    
    document.title = timerState.isRunning ? `${formatTime(timerState.timeLeft)} - LumaTimer` : 'LumaTimer - Pomodoro Focus Timer';
}

function updateEstimateTime() {
    const activeTasks = tasks.filter(t => !t.completed);
    const totalPomodoros = activeTasks.reduce((sum, t) => sum + t.estimate, 0);
    
    if (totalPomodoros > 0) {
        const totalMinutes = totalPomodoros * settings.focusDuration;
        const now = new Date();
        const finish = new Date(now.getTime() + totalMinutes * 60000);
        const finishTime = finish.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        estimateTime.textContent = `Finish at ~${finishTime}`;
        estimateTime.style.display = 'block';
    } else {
        estimateTime.style.display = 'none';
    }
}

function startTimer() {
    if (timerState.isRunning) return;
    timerState.isRunning = true;
    startBtn.classList.add('hidden');
    pauseBtn.classList.remove('hidden');
    
    timerState.timerInterval = setInterval(() => {
        if (timerState.timeLeft > 0) {
            timerState.timeLeft--;
            updateDisplay();
        } else {
            completeSession();
        }
    }, 1000);
}

function pauseTimer() {
    if (!timerState.isRunning) return;
    timerState.isRunning = false;
    startBtn.classList.remove('hidden');
    pauseBtn.classList.add('hidden');
    clearInterval(timerState.timerInterval);
    document.title = 'LumaTimer - Pomodoro Focus Timer';
}

function resetTimer() {
    pauseTimer();
    timerState.timeLeft = timerState.totalTime;
    updateDisplay();
}

function completeSession() {
    pauseTimer();
    
    if (settings.soundEnabled) {
        playNotificationSound();
    }
    
    if ('Notification' in window && Notification.permission === 'granted') {
        const message = timerState.mode === 'focus' ? 'Time for a break!' : 'Ready for another focus session?';
        new Notification('LumaTimer', { body: message, icon: '/assets/favicon.svg' });
    }
    
    if (timerState.mode === 'focus') {
        timerState.completedSessions++;
        stats.today.pomodoros++;
        stats.total.pomodoros++;
        stats.today.minutes += settings.focusDuration;
        stats.total.minutes += settings.focusDuration;
        const today = new Date().getDay();
        stats.weekly[today]++;
        saveStats();
        
        if (timerState.activeTaskId) {
            const task = tasks.find(t => t.id === timerState.activeTaskId);
            if (task) {
                task.completed_pomodoros = (task.completed_pomodoros || 0) + 1;
                if (task.completed_pomodoros >= task.estimate) {
                    task.completed = true;
                }
                saveTasks();
                renderTasks();
            }
        }
    }
    
    let nextMode = 'focus';
    let nextTitle = 'Session Complete!';
    let nextMessage = 'Time for a break';
    let buttonText = 'Start Break';
    
    if (timerState.mode === 'focus') {
        if (timerState.completedSessions % settings.sessionsUntilLongBreak === 0) {
            nextMode = 'long-break';
            buttonText = 'Start Long Break';
        } else {
            nextMode = 'short-break';
            buttonText = 'Start Break';
        }
    } else {
        nextMode = 'focus';
        nextTitle = 'Break Complete!';
        nextMessage = 'Ready to focus?';
        buttonText = 'Start Focus';
        timerState.sessionCount++;
    }
    
    completionTitle.textContent = nextTitle;
    completionMessage.textContent = nextMessage;
    completionBtn.textContent = buttonText;
    completionBtn.dataset.nextMode = nextMode;
    completionModal.classList.remove('hidden');
    
    const shouldAutoStart = (nextMode === 'focus' && settings.autoStartFocus) || (nextMode !== 'focus' && settings.autoStartBreaks);
    
    if (shouldAutoStart) {
        setTimeout(() => {
            completionModal.classList.add('hidden');
            switchMode(nextMode);
            startTimer();
        }, 3000);
    }
}

function switchMode(mode) {
    timerState.mode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    
    if (mode === 'focus') {
        focusBtn.classList.add('active');
        timerState.totalTime = settings.focusDuration * 60;
    } else if (mode === 'short-break') {
        shortBreakBtn.classList.add('active');
        timerState.totalTime = settings.shortBreakDuration * 60;
    } else if (mode === 'long-break') {
        longBreakBtn.classList.add('active');
        timerState.totalTime = settings.longBreakDuration * 60;
    }
    
    timerState.timeLeft = timerState.totalTime;
    updateDisplay();
}

function playNotificationSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.log('Audio notification not available');
    }
}

function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

function addTask() {
    const text = taskInput.value.trim();
    const estimate = parseInt(taskEstimate.value) || 1;
    
    if (!text) return;
    
    const task = {
        id: nextTaskId++,
        text: text,
        estimate: estimate,
        completed: false,
        completed_pomodoros: 0,
        active: false
    };
    
    tasks.push(task);
    saveTasks();
    renderTasks();
    
    taskInput.value = '';
    taskEstimate.value = '1';
}

function renderTasks() {
    if (tasks.length === 0) {
        tasksList.innerHTML = '<div class="empty-tasks"><p>No tasks yet. Add one to get started! 📝</p></div>';
        return;
    }
    
    tasksList.innerHTML = tasks.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''} ${task.active ? 'active' : ''}" data-id="${task.id}">
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTask(${task.id})"></div>
            <div class="task-content" onclick="setActiveTask(${task.id})">
                <div class="task-text">${task.text}</div>
                <div class="task-meta">
                    <span>${task.completed_pomodoros || 0}/${task.estimate} pomodoros</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="task-action-btn" onclick="deleteTask(${task.id})" title="Delete task">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
    
    updateEstimateTime();
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
    }
}

function setActiveTask(id) {
    tasks.forEach(t => t.active = false);
    const task = tasks.find(t => t.id === id);
    if (task && !task.completed) {
        task.active = true;
        timerState.activeTaskId = id;
    }
    saveTasks();
    renderTasks();
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
}

function clearCompletedTasks() {
    if (confirm('Clear all completed tasks?')) {
        tasks = tasks.filter(t => !t.completed);
        saveTasks();
        renderTasks();
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    saveTheme(newTheme);
}

function openSettings() {
    updateSettingsInputs();
    settingsModal.classList.add('active');
}

function closeSettings() {
    settingsModal.classList.remove('active');
}

function updateSettingsInputs() {
    document.getElementById('focusDuration').value = settings.focusDuration;
    document.getElementById('shortBreakDuration').value = settings.shortBreakDuration;
    document.getElementById('longBreakDuration').value = settings.longBreakDuration;
    document.getElementById('sessionsUntilLongBreak').value = settings.sessionsUntilLongBreak;
    document.getElementById('soundEnabled').checked = settings.soundEnabled;
    document.getElementById('autoStartBreaks').checked = settings.autoStartBreaks;
    document.getElementById('autoStartFocus').checked = settings.autoStartFocus;
}

function applySettings() {
    settings.focusDuration = parseInt(document.getElementById('focusDuration').value);
    settings.shortBreakDuration = parseInt(document.getElementById('shortBreakDuration').value);
    settings.longBreakDuration = parseInt(document.getElementById('longBreakDuration').value);
    settings.sessionsUntilLongBreak = parseInt(document.getElementById('sessionsUntilLongBreak').value);
    settings.soundEnabled = document.getElementById('soundEnabled').checked;
    settings.autoStartBreaks = document.getElementById('autoStartBreaks').checked;
    settings.autoStartFocus = document.getElementById('autoStartFocus').checked;
    
    saveSettings();
    
    if (!timerState.isRunning) {
        if (timerState.mode === 'focus') {
            timerState.totalTime = settings.focusDuration * 60;
        } else if (timerState.mode === 'short-break') {
            timerState.totalTime = settings.shortBreakDuration * 60;
        } else if (timerState.mode === 'long-break') {
            timerState.totalTime = settings.longBreakDuration * 60;
        }
        timerState.timeLeft = timerState.totalTime;
        updateDisplay();
    }
    
    closeSettings();
}

function openStats() {
    updateStatsDisplay();
    statsModal.classList.add('active');
}

function closeStats() {
    statsModal.classList.remove('active');
}

function updateStatsDisplay() {
    document.getElementById('todayPomodoros').textContent = stats.today.pomodoros;
    document.getElementById('todayMinutes').textContent = `${stats.today.minutes}m`;
    document.getElementById('totalPomodoros').textContent = stats.total.pomodoros;
    
    const chartContainer = document.getElementById('weeklyChart');
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const maxValue = Math.max(...stats.weekly, 1);
    
    chartContainer.innerHTML = stats.weekly.map((count, index) => {
        const height = (count / maxValue) * 100;
        return `<div class="chart-bar" style="height: ${height}%" title="${days[index]}: ${count} sessions">
            <span class="chart-bar-label">${days[index]}</span>
        </div>`;
    }).join('');
}

startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);
focusBtn.addEventListener('click', () => { if (!timerState.isRunning) switchMode('focus'); });
shortBreakBtn.addEventListener('click', () => { if (!timerState.isRunning) switchMode('short-break'); });
longBreakBtn.addEventListener('click', () => { if (!timerState.isRunning) switchMode('long-break'); });
settingsBtn.addEventListener('click', openSettings);
statsBtn.addEventListener('click', openStats);
themeBtn.addEventListener('click', toggleTheme);
closeSettingsBtn.addEventListener('click', closeSettings);
closeStatsBtn.addEventListener('click', closeStats);
cancelSettingsBtn.addEventListener('click', closeSettings);
saveSettingsBtn.addEventListener('click', applySettings);
addTaskBtn.addEventListener('click', addTask);
clearTasksBtn.addEventListener('click', clearCompletedTasks);

taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});

settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) closeSettings();
});

statsModal.addEventListener('click', (e) => {
    if (e.target === statsModal) closeStats();
});

completionModal.addEventListener('click', (e) => {
    if (e.target === completionModal) completionModal.classList.add('hidden');
});

completionBtn.addEventListener('click', () => {
    const nextMode = completionBtn.dataset.nextMode;
    completionModal.classList.add('hidden');
    switchMode(nextMode);
    startTimer();
});

document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    if (e.code === 'Space') {
        e.preventDefault();
        if (timerState.isRunning) pauseTimer();
        else startTimer();
    } else if (e.code === 'KeyR') {
        e.preventDefault();
        resetTimer();
    } else if (e.code === 'Escape') {
        if (settingsModal.classList.contains('active')) closeSettings();
        if (statsModal.classList.contains('active')) closeStats();
        if (!completionModal.classList.contains('hidden')) completionModal.classList.add('hidden');
    }
});

window.addEventListener('resize', () => {
    const width = window.innerWidth;
    let newRadius = 135;
    if (width <= 640) newRadius = 112;
    if (width <= 400) newRadius = 98;
    const newCircumference = 2 * Math.PI * newRadius;
    progressRingCircle.style.strokeDasharray = `${newCircumference} ${newCircumference}`;
    updateProgressRing();
});

loadData();
updateDisplay();
requestNotificationPermission();
