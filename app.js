// -------------------------------------------------------------------------- //
//                               APPLICATION STATE                            //
// -------------------------------------------------------------------------- //

const state = {
    activeTab: 'home',
    highScore: parseInt(localStorage.getItem('skibidi_highscore') || '0'),
    synth: {
        pitch: 1.0,
        volume: 0.8,
        audioCtx: null,
        analyser: null,
        visualizerInterval: null
    }
};

// -------------------------------------------------------------------------- //
//                               TAB SWITCHING (SPA)                          //
// -------------------------------------------------------------------------- //

function switchTab(tabId) {
    // Hide all sections
    document.querySelectorAll('.tab-content').forEach(section => {
        section.classList.remove('active-section');
    });

    // Deactivate all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Show selected section
    const targetSection = document.getElementById(tabId);
    if (targetSection) {
        targetSection.classList.add('active-section');
        state.activeTab = tabId;
        window.location.hash = tabId;
    }

    // Activate selected nav link
    const targetLink = document.querySelector(`.nav-link[data-tab="${tabId}"]`);
    if (targetLink) {
        targetLink.classList.add('active');
    }

    // Scroll to top
    window.scrollTo(0, 0);

    // Stop game if switching away from battle
    if (tabId !== 'battle' && typeof gameEngine !== 'undefined') {
        gameEngine.stop();
    }

    // Close mobile nav on transition
    document.getElementById('mainNav').classList.remove('mobile-active');

    // Trigger game setup if switching to battle
    if (tabId === 'battle' && typeof gameEngine !== 'undefined') {
        gameEngine.init();
    }
}

// -------------------------------------------------------------------------- //
//                               MOBILE MENU TOGGLE                           //
// -------------------------------------------------------------------------- //

document.getElementById('mobileNavToggle').addEventListener('click', () => {
    document.getElementById('mainNav').classList.toggle('mobile-active');
});

// Setup click events on nav links
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const tabId = link.getAttribute('data-tab');
        switchTab(tabId);
    });
});

// Handle initial hash routing
window.addEventListener('load', () => {
    const hash = window.location.hash.substring(1);
    if (hash && ['home', 'battle', 'codex', 'soundboard', 'lore'].includes(hash)) {
        switchTab(hash);
    } else {
        switchTab('home');
    }
});

// -------------------------------------------------------------------------- //
//                               WEB AUDIO SYNTH SOUNDBOARD                   //
// -------------------------------------------------------------------------- //

function initAudioContext() {
    if (!state.synth.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        state.synth.audioCtx = new AudioContext();
        state.synth.analyser = state.synth.audioCtx.createAnalyser();
        state.synth.analyser.fftSize = 64;
        state.synth.analyser.connect(state.synth.audioCtx.destination);
        startVisualizer();
    }
    if (state.synth.audioCtx.state === 'suspended') {
        state.synth.audioCtx.resume();
    }
}

const synthPitchInput = document.getElementById('synthPitch');
const synthVolumeInput = document.getElementById('synthVolume');
const pitchVal = document.getElementById('pitchVal');
const volumeVal = document.getElementById('volumeVal');

synthPitchInput.addEventListener('input', (e) => {
    state.synth.pitch = parseFloat(e.target.value);
    pitchVal.textContent = state.synth.pitch.toFixed(1) + 'x';
});

synthVolumeInput.addEventListener('input', (e) => {
    state.synth.volume = parseFloat(e.target.value);
    volumeVal.textContent = Math.round(state.synth.volume * 100) + '%';
});

// Play procedural synth sounds
function playSynthSound(type) {
    initAudioContext();
    const ctx = state.synth.audioCtx;
    const analyser = state.synth.analyser;
    const now = ctx.currentTime;

    // Main Master Gain Node
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(state.synth.volume, now);
    masterGain.connect(analyser);

    const pitchModifier = state.synth.pitch;

    if (type === 'laser-blast') {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1000 * pitchModifier, now);
        osc.frequency.exponentialRampToValueAtTime(80 * pitchModifier, now + 0.25);

        gainNode.gain.setValueAtTime(0.5, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        osc.connect(gainNode);
        gainNode.connect(masterGain);

        osc.start(now);
        osc.stop(now + 0.25);

    } else if (type === 'toilet-flush') {
        // Noise buffer simulation
        const bufferSize = ctx.sampleRate * 1.2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        // Lowpass filter sweep
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000 * pitchModifier, now);
        filter.frequency.linearRampToValueAtTime(300 * pitchModifier, now + 1.2);

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.6, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 1.2);

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(masterGain);

        noise.start(now);
        noise.stop(now + 1.2);

    } else if (type === 'speaker-bass') {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(120 * pitchModifier, now);
        osc.frequency.exponentialRampToValueAtTime(25 * pitchModifier, now + 0.5);

        gainNode.gain.setValueAtTime(0.8, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        osc.connect(gainNode);
        gainNode.connect(masterGain);

        osc.start(now);
        osc.stop(now + 0.5);

    } else if (type === 'tv-static') {
        const bufferSize = ctx.sampleRate * 0.8;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        // Bandpass filter
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000 * pitchModifier, now);
        // Modulate filter frequency
        filter.frequency.linearRampToValueAtTime(1200 * pitchModifier, now + 0.4);
        filter.frequency.linearRampToValueAtTime(800 * pitchModifier, now + 0.8);
        filter.Q.setValueAtTime(3.0, now);

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.4, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(masterGain);

        noise.start(now);
        noise.stop(now + 0.8);

    } else if (type === 'toilet-laugh') {
        // Repeated series of low pitches (chuckle)
        const dur = 0.15;
        for (let i = 0; i < 4; i++) {
            const timeOffset = i * 0.18;
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime((180 - i * 20) * pitchModifier, now + timeOffset);
            osc.frequency.linearRampToValueAtTime((80 - i * 10) * pitchModifier, now + timeOffset + dur);

            gainNode.gain.setValueAtTime(0.5, now + timeOffset);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + timeOffset + dur);

            osc.connect(gainNode);
            gainNode.connect(masterGain);

            osc.start(now + timeOffset);
            osc.stop(now + timeOffset + dur);
        }

    } else if (type === 'skibidi-theme') {
        // Play simple retro melody loop
        const notes = [130.81, 146.83, 164.81, 130.81, 164.81, 146.83, 110.00, 110.00];
        const tempo = 0.14; // Time per note
        notes.forEach((freq, idx) => {
            const timeOffset = idx * tempo;
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq * 1.5 * pitchModifier, now + timeOffset);

            // Sub-harmonic oscillator for punchy feel
            const subOsc = ctx.createOscillator();
            subOsc.type = 'sine';
            subOsc.frequency.setValueAtTime(freq * 0.75 * pitchModifier, now + timeOffset);

            gainNode.gain.setValueAtTime(0.4, now + timeOffset);
            gainNode.gain.setValueAtTime(0.4, now + timeOffset + tempo - 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + timeOffset + tempo);

            osc.connect(gainNode);
            subOsc.connect(gainNode);
            gainNode.connect(masterGain);

            osc.start(now + timeOffset);
            subOsc.start(now + timeOffset);
            osc.stop(now + timeOffset + tempo);
            subOsc.stop(now + timeOffset + tempo);
        });
    }
}

// Attach soundboard triggers
document.querySelectorAll('.sound-pad').forEach(pad => {
    pad.addEventListener('click', () => {
        const soundType = pad.getAttribute('data-sound');
        playSynthSound(soundType);

        // Add visual animation class
        pad.classList.add('playing');
        setTimeout(() => pad.classList.remove('playing'), 150);
    });
});

// Render Audio visualizer canvas
function startVisualizer() {
    const canvas = document.getElementById('audioVisualizer');
    const ctx = canvas.getContext('2d');
    const analyser = state.synth.analyser;

    // Scale visualizer for High DPI
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.scale(dpr, dpr);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
        if (state.activeTab !== 'soundboard') {
            requestAnimationFrame(draw);
            return;
        }

        requestAnimationFrame(draw);

        analyser.getByteFrequencyData(dataArray);

        const width = canvas.width / dpr;
        const height = canvas.height / dpr;

        ctx.fillStyle = 'rgba(7, 7, 10, 0.2)';
        ctx.fillRect(0, 0, width, height);

        const barWidth = (width / bufferLength) * 1.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i] / 2;

            const grad = ctx.createLinearGradient(0, height, 0, height - barHeight);
            grad.addColorStop(0, '#0072ff');
            grad.addColorStop(0.5, '#00f0ff');
            grad.addColorStop(1, '#d000ff');

            ctx.fillStyle = grad;
            ctx.fillRect(x, height - barHeight, barWidth - 2, barHeight);

            x += barWidth;
        }
    }

    draw();
}

// -------------------------------------------------------------------------- //
//                               CODEX FILTERS                                //
// -------------------------------------------------------------------------- //

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filterVal = btn.getAttribute('data-filter');
        document.querySelectorAll('.codex-card').forEach(card => {
            if (filterVal === 'all' || card.getAttribute('data-faction') === filterVal) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    });
});

// -------------------------------------------------------------------------- //
//                               ARCADE GAME ENGINE                           //
// -------------------------------------------------------------------------- //

const gameEngine = {
    canvas: null,
    ctx: null,
    animationId: null,
    running: false,

    // Images
    assets: {
        titanCameraman: new Image(),
        gmanToilet: new Image(),
        loaded: 0,
        total: 2
    },

    // Game parameters
    player: {
        x: 0,
        y: 0,
        w: 50,
        h: 65,
        speed: 7,
        shield: 100,
        cores: 0,
        weaponLevel: 1, // 1: single, 2: double, 3: triple
    },

    keys: {},
    toilets: [],
    bullets: [],
    cores: [],
    bossLasers: [],
    particles: [],
    starfield: [],

    score: 0,
    level: 1,
    spawnTimer: 0,
    bossActive: false,
    boss: null,
    aimbotActive: false,
    autofireActive: false,
    automoveActive: false,
    autoFlightActive: false,
    godModeActive: false,
    gmAuthorized: false,
    supportDroneActive: false,
    supportDroneCooldown: 0,
    autofireCooldown: 0,

    // Touch joystick properties
    touch: {
        active: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        vectorX: 0,
        vectorY: 0,
        maxRadius: 45
    },

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Load visual representations
        this.assets.titanCameraman.src = 'assets/titan_cameraman.jpg';
        this.assets.gmanToilet.src = 'assets/gman_toilet.jpg';

        const checkLoad = () => {
            this.assets.loaded++;
        };
        this.assets.titanCameraman.onload = checkLoad;
        this.assets.gmanToilet.onload = checkLoad;

        // Reset display high score
        document.getElementById('highScoreVal').textContent = state.highScore;

        // Key Listeners for Computer
        window.addEventListener('keydown', (e) => {
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
            this.keys[e.key] = true;
            if (e.key === ' ' || e.key === 'Spacebar') {
                this.shootBullet();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        // Computer mouse aim / click to shoot
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.running) {
                this.shootBullet();
            }
        });

        // Detect Mobile / Touch Capability
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (isTouchDevice) {
            document.getElementById('touchControls').style.display = 'block';
            this.setupTouchControls();
        } else {
            document.getElementById('touchControls').style.display = 'none';
        }

        // Setup UI buttons
        document.getElementById('startGameBtn').onclick = () => this.start();
        document.getElementById('upgradeDbl').onclick = () => this.buyUpgrade('dbl');
        document.getElementById('upgradeTrpl').onclick = () => this.buyUpgrade('trpl');
        document.getElementById('upgradeDrone').onclick = () => this.buyUpgrade('drone');
        document.getElementById('upgradeShield').onclick = () => this.buyUpgrade('shield');
        document.getElementById('gmAccessSubmit').onclick = () => this.tryGameMasterAccess();
        document.getElementById('gmPasswordInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.tryGameMasterAccess();
            }
        });

        document.getElementById('btnAimbotToggle').onclick = () => {
            if (!this.gmAuthorized) {
                alert('Game Master access required to enable Target Assist.');
                return;
            }
            this.aimbotActive = !this.aimbotActive;
            const btn = document.getElementById('btnAimbotToggle');
            const val = document.getElementById('aimbotStatusVal');
            if (this.aimbotActive) {
                btn.style.background = 'rgba(57, 255, 20, 0.05)';
                btn.style.borderColor = 'rgba(57, 255, 20, 0.2)';
                val.className = 'upgrade-status text-glow-green';
                val.textContent = 'ON';
                playSynthSound('speaker-bass');
            } else {
                btn.style.background = 'rgba(255, 0, 85, 0.05)';
                btn.style.borderColor = 'rgba(255, 0, 85, 0.2)';
                val.className = 'upgrade-status text-glow-red';
                val.textContent = 'OFF';
                playSynthSound('toilet-flush');
            }
        };

        document.getElementById('btnAutofireToggle').onclick = () => {
            if (!this.gmAuthorized) {
                alert('Game Master access required to enable Target Assist.');
                return;
            }
            this.autofireActive = !this.autofireActive;
            const btn = document.getElementById('btnAutofireToggle');
            const val = document.getElementById('autofireStatusVal');
            if (this.autofireActive) {
                btn.style.background = 'rgba(57, 255, 20, 0.05)';
                btn.style.borderColor = 'rgba(57, 255, 20, 0.2)';
                val.className = 'upgrade-status text-glow-green';
                val.textContent = 'ON';
                playSynthSound('speaker-bass');
            } else {
                btn.style.background = 'rgba(255, 0, 85, 0.05)';
                btn.style.borderColor = 'rgba(255, 0, 85, 0.2)';
                val.className = 'upgrade-status text-glow-red';
                val.textContent = 'OFF';
                playSynthSound('toilet-flush');
            }
        };

        document.getElementById('btnAutomoveToggle').onclick = () => {
            if (!this.gmAuthorized) {
                alert('Game Master access required to enable Target Assist.');
                return;
            }
            this.automoveActive = !this.automoveActive;
            const btn = document.getElementById('btnAutomoveToggle');
            const val = document.getElementById('automoveStatusVal');
            if (this.automoveActive) {
                btn.style.background = 'rgba(57, 255, 20, 0.05)';
                btn.style.borderColor = 'rgba(57, 255, 20, 0.2)';
                val.className = 'upgrade-status text-glow-green';
                val.textContent = 'ON';
                playSynthSound('speaker-bass');
            } else {
                btn.style.background = 'rgba(255, 0, 85, 0.05)';
                btn.style.borderColor = 'rgba(255, 0, 85, 0.2)';
                val.className = 'upgrade-status text-glow-red';
                val.textContent = 'OFF';
                playSynthSound('toilet-flush');
            }
        };

        document.getElementById('btnAutoFlightToggle').onclick = () => {
            if (!this.gmAuthorized) {
                alert('Game Master access required to enable GM Mode features.');
                return;
            }
            this.autoFlightActive = !this.autoFlightActive;
            const btn = document.getElementById('btnAutoFlightToggle');
            const val = document.getElementById('autoFlightStatusVal');
            if (this.autoFlightActive) {
                btn.style.background = 'rgba(57, 255, 20, 0.05)';
                btn.style.borderColor = 'rgba(57, 255, 20, 0.2)';
                val.className = 'upgrade-status text-glow-green';
                val.textContent = 'ON';
                playSynthSound('speaker-bass');
            } else {
                btn.style.background = 'rgba(255, 0, 85, 0.05)';
                btn.style.borderColor = 'rgba(255, 0, 85, 0.2)';
                val.className = 'upgrade-status text-glow-red';
                val.textContent = 'OFF';
                playSynthSound('toilet-flush');
            }
        };

        document.getElementById('btnGodModeToggle').onclick = () => {
            if (!this.gmAuthorized) {
                alert('Game Master access required to enable GM Mode features.');
                return;
            }
            this.godModeActive = !this.godModeActive;
            const btn = document.getElementById('btnGodModeToggle');
            const val = document.getElementById('godModeStatusVal');
            if (this.godModeActive) {
                btn.style.background = 'rgba(57, 255, 20, 0.05)';
                btn.style.borderColor = 'rgba(57, 255, 20, 0.2)';
                val.className = 'upgrade-status text-glow-green';
                val.textContent = 'ON';
                this.player.shield = 100;
                this.updateUI();
                playSynthSound('speaker-bass');
            } else {
                btn.style.background = 'rgba(255, 0, 85, 0.05)';
                btn.style.borderColor = 'rgba(255, 0, 85, 0.2)';
                val.className = 'upgrade-status text-glow-red';
                val.textContent = 'OFF';
                playSynthSound('toilet-flush');
            }
        };

        this.generateStarfield();
        this.resetGameData();
        this.drawPlaceholder();
    },

    resizeCanvas() {
        if (!this.canvas) return;
        const rect = this.canvas.parentElement.getBoundingClientRect();

        // Native viewport adjustment
        this.canvas.width = rect.width;
        this.canvas.height = rect.width * (9 / 16); // force 16:9 ratio

        if (this.canvas.height > rect.height) {
            this.canvas.height = rect.height;
            this.canvas.width = rect.height * (16 / 9);
        }
    },

    setupTouchControls() {
        const joystickZone = document.getElementById('joystickZone');
        const handle = document.getElementById('joystickHandle');
        const shootBtn = document.getElementById('btnTouchShoot');

        joystickZone.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            const rect = joystickZone.getBoundingClientRect();
            this.touch.startX = rect.left + rect.width / 2;
            this.touch.startY = rect.top + rect.height / 2;
            this.touch.active = true;
        }, { passive: true });

        joystickZone.addEventListener('touchmove', (e) => {
            if (!this.touch.active) return;
            const touch = e.touches[0];

            let dx = touch.clientX - this.touch.startX;
            let dy = touch.clientY - this.touch.startY;
            let dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > this.touch.maxRadius) {
                dx = (dx / dist) * this.touch.maxRadius;
                dy = (dy / dist) * this.touch.maxRadius;
                dist = this.touch.maxRadius;
            }

            handle.style.transform = `translate(${dx}px, ${dy}px)`;

            // Normalize joystick vector
            this.touch.vectorX = dx / this.touch.maxRadius;
            this.touch.vectorY = dy / this.touch.maxRadius;
        }, { passive: true });

        const stopJoystick = () => {
            this.touch.active = false;
            this.touch.vectorX = 0;
            this.touch.vectorY = 0;
            handle.style.transform = 'translate(0px, 0px)';
        };

        joystickZone.addEventListener('touchend', stopJoystick, { passive: true });
        joystickZone.addEventListener('touchcancel', stopJoystick, { passive: true });

        shootBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.shootBullet();
        });
    },

    resetGameData() {
        this.score = 0;
        this.level = 1;
        this.player.shield = 100;
        this.player.cores = 0;
        this.player.weaponLevel = 1;
        this.player.x = this.canvas.width / 2 - this.player.w / 2;
        this.player.y = this.canvas.height * 0.8;

        this.toilets = [];
        this.bullets = [];
        this.cores = [];
        this.bossLasers = [];
        this.particles = [];
        this.bossActive = false;
        this.boss = null;
        this.aimbotActive = false;
        this.autofireActive = false;
        this.automoveActive = false;
        this.autoFlightActive = false;
        this.supportDroneActive = false;
        this.supportDroneCooldown = 0;
        this.gmAuthorized = false;
        this.godModeActive = false;
        this.autofireCooldown = 0;

        // Reset UI toggle display states
        const aimbotBtn = document.getElementById('btnAimbotToggle');
        const aimbotVal = document.getElementById('aimbotStatusVal');
        if (aimbotBtn && aimbotVal) {
            aimbotBtn.style.background = 'rgba(255, 0, 85, 0.05)';
            aimbotBtn.style.borderColor = 'rgba(255, 0, 85, 0.2)';
            aimbotVal.className = 'upgrade-status text-glow-red';
            aimbotVal.textContent = 'OFF';
        }

        const autofireBtn = document.getElementById('btnAutofireToggle');
        const autofireVal = document.getElementById('autofireStatusVal');
        if (autofireBtn && autofireVal) {
            autofireBtn.style.background = 'rgba(255, 0, 85, 0.05)';
            autofireBtn.style.borderColor = 'rgba(255, 0, 85, 0.2)';
            autofireVal.className = 'upgrade-status text-glow-red';
            autofireVal.textContent = 'OFF';
        }

        const automoveBtn = document.getElementById('btnAutomoveToggle');
        const automoveVal = document.getElementById('automoveStatusVal');
        if (automoveBtn && automoveVal) {
            automoveBtn.style.background = 'rgba(255, 0, 85, 0.05)';
            automoveBtn.style.borderColor = 'rgba(255, 0, 85, 0.2)';
            automoveBtn.style.pointerEvents = 'none';
            automoveBtn.style.opacity = '0.7';
            automoveVal.className = 'upgrade-status text-glow-red';
            automoveVal.textContent = 'LOCKED';
        }

        const autoFlightBtn = document.getElementById('btnAutoFlightToggle');
        const autoFlightVal = document.getElementById('autoFlightStatusVal');
        if (autoFlightBtn && autoFlightVal) {
            autoFlightBtn.style.background = 'rgba(255, 0, 85, 0.05)';
            autoFlightBtn.style.borderColor = 'rgba(255, 0, 85, 0.2)';
            autoFlightVal.className = 'upgrade-status text-glow-red';
            autoFlightVal.textContent = 'OFF';
        }

        const godModeBtn = document.getElementById('btnGodModeToggle');
        const godModeVal = document.getElementById('godModeStatusVal');
        if (godModeBtn && godModeVal) {
            godModeBtn.style.background = 'rgba(255, 0, 85, 0.05)';
            godModeBtn.style.borderColor = 'rgba(255, 0, 85, 0.2)';
            godModeVal.className = 'upgrade-status text-glow-red';
            godModeVal.textContent = 'OFF';
        }

        const droneBtn = document.getElementById('upgradeDrone');
        const droneStatus = droneBtn ? droneBtn.querySelector('.upgrade-status') : null;
        if (droneBtn && droneStatus) {
            droneBtn.className = 'upgrade-item locked';
            droneStatus.textContent = 'LOCKED';
        }

        this.updateTargetAssistLockUI();
        this.updateUI();
    },

    updateTargetAssistLockUI() {
        const aimbotBtn = document.getElementById('btnAimbotToggle');
        const aimbotVal = document.getElementById('aimbotStatusVal');
        const autofireBtn = document.getElementById('btnAutofireToggle');
        const autofireVal = document.getElementById('autofireStatusVal');
        const automoveBtn = document.getElementById('btnAutomoveToggle');
        const automoveVal = document.getElementById('automoveStatusVal');
        const autoFlightBtn = document.getElementById('btnAutoFlightToggle');
        const autoFlightVal = document.getElementById('autoFlightStatusVal');
        const godModeBtn = document.getElementById('btnGodModeToggle');
        const godModeVal = document.getElementById('godModeStatusVal');
        const gmStatus = document.getElementById('gmAccessStatus');

        if (!this.gmAuthorized) {
            [aimbotBtn, autofireBtn, automoveBtn, autoFlightBtn, godModeBtn].forEach(btn => {
                if (btn) {
                    btn.style.pointerEvents = 'none';
                    btn.style.opacity = '0.7';
                }
            });
            if (aimbotVal) {
                aimbotVal.textContent = 'LOCKED';
                aimbotVal.className = 'upgrade-status text-glow-red';
            }
            if (autofireVal) {
                autofireVal.textContent = 'LOCKED';
                autofireVal.className = 'upgrade-status text-glow-red';
            }
            if (automoveVal) {
                automoveVal.textContent = 'LOCKED';
                automoveVal.className = 'upgrade-status text-glow-red';
            }
            if (autoFlightVal) {
                autoFlightVal.textContent = 'LOCKED';
                autoFlightVal.className = 'upgrade-status text-glow-red';
            }
            if (godModeVal) {
                godModeVal.textContent = 'LOCKED';
                godModeVal.className = 'upgrade-status text-glow-red';
            }
            if (gmStatus) {
                gmStatus.textContent = 'LOCKED';
                gmStatus.className = 'upgrade-status text-glow-red';
            }
        } else {
            [aimbotBtn, autofireBtn, automoveBtn, autoFlightBtn, godModeBtn].forEach(btn => {
                if (btn) {
                    btn.style.pointerEvents = '';
                    btn.style.opacity = '1';
                }
            });
            if (aimbotVal) {
                aimbotVal.textContent = this.aimbotActive ? 'ON' : 'OFF';
                aimbotVal.className = this.aimbotActive ? 'upgrade-status text-glow-green' : 'upgrade-status text-glow-red';
            }
            if (autofireVal) {
                autofireVal.textContent = this.autofireActive ? 'ON' : 'OFF';
                autofireVal.className = this.autofireActive ? 'upgrade-status text-glow-green' : 'upgrade-status text-glow-red';
            }
            if (automoveVal) {
                automoveVal.textContent = this.automoveActive ? 'ON' : 'OFF';
                automoveVal.className = this.automoveActive ? 'upgrade-status text-glow-green' : 'upgrade-status text-glow-red';
            }
            if (autoFlightVal) {
                autoFlightVal.textContent = this.autoFlightActive ? 'ON' : 'OFF';
                autoFlightVal.className = this.autoFlightActive ? 'upgrade-status text-glow-green' : 'upgrade-status text-glow-red';
            }
            if (godModeVal) {
                godModeVal.textContent = this.godModeActive ? 'ON' : 'OFF';
                godModeVal.className = this.godModeActive ? 'upgrade-status text-glow-green' : 'upgrade-status text-glow-red';
            }
            if (gmStatus) {
                gmStatus.textContent = 'GRANTED';
                gmStatus.className = 'upgrade-status text-glow-green';
            }
        }
    },

    generateStarfield() {
        this.starfield = [];
        for (let i = 0; i < 60; i++) {
            this.starfield.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 0.5,
                speed: Math.random() * 1.5 + 0.5
            });
        }
    },

    start() {
        document.getElementById('gameOverlay').style.display = 'none';
        this.resetGameData();
        this.running = true;

        // Resume dynamic Web Audio context if initialized
        initAudioContext();

        this.loop();
    },

    stop() {
        this.running = false;
        cancelAnimationFrame(this.animationId);
        document.getElementById('gameOverlay').style.display = 'flex';
    },

    gameOver() {
        this.running = false;
        cancelAnimationFrame(this.animationId);

        // Save high score
        if (this.score > state.highScore) {
            state.highScore = this.score;
            localStorage.setItem('skibidi_highscore', state.highScore);
            document.getElementById('highScoreVal').textContent = state.highScore;
        }

        playSynthSound('tv-static'); // Game over hum

        document.getElementById('overlayTitle').textContent = "ALLIANCE DEFEATED";
        document.getElementById('overlayDesc').innerHTML = `You defended Sector 7 with valor.<br><strong>Final Score: ${this.score}</strong><br><strong>Cores Recovered: ${this.player.cores}</strong>`;
        document.getElementById('startGameBtn').innerHTML = '<i class="fa-solid fa-rotate-right"></i> RESTART BATTLE';
        document.getElementById('gameOverlay').style.display = 'flex';
    },

    drawPlaceholder() {
        this.ctx.fillStyle = '#07070a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Grid background
        this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
        this.ctx.lineWidth = 1;
        const grid = 40;
        for (let x = 0; x < this.canvas.width; x += grid) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.canvas.height; y += grid) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    },

    loop() {
        if (!this.running) return;
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.loop());
    },

    // -------------------------------------------------------------------------- //
    //                               GAME UPDATES                                 //
    // -------------------------------------------------------------------------- //

    update() {
        this.updateStarfield();
        this.updatePlayer();
        this.updateBullets();
        this.updateToilets();
        this.updateBossLasers();
        this.updateCores();
        this.updateSupportDrone();
        this.updateParticles();
        this.checkUpgradesAvailability();
    },

    updateStarfield() {
        this.starfield.forEach(star => {
            star.y += star.speed;
            if (star.y > this.canvas.height) {
                star.y = 0;
                star.x = Math.random() * this.canvas.width;
            }
        });
    },

    updatePlayer() {
        // Auto-Move logic if active (Autopilot farm)
        if (this.automoveActive) {
            let targetX = null;
            if (this.toilets.length > 0) {
                // Target the nearest toilet
                let nearest = null;
                let minDist = Infinity;
                const pCenterX = this.player.x + this.player.w / 2;
                this.toilets.forEach(t => {
                    const tCenterX = t.x + t.w / 2;
                    const dy = t.y - this.player.y;
                    const dist = Math.abs(tCenterX - pCenterX) + Math.abs(dy);
                    if (dist < minDist) {
                        minDist = dist;
                        nearest = t;
                    }
                });
                if (nearest) {
                    targetX = nearest.x + nearest.w / 2;
                }
            } else if (this.cores.length > 0) {
                // If no toilets, prioritize collecting cores
                let nearest = null;
                let minDist = Infinity;
                const pCenterX = this.player.x + this.player.w / 2;
                this.cores.forEach(c => {
                    const dist = Math.abs(c.x - pCenterX);
                    if (dist < minDist) {
                        minDist = dist;
                        nearest = c;
                    }
                });
                if (nearest) {
                    targetX = nearest.x;
                }
            }

            if (targetX !== null) {
                const pCenterX = this.player.x + this.player.w / 2;
                const diff = targetX - pCenterX;
                if (Math.abs(diff) > 4) {
                    this.player.x += Math.sign(diff) * this.player.speed * 0.85;
                }
            }
        }

        if (this.autoFlightActive) {
            const desired = {
                x: this.player.x + this.player.w / 2,
                y: this.player.y
            };

            // Dodge boss lasers first
            this.bossLasers.forEach(l => {
                const laserCenterX = l.x + l.w / 2;
                if (Math.abs(laserCenterX - (this.player.x + this.player.w / 2)) < 80 && l.y > this.player.y - 140) {
                    if (laserCenterX < this.player.x + this.player.w / 2) {
                        desired.x = this.player.x + 110;
                    } else {
                        desired.x = this.player.x - 110;
                    }
                    desired.y = this.player.y + 20;
                }
            });

            // Seek cores if safe and no laser threat
            if (this.cores.length > 0) {
                let nearest = null;
                let minDist = Infinity;
                const pCenterX = this.player.x + this.player.w / 2;
                this.cores.forEach(c => {
                    const dist = Math.hypot(c.x - pCenterX, c.y - this.player.y);
                    if (dist < minDist) {
                        minDist = dist;
                        nearest = c;
                    }
                });
                if (nearest) {
                    desired.x = nearest.x;
                    desired.y = Math.min(this.canvas.height - this.player.h, Math.max(this.canvas.height * 0.55, nearest.y - 50));
                }
            } else if (this.toilets.length > 0) {
                let nearest = null;
                let minDist = Infinity;
                const pCenterX = this.player.x + this.player.w / 2;
                this.toilets.forEach(t => {
                    const dist = Math.hypot(t.x + t.w / 2 - pCenterX, t.y - this.player.y);
                    if (dist < minDist) {
                        minDist = dist;
                        nearest = t;
                    }
                });
                if (nearest) {
                    desired.x = nearest.x + nearest.w / 2;
                    desired.y = Math.min(this.canvas.height - this.player.h, Math.max(this.canvas.height * 0.55, nearest.y - 80));
                }
            }

            const centerX = this.player.x + this.player.w / 2;
            const diffX = desired.x - centerX;
            const diffY = desired.y - this.player.y;

            if (Math.abs(diffX) > 4) {
                this.player.x += Math.sign(diffX) * this.player.speed * 0.95;
            }
            if (Math.abs(diffY) > 3) {
                this.player.y += Math.sign(diffY) * this.player.speed * 0.75;
            }
        }

        // Move with computer keys
        if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
            this.player.x -= this.player.speed;
        }
        if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
            this.player.x += this.player.speed;
        }
        if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) {
            this.player.y -= this.player.speed;
        }
        if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) {
            this.player.y += this.player.speed;
        }

        // Move with touch joystick
        if (this.touch.active) {
            this.player.x += this.touch.vectorX * this.player.speed;
            this.player.y += this.touch.vectorY * this.player.speed;
        }

        // Keep player in bounds
        if (this.player.x < 0) this.player.x = 0;
        if (this.player.x > this.canvas.width - this.player.w) this.player.x = this.canvas.width - this.player.w;

        // vertical bounds restriction (player stays in bottom 40% of screen)
        const verticalBound = this.canvas.height * 0.55;
        if (this.player.y < verticalBound) this.player.y = verticalBound;
        if (this.player.y > this.canvas.height - this.player.h) this.player.y = this.canvas.height - this.player.h;
    },

    shootBullet() {
        if (!this.running) return;

        playSynthSound('laser-blast');

        const bulletSpeed = 10;
        const bY = this.player.y;
        const bW = 4;
        const bH = 15;

        // Calculate aimbot target angle if active
        let targetAngle = null;
        if (this.aimbotActive && this.toilets.length > 0) {
            // Find nearest toilet
            let nearest = null;
            let minDist = Infinity;
            const pCenterX = this.player.x + this.player.w / 2;
            const pCenterY = this.player.y;

            this.toilets.forEach(t => {
                const tCenterX = t.x + t.w / 2;
                const tCenterY = t.y + t.h / 2;
                const dx = tCenterX - pCenterX;
                const dy = tCenterY - pCenterY;
                const dist = dx * dx + dy * dy;
                if (dist < minDist) {
                    minDist = dist;
                    nearest = t;
                }
            });

            if (nearest) {
                const dx = (nearest.x + nearest.w / 2) - pCenterX;
                const dy = (nearest.y + nearest.h / 2) - pCenterY;
                targetAngle = Math.atan2(dy, dx);
            }
        }

        if (this.player.weaponLevel === 1) {
            // Single shot center
            let vx = 0;
            let vy = -bulletSpeed;
            if (targetAngle !== null) {
                vx = Math.cos(targetAngle) * bulletSpeed;
                vy = Math.sin(targetAngle) * bulletSpeed;
            }
            this.bullets.push({
                x: this.player.x + this.player.w / 2 - bW / 2,
                y: bY,
                w: bW,
                h: bH,
                vy: vy,
                vx: vx
            });
        } else if (this.player.weaponLevel === 2) {
            // Double shot
            let vx = 0;
            let vy = -bulletSpeed;
            if (targetAngle !== null) {
                vx = Math.cos(targetAngle) * bulletSpeed;
                vy = Math.sin(targetAngle) * bulletSpeed;
            }
            this.bullets.push({
                x: this.player.x + 8,
                y: bY + 10,
                w: bW,
                h: bH,
                vy: vy,
                vx: vx
            });
            this.bullets.push({
                x: this.player.x + this.player.w - 12,
                y: bY + 10,
                w: bW,
                h: bH,
                vy: vy,
                vx: vx
            });
        } else if (this.player.weaponLevel === 3) {
            // Triple shot (spread or triple lock-on)
            if (targetAngle !== null) {
                const vx = Math.cos(targetAngle) * bulletSpeed;
                const vy = Math.sin(targetAngle) * bulletSpeed;

                // Slight spread around targeted angle
                const spread = 0.18;
                const vxLeft = Math.cos(targetAngle - spread) * bulletSpeed;
                const vyLeft = Math.sin(targetAngle - spread) * bulletSpeed;
                const vxRight = Math.cos(targetAngle + spread) * bulletSpeed;
                const vyRight = Math.sin(targetAngle + spread) * bulletSpeed;

                this.bullets.push({
                    x: this.player.x + this.player.w / 2 - bW / 2,
                    y: bY,
                    w: bW,
                    h: bH,
                    vy: vy,
                    vx: vx
                });
                this.bullets.push({
                    x: this.player.x + 5,
                    y: bY + 10,
                    w: bW,
                    h: bH,
                    vy: vyLeft,
                    vx: vxLeft
                });
                this.bullets.push({
                    x: this.player.x + this.player.w - 9,
                    y: bY + 10,
                    w: bW,
                    h: bH,
                    vy: vyRight,
                    vx: vxRight
                });
            } else {
                this.bullets.push({
                    x: this.player.x + this.player.w / 2 - bW / 2,
                    y: bY,
                    w: bW,
                    h: bH,
                    vy: -bulletSpeed,
                    vx: 0
                });
                this.bullets.push({
                    x: this.player.x + 5,
                    y: bY + 10,
                    w: bW,
                    h: bH,
                    vy: -bulletSpeed * 0.95,
                    vx: -1.5
                });
                this.bullets.push({
                    x: this.player.x + this.player.w - 9,
                    y: bY + 10,
                    w: bW,
                    h: bH,
                    vy: -bulletSpeed * 0.95,
                    vx: 1.5
                });
            }
        }
    },

    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.y += b.vy;
            if (b.vx) b.x += b.vx;

            // Remove offscreen (check all edges for bullets that drift horizontally)
            if (b.y < -20 || b.y > this.canvas.height + 20 || b.x < -20 || b.x > this.canvas.width + 20) {
                this.bullets.splice(i, 1);
            }
        }
    },

    updateToilets() {
        this.spawnTimer++;

        // Calculate spawn rate based on level
        const spawnDelay = Math.max(30, 90 - this.level * 8);

        // Standard toilet spawn
        if (this.spawnTimer >= spawnDelay && !this.bossActive) {
            this.spawnTimer = 0;
            this.spawnToilet();
        }

        // Level-based boss spawning (every 300 points), guarded so it only fires once per threshold
        if (this.score > 0 && this.score % 300 === 0 && !this.bossActive && !this._lastBossScore) {
            this._lastBossScore = this.score;
            this.spawnGmanBoss();
        } else if (this.score % 300 !== 0) {
            this._lastBossScore = null;
        }

        // Update active toilets
        for (let i = this.toilets.length - 1; i >= 0; i--) {
            const t = this.toilets[i];

            // AI movement behaviors
            if (t.isBoss) {
                // Boss hovers left/right
                t.x += t.vx;
                if (t.x < 30 || t.x > this.canvas.width - t.w - 30) {
                    t.vx *= -1;
                }

                // Periodic laser fire
                t.laserTimer++;
                if (t.laserTimer > 70) {
                    t.laserTimer = 0;
                    this.fireBossLasers(t);
                }
            } else {
                // Normal toilet moves straight down or zigzags
                t.y += t.vy;
                if (t.zigzag) {
                    t.x += Math.sin(t.y / 20) * 2;
                }

                // Check collision with player
                if (this.checkCollision(this.player, t)) {
                    if (!this.godModeActive) {
                        this.player.shield -= 25;
                    }
                    this.createExplosion(t.x + t.w / 2, t.y + t.h / 2, '#ff0055', 20);
                    playSynthSound('speaker-bass'); // damage rumble
                    this.toilets.splice(i, 1);
                    this.updateUI();

                    if (!this.godModeActive && this.player.shield <= 0) {
                        this.gameOver();
                    }
                    continue;
                }

                // Offscreen penalty (reach bottom city borders)
                if (t.y > this.canvas.height) {
                    if (!this.godModeActive) {
                        this.player.shield -= 15;
                    }
                    this.toilets.splice(i, 1);
                    this.updateUI();
                    if (!this.godModeActive && this.player.shield <= 0) {
                        this.gameOver();
                    }
                    continue;
                }
            }

            // Bullet collision test
            for (let j = this.bullets.length - 1; j >= 0; j--) {
                const b = this.bullets[j];
                if (this.checkCollision(b, t)) {
                    // Reduce enemy HP
                    t.hp -= 1;
                    this.bullets.splice(j, 1);

                    // Spawn hit sparks
                    this.createExplosion(b.x, b.y, '#00f0ff', 5);

                    if (t.hp <= 0) {
                        this.createExplosion(t.x + t.w / 2, t.y + t.h / 2, t.isBoss ? '#ffe600' : '#ffffff', t.isBoss ? 50 : 15);
                        playSynthSound('toilet-flush');

                        // Increment core drop rate
                        if (Math.random() < 0.65 || t.isBoss) {
                            this.spawnCore(t.x + t.w / 2, t.y + t.h / 2, t.isBoss ? 5 : 1);
                        }

                        // Add score
                        this.score += t.points;
                        this.checkLevelUp();
                        this.updateUI();

                        if (t.isBoss) {
                            this.bossActive = false;
                            this.boss = null;
                        }

                        this.toilets.splice(i, 1);
                        break;
                    }
                }
            }
        }
    },

    spawnToilet() {
        const types = [
            { name: 'normal', w: 38, h: 48, hp: 1, vy: 2, points: 10, zigzag: false },
            { name: 'fast', w: 32, h: 42, hp: 1, vy: 3.5, points: 20, zigzag: true },
            { name: 'giant', w: 55, h: 65, hp: 3, vy: 1.2, points: 30, zigzag: false }
        ];

        // Pick type based on level probability
        let type = types[0];
        const r = Math.random();
        if (this.level >= 2 && r > 0.6) {
            type = types[1];
        }
        if (this.level >= 3 && r > 0.85) {
            type = types[2];
        }

        const tW = type.w;
        const tH = type.h;
        this.toilets.push({
            x: Math.random() * (this.canvas.width - tW),
            y: -tH,
            w: tW,
            h: tH,
            vy: type.vy,
            hp: type.hp,
            points: type.points,
            zigzag: type.zigzag,
            isBoss: false
        });
    },

    spawnGmanBoss() {
        this.bossActive = true;
        const bW = 100;
        const bH = 115;
        this.boss = {
            x: this.canvas.width / 2 - bW / 2,
            y: 30,
            w: bW,
            h: bH,
            vx: 1.8,
            vy: 0,
            hp: 20 + this.level * 8,
            points: 150,
            isBoss: true,
            laserTimer: 0
        };
        this.toilets.push(this.boss);
        playSynthSound('toilet-laugh'); // boss laugh
    },

    fireBossLasers(boss) {
        // Double laser beam downwards
        playSynthSound('laser-blast');
        this.bossLasers.push({
            x: boss.x + 25,
            y: boss.y + 70,
            w: 8,
            h: 22,
            vy: 5.5
        });
        this.bossLasers.push({
            x: boss.x + boss.w - 33,
            y: boss.y + 70,
            w: 8,
            h: 22,
            vy: 5.5
        });
    },

    updateBossLasers() {
        for (let i = this.bossLasers.length - 1; i >= 0; i--) {
            const l = this.bossLasers[i];
            l.y += l.vy;

            // Collide with player
            if (this.checkCollision(l, this.player)) {
                if (!this.godModeActive) {
                    this.player.shield -= 12;
                }
                this.createExplosion(l.x, l.y, '#ffe600', 8);
                playSynthSound('speaker-bass');
                this.bossLasers.splice(i, 1);
                this.updateUI();

                if (!this.godModeActive && this.player.shield <= 0) {
                    this.gameOver();
                }
                continue;
            }

            // Remove offscreen
            if (l.y > this.canvas.height + 20) {
                this.bossLasers.splice(i, 1);
            }
        }
    },

    spawnCore(x, y, count) {
        for (let i = 0; i < count; i++) {
            this.cores.push({
                x: x + (Math.random() * 20 - 10),
                y: y + (Math.random() * 20 - 10),
                size: 8,
                vy: 1.8
            });
        }
    },

    updateCores() {
        for (let i = this.cores.length - 1; i >= 0; i--) {
            const c = this.cores[i];
            c.y += c.vy;

            // Collide with player
            if (this.checkCollision({ x: c.x - c.size, y: c.y - c.size, w: c.size * 2, h: c.size * 2 }, this.player)) {
                this.player.cores += 1;
                this.cores.splice(i, 1);
                this.updateUI();
                playSynthSound('laser-blast'); // pitch-shifted pick up
                continue;
            }

            // Remove offscreen
            if (c.y > this.canvas.height + 20) {
                this.cores.splice(i, 1);
            }
        }
    },

    createExplosion(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 + 1;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 3 + 1,
                color: color,
                alpha: 1.0,
                decay: Math.random() * 0.03 + 0.015
            });
        }
    },

    updateSupportDrone() {
        if (!this.supportDroneActive) return;

        this.supportDroneCooldown++;
        if (this.supportDroneCooldown >= 45) {
            this.supportDroneCooldown = 0;
            // Fire a helper projectile toward nearest toilet
            let target = null;
            let minDist = Infinity;
            const pCenterX = this.player.x + this.player.w / 2;
            const pCenterY = this.player.y;
            this.toilets.forEach(t => {
                const tCenterX = t.x + t.w / 2;
                const tCenterY = t.y + t.h / 2;
                const dist = Math.hypot(tCenterX - pCenterX, tCenterY - pCenterY);
                if (dist < minDist) {
                    minDist = dist;
                    target = t;
                }
            });

            const bulletSpeed = 8;
            if (target) {
                const dx = (target.x + target.w / 2) - pCenterX;
                const dy = (target.y + target.h / 2) - pCenterY;
                const angle = Math.atan2(dy, dx);
                this.bullets.push({
                    x: pCenterX - 3,
                    y: pCenterY - 8,
                    w: 6,
                    h: 12,
                    vx: Math.cos(angle) * bulletSpeed,
                    vy: Math.sin(angle) * bulletSpeed
                });
            } else {
                this.bullets.push({
                    x: pCenterX - 3,
                    y: pCenterY - 8,
                    w: 6,
                    h: 12,
                    vx: 0,
                    vy: -bulletSpeed
                });
            }
        }
    },

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= p.decay;

            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }
    },

    checkLevelUp() {
        const targetLevel = Math.floor(this.score / 200) + 1;
        if (targetLevel > this.level) {
            this.level = targetLevel;
            // Play level up jingle
            playSynthSound('speaker-bass');
            setTimeout(() => playSynthSound('laser-blast'), 150);
        }
    },

    checkCollision(rect1, rect2) {
        return (
            rect1.x < rect2.x + rect2.w &&
            rect1.x + rect1.w > rect2.x &&
            rect1.y < rect2.y + rect2.h &&
            rect1.y + rect1.h > rect2.y
        );
    },

    buyUpgrade(type) {
        if (!this.running) return;

        if (type === 'dbl' && this.player.cores >= 15 && this.player.weaponLevel < 2) {
            this.player.cores -= 15;
            this.player.weaponLevel = 2;
        } else if (type === 'trpl' && this.player.cores >= 35 && this.player.weaponLevel < 3) {
            this.player.cores -= 35;
            this.player.weaponLevel = 3;
        } else if (type === 'drone' && this.player.cores >= 25 && !this.supportDroneActive) {
            this.player.cores -= 25;
            this.supportDroneActive = true;
            this.supportDroneCooldown = 0;
        } else if (type === 'shield' && this.player.cores >= 10 && this.player.shield < 100) {
            this.player.cores -= 10;
            this.player.shield = Math.min(100, this.player.shield + 40);
        }
        playSynthSound('speaker-bass'); // confirm tone
        this.updateUI();
    },

    tryGameMasterAccess() {
        const passwordInput = document.getElementById('gmPasswordInput');
        const status = document.getElementById('gmAccessStatus');
        const password = passwordInput ? passwordInput.value.trim() : '';
        const secret = 'yimwan';

        if (password === secret) {
            this.gmAuthorized = true;
            if (status) {
                status.textContent = 'GRANTED';
                status.className = 'upgrade-status text-glow-green';
            }
            if (passwordInput) {
                passwordInput.value = '';
            }
            playSynthSound('speaker-bass');
            this.updateTargetAssistLockUI();
        } else {
            if (status) {
                status.textContent = 'DENIED';
                status.className = 'upgrade-status text-glow-red';
            }
            playSynthSound('toilet-flush');
            alert('Invalid Game Master password.');
        }
    },

    checkUpgradesAvailability() {
        const uDbl = document.getElementById('upgradeDbl');
        const uTrpl = document.getElementById('upgradeTrpl');
        const uDrone = document.getElementById('upgradeDrone');
        const uShield = document.getElementById('upgradeShield');

        // Double Laser
        if (this.player.weaponLevel >= 2) {
            uDbl.className = 'upgrade-item purchased';
            uDbl.querySelector('.upgrade-status').textContent = 'ACTIVE';
        } else if (this.player.cores >= 15) {
            uDbl.className = 'upgrade-item available';
            uDbl.querySelector('.upgrade-status').textContent = 'BUY';
        } else {
            uDbl.className = 'upgrade-item locked';
            uDbl.querySelector('.upgrade-status').textContent = 'LOCKED';
        }

        // Triple Laser
        if (this.player.weaponLevel >= 3) {
            uTrpl.className = 'upgrade-item purchased';
            uTrpl.querySelector('.upgrade-status').textContent = 'ACTIVE';
        } else if (this.player.cores >= 35 && this.player.weaponLevel === 2) {
            uTrpl.className = 'upgrade-item available';
            uTrpl.querySelector('.upgrade-status').textContent = 'BUY';
        } else {
            uTrpl.className = 'upgrade-item locked';
            uTrpl.querySelector('.upgrade-status').textContent = 'LOCKED';
        }

        // Support Drone
        if (this.supportDroneActive) {
            uDrone.className = 'upgrade-item purchased';
            uDrone.querySelector('.upgrade-status').textContent = 'DEPLOYED';
        } else if (this.player.cores >= 25) {
            uDrone.className = 'upgrade-item available';
            uDrone.querySelector('.upgrade-status').textContent = 'BUY';
        } else {
            uDrone.className = 'upgrade-item locked';
            uDrone.querySelector('.upgrade-status').textContent = 'LOCKED';
        }

        // Recharge Shield
        if (this.player.shield >= 100) {
            uShield.className = 'upgrade-item purchased';
            uShield.querySelector('.upgrade-status').textContent = 'MAXED';
        } else if (this.player.cores >= 10) {
            uShield.className = 'upgrade-item available';
            uShield.querySelector('.upgrade-status').textContent = 'CHARGE';
        } else {
            uShield.className = 'upgrade-item locked';
            uShield.querySelector('.upgrade-status').textContent = 'LOCKED';
        }
    },

    updateUI() {
        document.getElementById('scoreVal').textContent = this.score;
        document.getElementById('levelVal').textContent = this.level;
        document.getElementById('coresVal').textContent = this.player.cores;

        const shieldBar = document.getElementById('shieldBar');
        shieldBar.style.width = `${this.player.shield}%`;

        // Color transition shield bar
        if (this.player.shield > 50) {
            shieldBar.style.background = 'linear-gradient(90deg, #0072ff, #00f0ff)';
        } else if (this.player.shield > 25) {
            shieldBar.style.background = 'linear-gradient(90deg, #e67e22, #ffe600)';
        } else {
            shieldBar.style.background = 'linear-gradient(90deg, #ff0055, #c0392b)';
        }
    },

    // -------------------------------------------------------------------------- //
    //                               GAME CANVAS DRAWING                          //
    // -------------------------------------------------------------------------- //

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#07070a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Starfield background
        this.ctx.fillStyle = '#fff';
        this.starfield.forEach(star => {
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Grid scanlines
        this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.03)';
        this.ctx.lineWidth = 1;
        const grid = 50;
        for (let x = 0; x < this.canvas.width; x += grid) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        // Draw Cores
        this.cores.forEach(c => {
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = '#00f0ff';
            this.ctx.fillStyle = '#00f0ff';
            this.ctx.beginPath();
            // Draw small diamond chip shape
            this.ctx.moveTo(c.x, c.y - c.size);
            this.ctx.lineTo(c.x + c.size, c.y);
            this.ctx.lineTo(c.x, c.y + c.size);
            this.ctx.lineTo(c.x - c.size, c.y);
            this.ctx.closePath();
            this.ctx.fill();
        });
        this.ctx.shadowBlur = 0; // reset

        // Draw Bullets
        this.ctx.shadowBlur = 12;
        this.ctx.shadowColor = '#00f0ff';
        this.ctx.fillStyle = '#00f0ff';
        this.bullets.forEach(b => {
            this.ctx.fillRect(b.x, b.y, b.w, b.h);
        });

        // Draw Boss Lasers
        this.ctx.shadowColor = '#ff0055';
        this.ctx.fillStyle = '#ff0055';
        this.bossLasers.forEach(l => {
            this.ctx.fillRect(l.x, l.y, l.w, l.h);
        });
        this.ctx.shadowBlur = 0; // reset

        // Draw Player (Titan Cameraman)
        if (this.assets.loaded >= 2) {
            // Draw image sprite
            this.ctx.drawImage(this.assets.titanCameraman, this.player.x, this.player.y, this.player.w, this.player.h);
        } else {
            // Fallback Vector Drawing
            this.ctx.fillStyle = '#3498db';
            this.ctx.fillRect(this.player.x, this.player.y, this.player.w, this.player.h);
        }

        // Player glowing reactor core overlay
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#00f0ff';
        this.ctx.fillStyle = '#00f0ff';
        this.ctx.beginPath();
        this.ctx.arc(this.player.x + this.player.w / 2, this.player.y + 40, 6, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // Draw Toilets (Invaders)
        this.toilets.forEach(t => {
            if (t.isBoss) {
                if (this.assets.loaded >= 2) {
                    this.ctx.drawImage(this.assets.gmanToilet, t.x, t.y, t.w, t.h);
                } else {
                    this.ctx.fillStyle = '#e74c3c';
                    this.ctx.fillRect(t.x, t.y, t.w, t.h);
                }

                // Boss Health bar
                const maxHp = 20 + this.level * 8;
                const hpPercent = t.hp / maxHp;
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                this.ctx.fillRect(t.x, t.y - 12, t.w, 6);
                this.ctx.fillStyle = '#ff0055';
                this.ctx.fillRect(t.x, t.y - 12, t.w * hpPercent, 6);
            } else {
                // Vector drawn standard toilet bowl outline to feel custom!
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 2.5;
                this.ctx.fillStyle = '#1e1e24';

                // Draw bowl
                this.ctx.beginPath();
                this.ctx.arc(t.x + t.w / 2, t.y + t.h * 0.5, t.w * 0.4, 0, Math.PI, false);
                this.ctx.lineTo(t.x + t.w * 0.1, t.y + t.h * 0.25);
                this.ctx.lineTo(t.x + t.w * 0.9, t.y + t.h * 0.25);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();

                // Draw tank
                this.ctx.fillRect(t.x + t.w * 0.15, t.y + t.h * 0.05, t.w * 0.7, t.h * 0.2);
                this.ctx.strokeRect(t.x + t.w * 0.15, t.y + t.h * 0.05, t.w * 0.7, t.h * 0.2);

                // Draw head peaking out
                this.ctx.fillStyle = '#f5b041';
                this.ctx.beginPath();
                this.ctx.arc(t.x + t.w / 2, t.y + t.h * 0.35, 7, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });

        // Draw Particles
        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.alpha;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1.0; // reset
    }
};

// Start initialization when DOM loaded
window.addEventListener('DOMContentLoaded', () => {
    gameEngine.init();
});
