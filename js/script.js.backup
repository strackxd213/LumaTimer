// Timer State
let timerState = {
    mode: 'focus', // 'focus', 'short-break', 'long-break'
    timeLeft: 25 * 60, // in seconds
    totalTime: 25 * 60,
    isRunning: false,
    timerInterval: null,
    sessionCount: 1,
    completedSessions: 0
};

// Settings
let settings = {
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
    soundEnabled: true,
    autoStartBreaks: true,
    autoStartFocus: false
};

// Load settings from localStorage
function loadSettings() {
    const saved = localStorage.getItem('pomodoroSettings');
    if (saved) {
        settings = { ...settings, ...JSON.parse(saved) };
        updateSettingsInputs();
    }
}

// Save settings to localStorage
function saveSettings() {
    localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
}

// DOM Elements
const timeDisplay = document.getElementById('timeDisplay');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const focusBtn = document.getElementById('focusBtn');
const shortBreakBtn = document.getElementById('shortBreakBtn');
const longBreakBtn = document.getElementById('longBreakBtn');
const sessionNumber = document.getElementById('sessionNumber');
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const completionModal = document.getElementById('completionModal');
const completionTitle = document.getElementById('completionTitle');
const completionMessage = document.getElementById('completionMessage');
const completionBtn = document.getElementById('completionBtn');
const progressRingCircle = document.querySelector('.progress-ring-circle');

// Progress Ring Calculation
const radius = 135; // Should match the SVG circle radius
const circumference = 2 * Math.PI * radius;
progressRingCircle.style.strokeDasharray = `${circumference} ${circumference}`;
progressRingCircle.style.strokeDashoffset = '0';

function updateProgressRing() {
    const progress = timerState.timeLeft / timerState.totalTime;
    const offset = circumference * (1 - progress);
    progressRingCircle.style.strokeDashoffset = offset;
}

// Format Time
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Update Display
function updateDisplay() {
    timeDisplay.textContent = formatTime(timerState.timeLeft);
    updateProgressRing();
    sessionNumber.textContent = timerState.sessionCount;
    
    // Update progress ring color based on mode
    if (timerState.mode === 'focus') {
        progressRingCircle.style.stroke = '#6366f1';
    } else {
        progressRingCircle.style.stroke = '#f59e0b';
    }
    
    // Update document title
    document.title = `${formatTime(timerState.timeLeft)} - LumaTimer`;
}

// Timer Functions
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
}

function resetTimer() {
    pauseTimer();
    timerState.timeLeft = timerState.totalTime;
    updateDisplay();
}

function completeSession() {
    pauseTimer();
    
    // Play notification sound
    if (settings.soundEnabled) {
        playNotificationSound();
    }
    
    // Show notification
    if ('Notification' in window && Notification.permission === 'granted') {
        const message = timerState.mode === 'focus' 
            ? 'Time for a break!' 
            : 'Ready for another focus session?';
        new Notification('LumaTimer', {
            body: message,
            icon: '/favicon.svg'
        });
    }
    
    // Update session count
    if (timerState.mode === 'focus') {
        timerState.completedSessions++;
    }
    
    // Determine next mode
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
    
    // Show completion modal
    completionTitle.textContent = nextTitle;
    completionMessage.textContent = nextMessage;
    completionBtn.textContent = buttonText;
    completionBtn.dataset.nextMode = nextMode;
    completionModal.classList.remove('hidden');
    
    // Auto-start next session
    const shouldAutoStart = (nextMode === 'focus' && settings.autoStartFocus) || 
                           (nextMode !== 'focus' && settings.autoStartBreaks);
    
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
    
    // Update mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
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

// Notification Sound (Simple beep using Web Audio API)
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

// Request notification permission
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// Settings Modal Functions
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
    
    // Update current timer if not running
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

// Event Listeners
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

focusBtn.addEventListener('click', () => {
    if (!timerState.isRunning) {
        switchMode('focus');
    }
});

shortBreakBtn.addEventListener('click', () => {
    if (!timerState.isRunning) {
        switchMode('short-break');
    }
});

longBreakBtn.addEventListener('click', () => {
    if (!timerState.isRunning) {
        switchMode('long-break');
    }
});

settingsBtn.addEventListener('click', openSettings);
closeSettingsBtn.addEventListener('click', closeSettings);
cancelSettingsBtn.addEventListener('click', closeSettings);
saveSettingsBtn.addEventListener('click', applySettings);

// Close modal when clicking outside
settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        closeSettings();
    }
});

completionModal.addEventListener('click', (e) => {
    if (e.target === completionModal) {
        completionModal.classList.add('hidden');
    }
});

completionBtn.addEventListener('click', () => {
    const nextMode = completionBtn.dataset.nextMode;
    completionModal.classList.add('hidden');
    switchMode(nextMode);
    startTimer();
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    
    if (e.code === 'Space') {
        e.preventDefault();
        if (timerState.isRunning) {
            pauseTimer();
        } else {
            startTimer();
        }
    } else if (e.code === 'KeyR') {
        e.preventDefault();
        resetTimer();
    } else if (e.code === 'Escape') {
        if (settingsModal.classList.contains('active')) {
            closeSettings();
        }
        if (!completionModal.classList.contains('hidden')) {
            completionModal.classList.add('hidden');
        }
    }
});

// Visibility change - pause when tab is hidden (optional)
document.addEventListener('visibilitychange', () => {
    if (document.hidden && timerState.isRunning) {
        // Timer continues running in background
        // You could pause it here if preferred
    }
});

// Initialize
loadSettings();
updateDisplay();
requestNotificationPermission();

// Update responsive progress ring on resize
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    let newRadius = 135;
    
    if (width <= 640) {
        newRadius = 112;
    }
    if (width <= 400) {
        newRadius = 98;
    }
    
    // Update circumference calculation if needed
    const newCircumference = 2 * Math.PI * newRadius;
    progressRingCircle.style.strokeDasharray = `${newCircumference} ${newCircumference}`;
    updateProgressRing();
});
