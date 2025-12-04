// Core utilities and shared modules
window.getSafe = function (id) {
    const el = document.getElementById(id);
    if (el) return el;
    const noop = () => { };
    const classList = { add: noop, remove: noop, contains: () => false, toggle: noop };
    return new Proxy({}, {
        get(target, prop) {
            if (prop === 'classList') return classList;
            if (prop === 'style') return {};
            if (prop === 'dataset') return {};
            if (prop === 'children') return [];
            if (['querySelector', 'querySelectorAll', 'appendChild', 'removeChild', 'addEventListener', 'removeEventListener', 'setAttribute', 'getAttribute', 'focus', 'play', 'pause'].includes(prop)) return noop;
            return undefined;
        }
    });
};

// --- SoundEngine (WebAudio) ---
window.SoundEngine = {
    ctx: null,
    enabled: false,
    master: null,
    init() {
        if (this.enabled) return;
        try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new Ctx();
            this.master = this.ctx.createGain();
            this.master.gain.value = 0.7;
            this.master.connect(this.ctx.destination);
            this.enabled = true;
        } catch (e) {
            this.enabled = false;
        }
    },
    _tone(freq, duration = 0.12, type = 'sine', amp = 0.4, nowOffset = 0) {
        if (!this.enabled) return;
        const now = this.ctx.currentTime + nowOffset;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = type;
        o.frequency.setValueAtTime(freq, now);
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(amp, now + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        o.connect(g);
        g.connect(this.master);
        o.start(now);
        o.stop(now + duration + 0.02);
    },
    _noise(duration = 0.18, amp = 0.25) {
        if (!this.enabled) return;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        const src = this.ctx.createBufferSource();
        src.buffer = buffer;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(amp, this.ctx.currentTime);
        src.connect(g);
        g.connect(this.master);
        src.start();
    },
    play(type) {
        if (!this.enabled || !this.ctx) return;
        switch (type) {
            case 'flip':
                this._tone(880, 0.06, 'sine', 0.18);
                break;
            case 'match':
                this._tone(660, 0.12, 'sine', 0.18);
                this._tone(880, 0.12, 'sine', 0.12, 0.01);
                break;
            case 'win':
                this._tone(880, 0.12, 'sine', 0.18, 0);
                this._tone(1100, 0.12, 'sine', 0.14, 0.09);
                this._tone(1320, 0.18, 'sine', 0.12, 0.18);
                break;
            case 'error':
                this._noise(0.2, 0.25);
                break;
            default:
                this._tone(440, 0.1, 'sine', 0.12);
        }
    }
};

window.playSound = function (name) {
    if (window.SoundEngine && window.SoundEngine.enabled) {
        window.SoundEngine.play(name);
    } else {
        const el = document.getElementById('audio-' + name);
        if (el) {
            try {
                el.currentTime = 0;
                el.play();
            } catch (e) { }
        }
    }
};

window.setSoundEnabled = function (on) {
    try {
        const btn = document.getElementById('enable-sound');
        const cfgBtn = document.getElementById('cfg-enable-sound-btn');
        try {
            Settings.data.enableSound = !!on;
            Settings.save();
        } catch (e) { }
        if (!!on) {
            try {
                window.SoundEngine.init();
                if (window.SoundEngine.master) window.SoundEngine.master.gain.value = 0.7;
            } catch (e) { }
            if (btn) {
                btn.textContent = '🔊';
                btn.setAttribute('aria-pressed', 'true');
            }
            if (cfgBtn) cfgBtn.setAttribute('aria-pressed', 'true');
        } else {
            try {
                if (window.SoundEngine && window.SoundEngine.master) window.SoundEngine.master.gain.value = 0;
            } catch (e) { }
            if (btn) {
                btn.textContent = '🔇';
                btn.setAttribute('aria-pressed', 'false');
            }
            if (cfgBtn) cfgBtn.setAttribute('aria-pressed', 'false');
        }
    } catch (e) { }
};

// --- Confetti ---
window.Confetti = (() => {
    const canvas = document.getElementById('confetti-canvas');
    const ctx = (canvas && canvas.getContext) ? canvas.getContext('2d') : null;
    let particles = [];
    let running = false;

    function resize() {
        if (!canvas) return;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(window.innerWidth * dpr);
        canvas.height = Math.floor(window.innerHeight * dpr);
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function rand(min, max) {
        return Math.random() * (max - min) + min;
    }

    function makeParticle(x, y) {
        const colors = ['#ff6b6b', '#ffd93d', '#6bf7b3', '#6bb0ff', '#d36bff', '#ff9f6b'];
        return {
            x: x + rand(-10, 10),
            y: y + rand(-10, 10),
            vx: rand(-200, 200) / 60,
            vy: rand(-300, -80) / 60,
            size: rand(6, 14),
            rot: rand(0, 360),
            vr: rand(-8, 8),
            color: colors[Math.floor(Math.random() * colors.length)],
            life: rand(60, 120)
        };
    }

    function update() {
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.12;
            p.rot += p.vr;
            p.life--;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot * Math.PI / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
            ctx.restore();
            if (p.life <= 0 || p.y > window.innerHeight + 40) particles.splice(i, 1);
        }
    }
    let rafId = null;

    function loop() {
        update();
        if (particles.length > 0) rafId = requestAnimationFrame(loop);
        else {
            running = false;
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
        }
    }
    window.addEventListener('resize', resize);

    function fire(x = window.innerWidth / 2, y = window.innerHeight / 3, count = 48) {
        if (!ctx) return;
        resize();
        for (let i = 0; i < count; i++) particles.push(makeParticle(x, y));
        if (!running) {
            running = true;
            loop();
        }
        setTimeout(() => {
            particles = [];
        }, 2200);
    }
    return {
        fire
    };
})();

// --- Settings ---
window.Settings = {
    key: 'mg_settings_v1',
    data: {
        enableSound: true,
        confetti: true,
        enabledPools: {
            animals: true,
            food: true,
            sports: true,
            nature: true,
            tech: false
        },
        wsLevel: 10,
        wsShowDefs: true,
        wsShowWords: false,
        memoryLevel: '8',
        memoryCardSize: 'standard',
        memoryTheme: 'mix',
        g2048Size: 4,
        hangmanMax: 6
    },
    load() {
        try {
            const s = localStorage.getItem(this.key);
            if (s) this.data = Object.assign(this.data, JSON.parse(s));
        } catch (e) { }
    },
    save() {
        try {
            localStorage.setItem(this.key, JSON.stringify(this.data));
        } catch (e) { }
    },
    applyToGames(gameId) {
        try {
            const enableSoundBtn = document.getElementById('enable-sound');
            if (this.data.enableSound && enableSoundBtn) {
                try {
                    setSoundEnabled(true);
                } catch (e) { }
            }
            const memLevel = document.getElementById('level-select');
            if (memLevel) memLevel.value = this.data.memoryLevel || memLevel.value;
            const memTheme = document.getElementById('theme-select');
            if (memTheme) memTheme.value = this.data.memoryTheme || memTheme.value;
            try {
                if (memLevel) {
                    const opt = Array.from(memLevel.options).find(o => String(o.value) === String(memLevel.value));
                    if (opt) opt.selected = true;
                }
            } catch (e) { }
            try {
                if (memTheme) {
                    const optt = Array.from(memTheme.options).find(o => String(o.value) === String(memTheme.value));
                    if (optt) optt.selected = true;
                }
            } catch (e) { }
            const cs = document.getElementById('card-size-select');
            if (cs) cs.value = this.data.memoryCardSize || cs.value;
            const wsLevel = document.getElementById('ws-level-select');
            if (wsLevel) wsLevel.value = String(this.data.wsLevel || 10);
            if (window.Game2048) {
                try {
                    window.Game2048.size = parseInt(this.data.g2048Size || 4, 10);
                } catch (e) { }
            }
            if (window.HangmanGame) {
                try {
                    window.HangmanGame.maxMistakes = parseInt(this.data.hangmanMax || 6, 10);
                } catch (e) { }
            }
        } catch (e) { }
    },
    openModal() {
        this.load();
        try {
            try {
                const cfgBtn = document.getElementById('cfg-enable-sound-btn');
                if (cfgBtn) cfgBtn.setAttribute('aria-pressed', !!this.data.enableSound ? 'true' : 'false');
            } catch (e) { }
            document.getElementById('cfg-confetti').checked = !!this.data.confetti;
            const poolCbs = Array.from(document.querySelectorAll('.cfg-pool-cb'));
            poolCbs.forEach(cb => {
                const p = cb.dataset.pool;
                try {
                    cb.checked = !!(this.data.enabledPools && this.data.enabledPools[p]);
                } catch (e) {
                    cb.checked = true;
                }
            });
            document.getElementById('cfg-ws-level').value = String(this.data.wsLevel || 6);
            document.getElementById('cfg-show-defs').checked = !!this.data.wsShowDefs;
            document.getElementById('cfg-memory-level').value = this.data.memoryLevel || '8';
            document.getElementById('cfg-memory-theme').value = this.data.memoryTheme || 'animals';
            document.getElementById('cfg-2048-size').value = String(this.data.g2048Size || 4);
            document.getElementById('cfg-hangman-max').value = String(this.data.hangmanMax || 6);
            const modal = document.getElementById('settings-modal');
            try {
                if (window.innerWidth <= 760) {
                    modal.classList.add('sheet-mode');
                    modal.classList.add('sheet-open');
                    document.body.classList.add('compact-controls');
                } else {
                    modal.classList.remove('sheet-mode');
                    document.body.classList.remove('compact-controls');
                }
            } catch (e) { }
            modal.style.display = 'flex';
            modal.setAttribute('aria-hidden', 'false');
            modal.setAttribute('aria-modal', 'true');
            try {
                this._switchTab && this._switchTab('tab-general');
            } catch (e) { }
            try {
                const focusable = modal.querySelector('input,select,button,textarea,[tabindex]:not([tabindex="-1"])');
                if (focusable) focusable.focus();
                else modal.focus();
            } catch (e) { }
            try {
                if (!this._escHandler) this._escHandler = (ev) => {
                    if (ev.key === 'Escape') this.closeModal();
                };
                document.addEventListener('keydown', this._escHandler);
            } catch (e) { }
        } catch (e) { }
    },
    _switchTab(tabId) {
        try {
            const tabs = Array.from(document.querySelectorAll('.cfg-tab'));
            tabs.forEach(t => t.style.display = (t.id === tabId) ? 'block' : 'none');
            const btns = Array.from(document.querySelectorAll('.cfg-tab-btn'));
            btns.forEach(b => {
                try {
                    if (b.dataset && b.dataset.tab === tabId) {
                        b.classList.add('active');
                        b.setAttribute('aria-current', 'true');
                    } else {
                        b.classList.remove('active');
                        b.removeAttribute('aria-current');
                    }
                } catch (e) { }
            });
            try {
                const container = document.getElementById(tabId);
                if (container) {
                    const inp = container.querySelector('input,select,button,textarea');
                    if (inp) inp.focus();
                }
            } catch (e) { }
        } catch (e) { }
    },
    closeModal() {
        try {
            const modal = document.getElementById('settings-modal');

            // Remove focus from any element inside the modal BEFORE hiding it
            if (document.activeElement && modal && modal.contains(document.activeElement)) {
                document.activeElement.blur();
            }

            try {
                if (this._escHandler) {
                    document.removeEventListener('keydown', this._escHandler);
                }
            } catch (e) { }

            if (modal && modal.classList.contains('sheet-mode')) {
                modal.classList.remove('sheet-open');
                setTimeout(() => {
                    try {
                        modal.setAttribute('aria-hidden', 'true');
                        modal.setAttribute('aria-modal', 'false');
                        modal.style.display = 'none';
                        modal.classList.remove('sheet-mode');
                        document.body.classList.remove('compact-controls');
                    } catch (e) { }
                }, 340);
            } else {
                if (modal) {
                    modal.setAttribute('aria-hidden', 'true');
                    modal.setAttribute('aria-modal', 'false');
                    modal.style.display = 'none';
                }
            }
        } catch (e) {
            try {
                const m = document.getElementById('settings-modal');
                if (m) {
                    if (document.activeElement && m.contains(document.activeElement)) {
                        document.activeElement.blur();
                    }
                    m.setAttribute('aria-hidden', 'true');
                    m.setAttribute('aria-modal', 'false');
                    m.style.display = 'none';
                }
            } catch (e) { }
        }
    },
    saveFromUI() {
        try {
            try {
                const cfgBtn = document.getElementById('cfg-enable-sound-btn');
                this.data.enableSound = !!(cfgBtn && cfgBtn.getAttribute('aria-pressed') === 'true');
            } catch (e) {
                this.data.enableSound = !!this.data.enableSound;
            }
            this.data.confetti = !!document.getElementById('cfg-confetti').checked;
            try {
                this.data.enabledPools = this.data.enabledPools || {};
                const poolCbs = Array.from(document.querySelectorAll('.cfg-pool-cb'));
                poolCbs.forEach(cb => {
                    const p = cb.dataset.pool;
                    this.data.enabledPools[p] = !!cb.checked;
                });
            } catch (e) { }
            this.data.wsLevel = parseInt(document.getElementById('cfg-ws-level').value, 10) || 6;
            this.data.wsShowDefs = !!document.getElementById('cfg-show-defs').checked;
            this.data.memoryLevel = document.getElementById('cfg-memory-level').value || '8';
            try {
                this.data.memoryCardSize = document.getElementById('cfg-memory-card-size') ? document.getElementById('cfg-memory-card-size').value : (this.data.memoryCardSize || 'standard');
            } catch (e) { }
            this.data.memoryTheme = document.getElementById('cfg-memory-theme').value || 'animals';
            this.data.g2048Size = parseInt(document.getElementById('cfg-2048-size').value, 10) || 4;
            this.data.hangmanMax = parseInt(document.getElementById('cfg-hangman-max').value, 10) || 6;
            this.save();
            this.applyToGames();
        } catch (e) { }
    },
    init() {
        this.load();
        const btn = document.getElementById('open-settings');
        if (btn) btn.addEventListener('click', () => {
            this.openModal();
            try {
                const mapping = {
                    'memory-game-screen': 'tab-memory',
                    'wordsearch-screen': 'tab-ws',
                    'game2048-screen': 'tab-2048',
                    'sudoku-screen': 'tab-2048',
                    'hangman-screen': 'tab-hangman'
                };
                const active = Array.from(document.querySelectorAll('.game-screen')).find(s => !s.classList.contains('hidden'));
                if (active && mapping[active.id]) {
                    setTimeout(() => {
                        try {
                            this._switchTab(mapping[active.id]);
                        } catch (e) { }
                    }, 120);
                }
            } catch (e) { }
        });
        const closeBtn = document.getElementById('cfg-close');
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());
        const saveBtn = document.getElementById('cfg-save');
        if (saveBtn) saveBtn.addEventListener('click', () => {
            this.saveFromUI();
            this.closeModal();
        });
        const modal = document.getElementById('settings-modal');
        if (modal) modal.addEventListener('click', (ev) => {
            if (ev.target === modal) this.closeModal();
        });
        try {
            const tabBtns = Array.from(document.querySelectorAll('.cfg-tab-btn'));
            tabBtns.forEach(b => {
                b.addEventListener('click', (ev) => {
                    const t = b.dataset.tab;
                    try {
                        this._switchTab(t);
                    } catch (e) { }
                });
            });
        } catch (e) { }
        try {
            const esb = document.getElementById('cfg-enable-sound-btn');
            if (esb) esb.addEventListener('click', (ev) => {
                try {
                    const pressed = esb.getAttribute('aria-pressed') === 'true';
                    esb.setAttribute('aria-pressed', pressed ? 'false' : 'true');
                    setSoundEnabled(!pressed);
                } catch (e) { }
            });
        } catch (e) { }
        if (!this._escHandler) this._escHandler = (ev) => {
            if (ev.key === 'Escape') this.closeModal();
        };
        window.Settings = this;
    }
};
