document.addEventListener('DOMContentLoaded', () => {
    try{ console.info('[script.js] loaded (v20251130)'); }catch(e){}
    // --- SoundEngine (WebAudio) - refined ---
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
        // play a short tone with given options
        _tone(freq, duration=0.12, type='sine', amp=0.4, nowOffset=0) {
            if (!this.enabled) return;
            const now = this.ctx.currentTime + nowOffset;
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = type;
            o.frequency.setValueAtTime(freq, now);
            g.gain.setValueAtTime(0.0001, now);
            g.gain.linearRampToValueAtTime(amp, now + 0.005);
            g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
            o.connect(g); g.connect(this.master);
            o.start(now); o.stop(now + duration + 0.02);
        },
        // play a short noise burst (for errors)
        _noise(duration=0.18, amp=0.25) {
            if (!this.enabled) return;
            const bufferSize = this.ctx.sampleRate * duration;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = (Math.random()*2-1) * (1 - i/bufferSize);
            const src = this.ctx.createBufferSource();
            src.buffer = buffer;
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(amp, this.ctx.currentTime);
            src.connect(g); g.connect(this.master);
            src.start();
        },
        play(type) {
            if (!this.enabled || !this.ctx) return;
            switch(type){
                case 'flip':
                    this._tone(880, 0.06, 'sine', 0.18);
                    break;
                case 'match':
                    // small chord
                    this._tone(660, 0.12, 'sine', 0.18);
                    this._tone(880, 0.12, 'sine', 0.12, 0.01);
                    break;
                case 'win':
                    // arpeggio
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

    // --- Safe Element Accessor ---
    // preserve original getElementById so we can safely call it after we override
    window.__orig_getElementById = window.__orig_getElementById || document.getElementById.bind(document);
    // helper: return element or a safe no-op proxy to avoid runtime null errors
    function getSafe(id){
        const el = window.__orig_getElementById(id);
        if (el) return el;
        const noop = ()=>{};
        const classList = { add: noop, remove: noop, contains: ()=>false, toggle: noop };
        const proxy = new Proxy({}, {
            get(target, prop){
                if (prop === 'classList') return classList;
                if (prop === 'style') return {};
                if (prop === 'dataset') return {};
                if (prop === 'children') return [];
                if (prop === 'querySelector' || prop === 'querySelectorAll' || prop === 'appendChild' || prop === 'removeChild' || prop === 'addEventListener' || prop === 'removeEventListener' || prop === 'setAttribute' || prop === 'getAttribute' || prop === 'focus' || prop === 'play' || prop === 'pause') return noop;
                return undefined;
            }
        });
        return proxy;
    }
    // Shim: make document.getElementById return a safe proxy when element is absent
    (function(){
        if (document.getElementById !== getSafe) { // Avoid re-wrapping
            document.getElementById = function(id){ return window.__orig_getElementById(id) || getSafe(id); };
        }
    })();

    // Button to enable sound (required on many mobile browsers)
    const enableSoundBtn = getSafe('enable-sound');
    if (enableSoundBtn) {
        enableSoundBtn.addEventListener('click', ()=>{
            try {
                const currently = enableSoundBtn.getAttribute('aria-pressed') === 'true';
                setSoundEnabled(!currently);
            } catch(e) {}
        });
    }

    // helper to set sound enabled/disabled across UI
    function setSoundEnabled(on){
        try{
            const btn = document.getElementById('enable-sound');
            const cfgBtn = document.getElementById('cfg-enable-sound-btn');
            // persist
            try{ Settings.data.enableSound = !!on; Settings.save(); }catch(e){}
            if(!!on){
                try{ window.SoundEngine.init(); if(window.SoundEngine.master) window.SoundEngine.master.gain.value = 0.7; }catch(e){}
                if(btn){ btn.textContent = '🔊'; btn.setAttribute('aria-pressed','true'); }
                if(cfgBtn) cfgBtn.setAttribute('aria-pressed','true');
            } else {
                try{ if(window.SoundEngine && window.SoundEngine.master) window.SoundEngine.master.gain.value = 0; }catch(e){}
                if(btn){ btn.textContent = '🔇'; btn.setAttribute('aria-pressed','false'); }
                if(cfgBtn) cfgBtn.setAttribute('aria-pressed','false');
            }
        }catch(e){}
    }

    // helper: prefer SoundEngine, fallback to audio elements
    function playSound(name){
        if (window.SoundEngine && window.SoundEngine.enabled) {
            window.SoundEngine.play(name);
        } else {
            const el = document.getElementById('audio-' + name);
            if (el) { try { el.currentTime = 0; el.play(); } catch(e) {} }
        }
    }

    // --- Confetti / particles (micro animation on win) ---
    // helper: return element or a safe no-op proxy to avoid runtime null errors
    // Use the original native getElementById when available to avoid calling
    // the shimmed `document.getElementById` which would recurse back here.
    function getSafe(id){
        const el = (window.__orig_getElementById ? window.__orig_getElementById(id) : document.getElementById(id));
        if (el) return el;
        const noop = ()=>{};
        const classList = { add: noop, remove: noop, contains: ()=>false, toggle: noop };
        const proxy = new Proxy({}, {
            get(target, prop){
                if (prop === 'classList') return classList;
                if (prop === 'style') return {};
                if (prop === 'dataset') return {};
                if (prop === 'children') return [];
                if (prop === 'querySelector' || prop === 'querySelectorAll' || prop === 'appendChild' || prop === 'removeChild' || prop === 'addEventListener' || prop === 'removeEventListener' || prop === 'setAttribute' || prop === 'getAttribute' || prop === 'focus' || prop === 'play' || prop === 'pause') return noop;
                return undefined;
            }
        });
        return proxy;
    }
    // Shim: make document.getElementById return a safe proxy when element is absent
    // Use the originally saved native `getElementById` when available to avoid
    // wrapping an already-wrapped function which would cause recursion.
    (function(){ const _orig_getElementById = window.__orig_getElementById || document.getElementById.bind(document); document.getElementById = function(id){ const el = _orig_getElementById(id); return el || getSafe(id); }; })();
    const Confetti = (() => {
        const canvas = document.getElementById('confetti-canvas');
        const ctx = (canvas && canvas.getContext) ? canvas.getContext('2d') : null;
        let particles = [];
        let running = false;
        function resize(){
            if (!canvas) return;
            const dpr = window.devicePixelRatio || 1;
            canvas.width = Math.floor(window.innerWidth * dpr);
            canvas.height = Math.floor(window.innerHeight * dpr);
            canvas.style.width = window.innerWidth + 'px';
            canvas.style.height = window.innerHeight + 'px';
            if (ctx) ctx.setTransform(dpr,0,0,dpr,0,0);
        }
        function rand(min,max){ return Math.random()*(max-min)+min; }
        function makeParticle(x,y){
            const colors = ['#ff6b6b','#ffd93d','#6bf7b3','#6bb0ff','#d36bff','#ff9f6b'];
            return {
                x: x + rand(-10,10),
                y: y + rand(-10,10),
                vx: rand(-200,200)/60,
                vy: rand(-300,-80)/60,
                size: rand(6,14),
                rot: rand(0,360),
                vr: rand(-8,8),
                color: colors[Math.floor(Math.random()*colors.length)],
                life: rand(60,120)
            };
        }
        function update(){
            if (!ctx) return;
            ctx.clearRect(0,0,canvas.width,canvas.height);
            for (let i = particles.length-1; i>=0; i--){
                const p = particles[i];
                p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.rot += p.vr; p.life--;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot * Math.PI/180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size*0.6);
                ctx.restore();
                if (p.life<=0 || p.y > window.innerHeight + 40) particles.splice(i,1);
            }
        }
        let rafId = null;
        function loop(){
            update();
            if (particles.length>0) rafId = requestAnimationFrame(loop);
            else { running=false; if (rafId) { cancelAnimationFrame(rafId); rafId=null; } }
        }
        window.addEventListener('resize', resize);
        function fire(x=window.innerWidth/2, y=window.innerHeight/3, count=48){
            if (!ctx) return;
            resize();
            for (let i=0;i<count;i++) particles.push(makeParticle(x,y));
            if (!running){ running=true; loop(); }
            setTimeout(()=>{ particles = []; }, 2200);
        }
        return { fire };
    })();
    const hubScreen = getSafe('hub-screen');
    const gameScreens = document.querySelectorAll('.game-screen');
    const gameCards = document.querySelectorAll('.game-card:not(.disabled)');
    const backToHubButton = getSafe('back-to-hub');

    const switchScreen = (screenId) => {
        const screenMap = { memory: 'memory-game', wordsearch: 'wordsearch', sudoku: 'sudoku', '2048': 'game2048', hangman: 'hangman', chess: 'chess' };
        hubScreen.classList.add('hidden');
        gameScreens.forEach(screen => screen.classList.add('hidden'));
        if (screenId === 'hub') {
            hubScreen.classList.remove('hidden');
            try{ document.body.classList.remove('compact-controls'); }catch(e){}
        } else {
            const key = screenMap[screenId] || screenId;
            const activeScreen = document.getElementById(`${key}-screen`);
            if (activeScreen) activeScreen.classList.remove('hidden');
            try{ if(key === 'memory-game') { document.body.classList.add('compact-controls'); } else { document.body.classList.remove('compact-controls'); } }catch(e){}
        }
    };

    // Show the main hub screen on initial load
    switchScreen('hub');

    // Settings manager (persisted in localStorage)
    const Settings = {
        key: 'mg_settings_v1',
            data: {
            enableSound: true,
            confetti: true,
            enabledPools: { animals:true, food:true, sports:true, nature:true, tech:false },
            wsLevel: 10,
                wsShowDefs: true,
                wsShowWords: false,
            memoryLevel: '8',
            memoryCardSize: 'standard',
                memoryTheme: 'mix',
            g2048Size: 4,
            hangmanMax: 6
        },
        load(){ try{ const s = localStorage.getItem(this.key); if(s) this.data = Object.assign(this.data, JSON.parse(s)); }catch(e){} },
        save(){ try{ localStorage.setItem(this.key, JSON.stringify(this.data)); }catch(e){} },
        applyToGames(gameId){
            try{
                const enableSoundBtn = document.getElementById('enable-sound');
                if (this.data.enableSound && enableSoundBtn) { try{ setSoundEnabled(true); }catch(e){} }
                const memLevel = document.getElementById('level-select'); if(memLevel) memLevel.value = this.data.memoryLevel || memLevel.value;
                const memTheme = document.getElementById('theme-select'); if(memTheme) memTheme.value = this.data.memoryTheme || memTheme.value;
                try{ if (memLevel) { const opt = Array.from(memLevel.options).find(o=>String(o.value) === String(memLevel.value)); if(opt) opt.selected = true; } }catch(e){}
                try{ if (memTheme) { const optt = Array.from(memTheme.options).find(o=>String(o.value) === String(memTheme.value)); if(optt) optt.selected = true; } }catch(e){}
                const cs = document.getElementById('card-size-select'); if(cs) cs.value = this.data.memoryCardSize || cs.value;
                const wsLevel = document.getElementById('ws-level-select'); if(wsLevel) wsLevel.value = String(this.data.wsLevel||10);
                if (window.Game2048) { try{ window.Game2048.size = parseInt(this.data.g2048Size||4,10); }catch(e){} }
                if (window.HangmanGame) { try{ window.HangmanGame.maxMistakes = parseInt(this.data.hangmanMax||6,10); }catch(e){} }
            }catch(e){}
        },
        openModal(){
            this.load();
            try{
                try{ const cfgBtn = document.getElementById('cfg-enable-sound-btn'); if(cfgBtn) cfgBtn.setAttribute('aria-pressed', !!this.data.enableSound ? 'true' : 'false'); }catch(e){}
                document.getElementById('cfg-confetti').checked = !!this.data.confetti;
                const poolCbs = Array.from(document.querySelectorAll('.cfg-pool-cb'));
                poolCbs.forEach(cb=>{ const p = cb.dataset.pool; try{ cb.checked = !!(this.data.enabledPools && this.data.enabledPools[p]); }catch(e){ cb.checked = true; } });
                document.getElementById('cfg-ws-level').value = String(this.data.wsLevel||6);
                document.getElementById('cfg-show-defs').checked = !!this.data.wsShowDefs;
                document.getElementById('cfg-memory-level').value = this.data.memoryLevel || '8';
                document.getElementById('cfg-memory-theme').value = this.data.memoryTheme || 'animals';
                document.getElementById('cfg-2048-size').value = String(this.data.g2048Size||4);
                document.getElementById('cfg-hangman-max').value = String(this.data.hangmanMax||6);
                const modal = document.getElementById('settings-modal');
                try{ if(window.innerWidth <= 760){ modal.classList.add('sheet-mode'); modal.classList.add('sheet-open'); document.body.classList.add('compact-controls'); } else { modal.classList.remove('sheet-mode'); document.body.classList.remove('compact-controls'); } }catch(e){}
                modal.style.display = 'flex';
                modal.setAttribute('aria-hidden','false');
                modal.setAttribute('aria-modal', 'true');
                try{ this._switchTab && this._switchTab('tab-general'); }catch(e){}
                try{ const focusable = modal.querySelector('input,select,button,textarea,[tabindex]:not([tabindex="-1"])'); if(focusable) focusable.focus(); else modal.focus(); }catch(e){}
                try{ if(!this._escHandler) this._escHandler = (ev)=>{ if(ev.key === 'Escape') this.closeModal(); }; document.addEventListener('keydown', this._escHandler); }catch(e){}
            }catch(e){}
        },
        _switchTab(tabId){
            try{
                const tabs = Array.from(document.querySelectorAll('.cfg-tab'));
                tabs.forEach(t => t.style.display = (t.id === tabId) ? 'block' : 'none');
                const btns = Array.from(document.querySelectorAll('.cfg-tab-btn'));
                btns.forEach(b => { try{ if(b.dataset && b.dataset.tab === tabId){ b.classList.add('active'); b.setAttribute('aria-current','true'); } else { b.classList.remove('active'); b.removeAttribute('aria-current'); } }catch(e){} });
                try{ const container = document.getElementById(tabId); if(container){ const inp = container.querySelector('input,select,button,textarea'); if(inp) inp.focus(); } }catch(e){}
            }catch(e){}
        },
        closeModal(){
            try{
                    let currentContext = null;
                const modal = document.getElementById('settings-modal');
                    // helper to lazily fetch mini-popup elements (works even if HTML was added later)
                    function getMiniEls(){
                        return {
                            mini: document.getElementById('mini-config-popup'),
                            miniTitle: document.getElementById('mini-title'),
                            miniBody: document.getElementById('mini-body'),
                            miniClose: document.getElementById('mini-close'),
                            miniApply: document.getElementById('mini-apply'),
                            miniCancel: document.getElementById('mini-cancel')
                        };
                    }
                try{ if(this._escHandler) { document.removeEventListener('keydown', this._escHandler); } }catch(e){}
                if(modal && modal.classList.contains('sheet-mode')){
                    modal.classList.remove('sheet-open');
                    setTimeout(()=>{ try{ modal.style.display='none'; modal.classList.remove('sheet-mode'); document.body.classList.remove('compact-controls'); modal.setAttribute('aria-hidden','true'); modal.setAttribute('aria-modal','false'); }catch(e){} }, 340);
                } else {
                    if(modal) { modal.style.display = 'none'; modal.setAttribute('aria-hidden','true'); modal.setAttribute('aria-modal','false'); }
                }
            }catch(e){ try{ const m=document.getElementById('settings-modal'); if(m) { m.style.display = 'none'; m.setAttribute('aria-hidden','true'); m.setAttribute('aria-modal','false'); } }catch(e){} }
        },
        saveFromUI(){
            try{
                try{ const cfgBtn = document.getElementById('cfg-enable-sound-btn'); this.data.enableSound = !!(cfgBtn && cfgBtn.getAttribute('aria-pressed') === 'true'); }catch(e){ this.data.enableSound = !!this.data.enableSound; }
                this.data.confetti = !!document.getElementById('cfg-confetti').checked;
                try{ this.data.enabledPools = this.data.enabledPools || {}; const poolCbs = Array.from(document.querySelectorAll('.cfg-pool-cb')); poolCbs.forEach(cb => { const p = cb.dataset.pool; this.data.enabledPools[p] = !!cb.checked; }); }catch(e){}
                this.data.wsLevel = parseInt(document.getElementById('cfg-ws-level').value,10) || 6;
                this.data.wsShowDefs = !!document.getElementById('cfg-show-defs').checked;
                this.data.memoryLevel = document.getElementById('cfg-memory-level').value || '8';
                try{ this.data.memoryCardSize = document.getElementById('cfg-memory-card-size') ? document.getElementById('cfg-memory-card-size').value : (this.data.memoryCardSize || 'standard'); }catch(e){}
                this.data.memoryTheme = document.getElementById('cfg-memory-theme').value || 'animals';
                this.data.g2048Size = parseInt(document.getElementById('cfg-2048-size').value,10) || 4;
                this.data.hangmanMax = parseInt(document.getElementById('cfg-hangman-max').value,10) || 6;
                this.save();
                this.applyToGames();
            }catch(e){}
        },
        init(){
            this.load();
            const btn = document.getElementById('open-settings'); if(btn) btn.addEventListener('click', ()=>{ this.openModal(); try{ const mapping = { 'memory-game-screen':'tab-memory', 'wordsearch-screen':'tab-ws', 'game2048-screen':'tab-2048', 'sudoku-screen':'tab-2048', 'hangman-screen':'tab-hangman' }; const active = Array.from(document.querySelectorAll('.game-screen')).find(s => !s.classList.contains('hidden')); if(active && mapping[active.id]){ setTimeout(()=>{ try{ this._switchTab(mapping[active.id]); }catch(e){} }, 120); } }catch(e){} });
            const closeBtn = document.getElementById('cfg-close'); if(closeBtn) closeBtn.addEventListener('click', ()=> this.closeModal());
            const saveBtn = document.getElementById('cfg-save'); if(saveBtn) saveBtn.addEventListener('click', ()=>{ this.saveFromUI(); this.closeModal(); });
            const modal = document.getElementById('settings-modal'); if(modal) modal.addEventListener('click',(ev)=>{ if(ev.target===modal) this.closeModal(); });
            try{ const tabBtns = Array.from(document.querySelectorAll('.cfg-tab-btn')); tabBtns.forEach(b=>{ b.addEventListener('click', (ev)=>{ const t = b.dataset.tab; try{ this._switchTab(t); }catch(e){} }); }); }catch(e){}
            try{ const esb = document.getElementById('cfg-enable-sound-btn'); if(esb) esb.addEventListener('click', (ev)=>{ try{ const pressed = esb.getAttribute('aria-pressed') === 'true'; esb.setAttribute('aria-pressed', pressed ? 'false' : 'true'); setSoundEnabled(!pressed); }catch(e){} }); }catch(e){}
            if(!this._escHandler) this._escHandler = (ev)=>{ if(ev.key === 'Escape') this.closeModal(); };
            window.Settings = this;
        }
    };
    Settings.init();
    try{ if (window.Settings) window.Settings.applyToGames(); }catch(e){}
    try{ setSoundEnabled(Settings.data.enableSound); }catch(e){}

    // Mobile modal buttons wiring
    try{
        const closeMobile = document.getElementById('cfg-close-mobile');
        if(closeMobile) closeMobile.addEventListener('click', ()=> Settings.closeModal());
        const closeMobile2 = document.getElementById('cfg-close-mobile-2');
        if(closeMobile2) closeMobile2.addEventListener('click', ()=> Settings.closeModal());
        const saveMobile = document.getElementById('cfg-save-mobile');
        if(saveMobile) saveMobile.addEventListener('click', ()=>{ Settings.saveFromUI(); Settings.closeModal(); });
    }catch(e){}

    // Bottom-sheet drag to close (mobile)
    (function(){
        try{
            const modal = document.getElementById('settings-modal');
            const sheet = document.getElementById('settings-sheet');
            const header = document.querySelector('.settings-header-mobile');
            if(!modal || !sheet) return;
            let dragging = false; let startY = 0; let currentY = 0; let sheetHeight = 0;
            function setTranslate(y){ sheet.style.transform = `translateY(${y}px)`; }
            function start(e){ dragging = true; startY = e.touches ? e.touches[0].clientY : e.clientY; sheetHeight = sheet.getBoundingClientRect().height; sheet.style.transition = 'none'; document.body.style.userSelect = 'none'; }
            function move(e){ if(!dragging) return; currentY = (e.touches ? e.touches[0].clientY : e.clientY) - startY; if(currentY < 0) currentY = 0; setTranslate(currentY); }
            function end(){ if(!dragging) return; dragging = false; sheet.style.transition = ''; document.body.style.userSelect = ''; if(currentY > (sheetHeight * 0.33)) { Settings.closeModal(); } else { sheet.style.transform = ''; } currentY = 0; }
            (header || sheet).addEventListener('pointerdown', (ev)=>{ ev.preventDefault(); start(ev); });
            window.addEventListener('pointermove', move);
            window.addEventListener('pointerup', end);
            window.addEventListener('touchstart', (ev)=>{ if((modal.classList.contains('sheet-mode'))) start(ev); }, {passive:false});
            window.addEventListener('touchmove', (ev)=>{ if((modal.classList.contains('sheet-mode'))) move(ev); }, {passive:false});
            window.addEventListener('touchend', (ev)=>{ if((modal.classList.contains('sheet-mode'))) end(ev); });
            const obs = new MutationObserver(()=>{ if(!modal.classList.contains('sheet-open')) sheet.style.transform=''; });
            obs.observe(modal, { attributes:true, attributeFilter:['class'] });
        }catch(e){}
    })();

    // Update preview on window resize (debounced)
    (function(){
        let t = null;
        window.addEventListener('resize', ()=>{
            if (t) clearTimeout(t);
            t = setTimeout(()=>{
                try{ if (window.MemoryGame && typeof window.MemoryGame._updatePreviewOnResize === 'function') window.MemoryGame._updatePreviewOnResize(); }catch(e){}
                try{ if (window.MemoryGame && document.getElementById('memory-game-screen') && !document.getElementById('memory-game-screen').classList.contains('hidden')) { window.MemoryGame.resetGame(); } }catch(e){}
            }, 180);
        });
    })();

    gameCards.forEach(card => {
        card.addEventListener('click', () => {
            const gameId = card.getAttribute('data-game');
            try{ if (window.Settings) window.Settings.applyToGames(gameId); }catch(e){}
            if (gameId === 'memory') { switchScreen('memory'); MemoryGame.start(); }
            else if (gameId === 'wordsearch') { switchScreen('wordsearch'); WordSearch.start(); }
            else if (gameId === '2048') { switchScreen('game2048'); Game2048.start(); }
            else if (gameId === 'sudoku') { switchScreen('sudoku'); SudokuGame.start(); }
            else if (gameId === 'hangman') { switchScreen('hangman'); HangmanGame.start(); }
            else { switchScreen('hub'); }
        });
    });

    try{
        const wsSet = document.getElementById('ws-settings-btn'); if(wsSet) wsSet.addEventListener('click', ()=>{ Settings.openModal(); setTimeout(()=>{ try{ Settings._switchTab('tab-ws'); }catch(e){} },120); });
        const g2048Set = document.getElementById('g2048-settings-btn'); if(g2048Set) g2048Set.addEventListener('click', ()=>{ Settings.openModal(); setTimeout(()=>{ try{ Settings._switchTab('tab-2048'); }catch(e){} },120); });
        const sdSet = document.getElementById('sd-settings-btn'); if(sdSet) sdSet.addEventListener('click', ()=>{ Settings.openModal(); setTimeout(()=>{ try{ Settings._switchTab('tab-memory'); }catch(e){} },120); });
        const hmSet = document.getElementById('hm-settings-btn'); if(hmSet) hmSet.addEventListener('click', ()=>{ Settings.openModal(); setTimeout(()=>{ try{ Settings._switchTab('tab-hangman'); }catch(e){} },120); });
    }catch(e){}

    (function(){
        try{
            const icons = { memory:'🧠', wordsearch:'🔎', '2048':'2️⃣', sudoku:'🔢', hangman:'🪢', chess:'♟️' };
            const cards = Array.from(document.querySelectorAll('.game-card'));
            cards.forEach(c => {
                try{ const g = c.dataset.game; const ic = icons[g] || '🎮'; if(!c.querySelector('.game-icon')){ const el = document.createElement('div'); el.className='game-icon'; el.textContent = ic; el.style.fontSize='2.2em'; el.style.marginBottom='8px'; c.insertBefore(el, c.firstChild); } }catch(e){}
            });
            try{
                const mapBtn = { mem: 'mem-config-btn', ws: 'ws-settings-btn', g2048: 'g2048-settings-btn', sd: 'sd-settings-btn', hm: 'hm-settings-btn' };
                const gameLabels = { memory: 'Memória', wordsearch: 'Caça‑Palavras', '2048': '2048', sudoku: 'Sudoku', hangman: 'Forca' };
                Object.keys(mapBtn).forEach(key => {
                    const id = mapBtn[key];
                    const btn = document.getElementById(id);
                    if(!btn) return;
                    const gameKey = ({mem:'memory', ws:'wordsearch', g2048:'2048', sd:'sudoku', hm:'hangman'})[key];
                    const ic = icons[gameKey] || '🎮';
                    // Ensure it's a button and accessible: icon + visible gear, with hidden text for screen readers
                    try{ btn.type = btn.type || 'button'; }catch(e){}
                    const label = gameLabels[gameKey] || (gameKey || 'Jogo');
                    btn.innerHTML = `<span class="game-icon-inline">${ic}</span> <span class="gear">⚙️</span> <span class="sr-only">Configurações — ${label}</span>`;
                    try{ btn.setAttribute('aria-label', 'Configurações — ' + label); btn.title = 'Configurações — ' + label; }catch(e){}
                });
            }catch(e){}
        }catch(e){}
    })();

    (function(){
        try{
            const memConfigBtn = document.getElementById('mem-config-btn');
            const wsLevelBtn = document.getElementById('ws-level-btn');
            const wsThemeBtn = document.getElementById('ws-theme-btn');
            const mini = document.getElementById('mini-config-popup');
            const miniTitle = document.getElementById('mini-title');
            const miniBody = document.getElementById('mini-body');
            const miniClose = document.getElementById('mini-close');
            const miniApply = document.getElementById('mini-apply');
            const miniCancel = document.getElementById('mini-cancel');
            let currentContext = null;

            function buildMemoryBody(){
                miniBody.innerHTML = '';
                const lvlLabel = document.createElement('div'); lvlLabel.className = 'mini-section';
                const lvlTitle = document.createElement('div'); lvlTitle.textContent = 'Nível'; lvlTitle.className='mini-section-title';
                const lvlSel = document.createElement('select'); lvlSel.id = 'mini-level-select'; lvlSel.style.display='none';
                // Now using number of pairs (cards = pairs * 2)
                const levelOptions = [['4','4 pares'],['6','6 pares'],['8','8 pares'],['10','10 pares'],['14','14 pares'],['16','16 pares'],['18','18 pares']];
                let suggested = null;
                try{ suggested = (Settings && Settings.data && Settings.data.memoryLevel) ? String(Settings.data.memoryLevel) : levelOptions[Math.min(2, levelOptions.length-1)][0]; }catch(e){}
                levelOptions.forEach(([v,t])=>{ const o=document.createElement('option'); o.value=v; o.textContent = t; lvlSel.appendChild(o); });
                // visual pills
                const lvlPills = document.createElement('div'); lvlPills.className = 'mini-level-pills';
                levelOptions.forEach(([v,t])=>{ const b = document.createElement('button'); b.type='button'; b.className='pill'; b.dataset.value = v; b.textContent = t.replace(' pares',''); if (String(v)===String(suggested)) b.classList.add('active'); b.addEventListener('click', ()=>{ try{ lvlSel.value = v; Array.from(lvlPills.children).forEach(x=>x.classList.remove('active')); b.classList.add('active'); }catch(e){} }); lvlPills.appendChild(b); });
                lvlLabel.appendChild(lvlTitle); lvlLabel.appendChild(lvlPills); lvlLabel.appendChild(lvlSel); miniBody.appendChild(lvlLabel);

                const thLabel = document.createElement('div'); thLabel.className = 'mini-section';
                const thTitle = document.createElement('div'); thTitle.textContent = 'Tema'; thTitle.className='mini-section-title';
                const thSel = document.createElement('select'); thSel.id = 'mini-theme-select'; thSel.style.display='none';
                let themes = [];
                try{ if (window.MemoryGame && window.MemoryGame.themes) themes = Object.keys(window.MemoryGame.themes); if (!themes || !themes.length) { const mainTheme = document.getElementById('theme-select'); if (mainTheme) themes = Array.from(mainTheme.options).map(o=>o.value || o.textContent); } }catch(e){}
                if (!themes || !themes.length) themes = ['animals'];
                const themeLabels = { 'animals':'Animais', 'animals-extended':'Animais (extenso)', 'food':'Comida', 'tech':'Tecnologia', 'emoji':'Emoji', 'flags':'Bandeiras', 'transport':'Transportes', 'sports':'Esportes', 'faces':'Rostos', 'music':'Música', 'nature':'Natureza', 'fruits':'Frutas', 'vegetables':'Vegetais', 'objects':'Objetos', 'colors':'Cores', 'numbers':'Números', 'letters':'Letras', 'holiday':'Feriados', 'classic-cards':'Cartas Clássicas', 'mix':'Mix (Aleatório)' };
                // fallback preview emojis in case MemoryGame.themes isn't available yet
                const themePreview = { 'animals':'🦓', 'animals-extended':'🦁', 'food':'🍕', 'tech':'💻', 'emoji':'😀', 'flags':'🇧🇷', 'transport':'🚗', 'sports':'⚽', 'faces':'😃', 'music':'🎵', 'nature':'🌲', 'fruits':'🍎', 'vegetables':'🥕', 'objects':'📦', 'colors':'🔴', 'numbers':'1️⃣', 'letters':'A', 'holiday':'🎄', 'classic-cards':'🂡', 'mix':'🔀' };
                // build hidden select and visible emoji grid
                const themeGrid = document.createElement('div'); themeGrid.className = 'mini-theme-grid';
                themes.forEach(t=>{
                    const o=document.createElement('option'); o.value=t; o.textContent = themeLabels[t]||t; thSel.appendChild(o);
                    // preview emoji: first symbol from theme list
                    let emoji = '?';
                    try{
                        if (window.MemoryGame && window.MemoryGame.themes && Array.isArray(window.MemoryGame.themes[t]) && window.MemoryGame.themes[t].length) {
                            emoji = window.MemoryGame.themes[t][0];
                        } else if (themePreview[t]) {
                            emoji = themePreview[t];
                        }
                    } catch(e){}
                    const btn = document.createElement('button'); btn.type='button'; btn.className='theme-btn'; btn.dataset.value = t; btn.title = themeLabels[t] || t; btn.innerHTML = `<span class="theme-emoji">${emoji}</span><span class="theme-label">${themeLabels[t]||t}</span>`;
                    btn.addEventListener('click', ()=>{ try{ thSel.value = t; Array.from(themeGrid.children).forEach(x=>x.classList.remove('active')); btn.classList.add('active'); }catch(e){} });
                    themeGrid.appendChild(btn);
                });
                thLabel.appendChild(thTitle); thLabel.appendChild(themeGrid); thLabel.appendChild(thSel); miniBody.appendChild(thLabel);
                const mainLevel = document.getElementById('level-select'); if(mainLevel) { try{ const pref = String(mainLevel.value || mainLevel.options[mainLevel.selectedIndex].value); if(pref){ try{ lvlSel.value = pref; Array.from(lvlPills.children).forEach(b=>{ if(String(b.dataset.value)===String(pref)) b.classList.add('active'); else b.classList.remove('active'); }); }catch(e){} } }catch(e){} }
                const mainTheme = document.getElementById('theme-select'); if(mainTheme) { try{ const prefT = String(mainTheme.value || (mainTheme.options[mainTheme.selectedIndex] && mainTheme.options[mainTheme.selectedIndex].value)); if(prefT){ thSel.value = prefT; Array.from(themeGrid.children).forEach(b=>{ if(String(b.dataset.value)===String(prefT)) b.classList.add('active'); else b.classList.remove('active'); }); } }catch(e){} }
                // Card size pills
                const sizeLabel = document.createElement('div'); sizeLabel.className='mini-section'; const sizeTitle = document.createElement('div'); sizeTitle.textContent='Tamanho'; sizeTitle.className='mini-section-title';
                const sizePills = document.createElement('div'); sizePills.className='mini-card-size-pills';
                ['compact','standard','large'].forEach(v=>{ const b=document.createElement('button'); b.type='button'; b.className='pill size-pill'; b.dataset.value=v; b.textContent = v==='compact'?'Compacto':(v==='standard'?'Padrão':'Grande'); b.addEventListener('click', ()=>{ try{ if(window.Settings && window.Settings.data){ window.Settings.data.memoryCardSize = v; window.Settings.save(); } Array.from(sizePills.children).forEach(x=>x.classList.remove('active')); b.classList.add('active'); try{ if(window.MemoryGame && typeof window.MemoryGame.resetGame === 'function') window.MemoryGame.resetGame(); }catch(e){} }catch(e){} }); sizePills.appendChild(b); });
                sizeLabel.appendChild(sizeTitle); sizeLabel.appendChild(sizePills); miniBody.appendChild(sizeLabel);
                try{ const prefSz = (window.Settings && window.Settings.data && window.Settings.data.memoryCardSize) ? String(window.Settings.data.memoryCardSize) : 'standard'; Array.from(sizePills.children).forEach(b=>{ if(String(b.dataset.value)===prefSz) b.classList.add('active'); else b.classList.remove('active'); }); }catch(e){}
            }

            function buildWSBody(){
                miniBody.innerHTML = '';
                const thLabel = document.createElement('label'); thLabel.textContent = 'Tema: ';
                const thSel = document.createElement('select'); thSel.id = 'mini-ws-theme';
                const wsMainTheme = document.getElementById('ws-theme-select');
                if(wsMainTheme){ Array.from(wsMainTheme.options).forEach(o=>{ const opt=document.createElement('option'); opt.value=o.value; opt.textContent=o.text; thSel.appendChild(opt); }); }
                thLabel.appendChild(thSel); miniBody.appendChild(thLabel);
                const lvlLabel = document.createElement('label'); lvlLabel.textContent = 'Nível: ';
                const lvlSel = document.createElement('select'); lvlSel.id = 'mini-ws-level';
                [{v:'6',t:'6 (fácil)'},{v:'8',t:'8'},{v:'10',t:'10'},{v:'16',t:'16'},{v:'20',t:'20'},{v:'30',t:'30 (difícil)'}].forEach(x=>{ const o=document.createElement('option'); o.value=x.v; o.textContent=x.t; lvlSel.appendChild(o); });
                lvlLabel.appendChild(lvlSel); miniBody.appendChild(lvlLabel);
                if(wsMainTheme) thSel.value = wsMainTheme.value;
                const wsMainLevel = document.getElementById('ws-level-select'); if(wsMainLevel) lvlSel.value = wsMainLevel.value;
            }

            let _miniKeydownHandler = null;
            function showMini(game, mode, opener){
                currentContext = { game, mode, opener };
                if(!mini) return;
                if(game === 'memory'){
                    miniTitle.textContent = 'Configurar Memória'; buildMemoryBody();
                    try{ const lvlEl = document.getElementById('mini-level-select'); if(lvlEl){ const opts = Array.from(lvlEl.options).map(o=>o.value); let best = opts[0] || levelOptions[Math.min(2, levelOptions.length-1)][0]; try{ if (Settings && Settings.data && Settings.data.memoryLevel && opts.includes(String(Settings.data.memoryLevel))) best = String(Settings.data.memoryLevel); }catch(e){} lvlEl.value = best; } }catch(e){}
                } else if(game === 'ws'){
                    miniTitle.textContent = 'Configurar Caça‑Palavras'; buildWSBody();
                } else { miniTitle.textContent = 'Configurar'; miniBody.innerHTML = ''; }
                try{
                    mini.classList.remove('hidden'); try{ mini.setAttribute('aria-hidden','false'); mini.setAttribute('aria-modal','true'); mini.tabIndex = -1; }catch(e){}
                    try{ if(opener && opener.focus) mini._lastOpener = opener; }catch(e){}
                    if(opener && opener.getBoundingClientRect){
                        const rect = opener.getBoundingClientRect(); const spacer = 8;
                        let left = rect.left + rect.width/2; let top = rect.bottom + spacer;
                        left = left + window.scrollX; top = top + window.scrollY;
                        const mw = Math.min(window.innerWidth - 16, 380); mini.style.minWidth = mw + 'px';
                        // place near opener but clamp to viewport
                        mini.style.right = 'auto';
                        // temporarily set left and no transform to measure
                        mini.style.transform = 'translateX(-50%)';
                        mini.style.left = Math.max(8, Math.round(left)) + 'px';
                        mini.style.top = Math.round(top) + 'px';
                        mini.classList.add('anchored');
                        const box = mini.getBoundingClientRect();
                        // if left edge goes off-screen, anchor to left padding without translate
                        if (box.left < 8) {
                            mini.style.left = '8px';
                            mini.style.transform = 'none';
                        }
                        // if right edge goes off-screen, align to right padding
                        if (box.right > window.innerWidth - 8) {
                            const newLeft = Math.max(8, window.innerWidth - box.width - 8);
                            mini.style.left = newLeft + 'px';
                            mini.style.transform = 'none';
                        }
                        // if bottom overflows, try place above opener
                        const box2 = mini.getBoundingClientRect();
                        if(box2.bottom > window.innerHeight - 8){
                            mini.style.top = Math.max(8, rect.top + window.scrollY - box2.height - spacer) + 'px';
                        }
                    } else {
                        mini.style.left = '50%';
                        mini.style.top = '120px';
                        mini.style.transform = 'translateX(-50%)';
                        mini.classList.remove('anchored');
                    }
                    try{ const focusable = mini.querySelector('select,button,input,textarea,[tabindex]:not([tabindex="-1"])'); if(focusable){ try{ focusable.focus({preventScroll:true}); }catch(err){ try{ focusable.focus(); }catch(e){} } } else { try{ mini.focus({preventScroll:true}); }catch(err){ try{ mini.focus(); }catch(e){} } } }catch(e){}
                    try{ _miniKeydownHandler = (ev)=>{ if(ev.key === 'Escape') { hideMini(); if(mini._lastOpener && mini._lastOpener.focus) mini._lastOpener.focus(); } }; document.addEventListener('keydown', _miniKeydownHandler); }catch(e){}
                }catch(e){}
            }

            function hideMini(){ try{ if(!mini) return; mini.classList.add('hidden'); mini.setAttribute('aria-hidden','true'); mini.setAttribute('aria-modal','false'); if(_miniKeydownHandler) { document.removeEventListener('keydown', _miniKeydownHandler); _miniKeydownHandler = null; } try{ if(mini._lastOpener && mini._lastOpener.focus) mini._lastOpener.focus(); }catch(e){} }catch(e){} currentContext = null; }

            // Bind mini popup action buttons (close/cancel/apply) dynamically in case HTML was added later
            function bindMiniEvents(){
                const miniCloseEl = document.getElementById('mini-close');
                const miniCancelEl = document.getElementById('mini-cancel');
                const miniApplyEl = document.getElementById('mini-apply');
                try{ if(miniCloseEl){ miniCloseEl.removeEventListener('click', hideMini); miniCloseEl.addEventListener('click', hideMini); } }catch(e){}
                try{ if(miniCancelEl){ miniCancelEl.removeEventListener('click', hideMini); miniCancelEl.addEventListener('click', hideMini); } }catch(e){}
                try{
                    if(miniApplyEl){
                        try{ miniApplyEl.removeEventListener('click', miniApplyEl._handler); }catch(e){}
                        miniApplyEl._handler = function(){
                            try{
                                if(!currentContext) return hideMini();
                                if(currentContext.game === 'memory'){
                                    const lvl = document.getElementById('mini-level-select');
                                    const th = document.getElementById('mini-theme-select');
                                    const mainLevel = document.getElementById('level-select');
                                    if (mainLevel && lvl) {
                                        // ensure option exists for this custom level (e.g., 18)
                                        if (!Array.from(mainLevel.options).some(o => String(o.value) === String(lvl.value))) {
                                            const opt = document.createElement('option'); opt.value = String(lvl.value); opt.textContent = `${lvl.value} pares`; mainLevel.appendChild(opt);
                                        }
                                        mainLevel.value = String(lvl.value);
                                        try{ mainLevel.dispatchEvent(new Event('change',{bubbles:true})); }catch(e){}
                                    }
                                    const mainTheme = document.getElementById('theme-select');
                                    if (mainTheme && th) {
                                        if(!Array.from(mainTheme.options).some(o=>o.value===th.value)){
                                            const opt=document.createElement('option'); opt.value=th.value; opt.textContent=th.value; mainTheme.appendChild(opt);
                                        }
                                        mainTheme.value = th.value;
                                        try{ mainTheme.dispatchEvent(new Event('change',{bubbles:true})); }catch(e){}
                                    }
                                    try{
                                        if(window.Settings && window.Settings.data){
                                            try{
                                                if (lvl && lvl.value) window.Settings.data.memoryLevel = String(lvl.value);
                                                if (th && th.value) window.Settings.data.memoryTheme = String(th.value);
                                                // sync card size from Settings (size pills already updated on click), but also reflect to select
                                                try{ const cs = document.getElementById('card-size-select'); if(cs && window.Settings.data.memoryCardSize) { cs.value = window.Settings.data.memoryCardSize; } }catch(e){}
                                                window.Settings.save();
                                            }catch(e){}
                                        }
                                        if(window.MemoryGame && typeof window.MemoryGame.resetGame === 'function') window.MemoryGame.resetGame();
                                    }catch(e){}
                                } else if(currentContext.game === 'ws'){
                                    const th = document.getElementById('mini-ws-theme');
                                    const lvl = document.getElementById('mini-ws-level');
                                    const mainTheme = document.getElementById('ws-theme-select'); if(mainTheme && th) mainTheme.value = th.value;
                                    const mainLevel = document.getElementById('ws-level-select'); if(mainLevel && lvl) mainLevel.value = lvl.value;
                                    try{ if(window.WordSearch && typeof window.WordSearch.init === 'function') window.WordSearch.init(); }catch(e){}
                                }
                            }catch(e){}
                            try{ hideMini(); }catch(e){ try{ const mm = document.getElementById('mini-config-popup'); if(mm) mm.classList.add('hidden'); }catch(err){} }
                        };
                        miniApplyEl.addEventListener('click', miniApplyEl._handler);
                    }
                }catch(e){}
            }

            // Try to bind now and shortly after (in case DOM is still settling)
            setTimeout(bindMiniEvents, 10);
            setTimeout(bindMiniEvents, 300);

            if (memConfigBtn) {
                try{ memConfigBtn.type = memConfigBtn.type || 'button'; memConfigBtn.setAttribute('aria-label','Configurar Memória'); memConfigBtn.title = memConfigBtn.title || 'Configurar Memória'; }catch(e){}
                memConfigBtn.addEventListener('click', (ev) => showMini('memory', 'both', ev.currentTarget));
            }
            if (wsLevelBtn) {
                try{ wsLevelBtn.type = wsLevelBtn.type || 'button'; wsLevelBtn.setAttribute('aria-label','Ajustar nível (Caça‑Palavras)'); wsLevelBtn.title = wsLevelBtn.title || 'Ajustar nível'; }catch(e){}
                wsLevelBtn.addEventListener('click', (ev) => showMini('ws', 'level', ev.currentTarget));
            }
            if (wsThemeBtn) {
                try{ wsThemeBtn.type = wsThemeBtn.type || 'button'; wsThemeBtn.setAttribute('aria-label','Escolher tema (Caça‑Palavras)'); wsThemeBtn.title = wsThemeBtn.title || 'Escolher tema'; }catch(e){}
                wsThemeBtn.addEventListener('click', (ev) => showMini('ws', 'theme', ev.currentTarget));
            }

            // Bind dedicated WordSearch settings button (opens the same mini-popup)
            try{
                const wsSettingsBtn = document.getElementById('ws-settings-btn');
                if (wsSettingsBtn) {
                    try{ wsSettingsBtn.type = wsSettingsBtn.type || 'button'; wsSettingsBtn.setAttribute('aria-label','Configurações do Caça‑Palavras'); wsSettingsBtn.title = wsSettingsBtn.title || 'Configurações'; }catch(e){}
                    wsSettingsBtn.addEventListener('click', (ev) => { try{ showMini('ws', 'both', ev.currentTarget); }catch(err){} });
                    // keyboard activation with Enter/Space for accessibility
                    wsSettingsBtn.addEventListener('keydown', (e) => { try{ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showMini('ws','both', e.currentTarget); } }catch(err){} });
                }
            }catch(e){}

            const cfgExport = document.getElementById('cfg-export-theme');
            const cfgImport = document.getElementById('cfg-import-theme');
            const cfgImportFile = document.getElementById('cfg-import-theme-file');
            if(cfgExport){ cfgExport.addEventListener('click', ()=>{ try{ const themeKey = (window.MemoryGame && window.MemoryGame.themeSelect) ? window.MemoryGame.themeSelect.value : null; if(!themeKey){ alert('Nenhum tema selecionado na Memória'); return; } const symbols = (window.MemoryGame && window.MemoryGame.themes && window.MemoryGame.themes[themeKey]) ? window.MemoryGame.themes[themeKey] : []; const obj = { name: themeKey, symbols }; const data = JSON.stringify(obj, null, 2); const blob = new Blob([data], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${themeKey}-theme.json`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url), 1500); }catch(e){ alert('Erro ao exportar tema'); } }); }
            if(cfgImport && cfgImportFile){ cfgImport.addEventListener('click', ()=> cfgImportFile.click());
                cfgImportFile.addEventListener('change', (e)=>{
                    const f = e.target.files && e.target.files[0]; if(!f) return; const fr = new FileReader(); fr.onload = ()=>{
                        try{
                            const obj = JSON.parse(fr.result);
                            if(obj && obj.name && Array.isArray(obj.symbols)){
                                window.MemoryGame = window.MemoryGame || {};
                                window.MemoryGame.themes = window.MemoryGame.themes || {};
                                window.MemoryGame.themes[obj.name] = obj.symbols.slice();
                                const mainTheme = document.getElementById('theme-select'); if(mainTheme){ if(!Array.from(mainTheme.options).some(o=>o.value===obj.name)){ const opt = document.createElement('option'); opt.value=obj.name; opt.textContent=obj.name; mainTheme.appendChild(opt); } mainTheme.value = obj.name; }
                                alert('Tema importado: ' + obj.name);
                            } else { alert('Arquivo de tema inválido. Use {name,symbols}'); }
                        }catch(err){ alert('Erro ao importar: ' + err.message); }
                    }; fr.readAsText(f);
                });
            }
        }catch(e){}
    })();

    backToHubButton.addEventListener('click', () => {
        MemoryGame.stop();
        switchScreen('hub');
    });
    document.getElementById('back-to-hub-ws').addEventListener('click', ()=>{ WordSearch.stop(); switchScreen('hub'); });
    document.getElementById('back-to-hub-2048').addEventListener('click', ()=>{ Game2048.stop(); switchScreen('hub'); });
    document.getElementById('back-to-hub-sd').addEventListener('click', ()=>{ SudokuGame.stop(); switchScreen('hub'); });
    
    // --- Jogo da Memória ---
    const MemoryGame = {
        board: document.getElementById('memory-game-board'),
        themeSelect: document.getElementById('theme-select'),
        levelSelect: document.getElementById('level-select'),
        restartButton: document.getElementById('restart-memory-game'),
        movesSpan: document.getElementById('moves'),
        timeSpan: document.getElementById('time'),
        
        themes: {
            animals: ['🦓','🐘','🐅','🦒','🐒','🦜','🐍','🐢','🐶','🐱','🐷','🐮'],
            'animals-extended': ['🦁','🐯','🐨','🐼','🐸','🐵','🦊','🐺','🦝','🦉','🦇','🦅','🐝','🐞','🐛','🦋'],
            food: ['🍕','🍔','🍟','🍣','🍩','🍪','🍙','🍓','🍉','🍇','🍒','🍋'],
            tech: ['💻','📱','🖱️','📷','🕹️','🎧','⌚','💾','🖨️','📺','📡','🔌'],
            emoji: ['😀','😂','😍','😎','😭','😡','🤯','🤩','🥳','🤖','👻','🤡','💩','😺'],
            flags: ['🇧🇷','🇺🇸','🇬🇧','🇫🇷','🇩🇪','🇯🇵','🇨🇦','🇮🇳','🇮🇹','🇪🇸','🇷🇺','🇦🇺'],
            transport: ['🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚲','🛴','✈️'],
            sports: ['⚽','🏀','🏈','⚾','🎾','🏐','🏉','🥊','🏓','🏸','⛳','🏒'],
            faces: ['😃','😄','😁','😆','😅','😂','🤣','😊','🙂','🙃','😉','😇'],
            music: ['🎵','🎶','🎸','🎹','🥁','🎷','🎺','🎻','📯','🎤','📻','🎧'],
            nature: ['🌲','🌳','🌴','🎋','🌵','🌾','🌺','🌸','🌼','🌻','🍀','🌊'],
            fruits: ['🍎','🍌','🍐','🍊','🍓','🍒','🍍','🥝','🥭','🍇','🍉','🍋'],
            vegetables: ['🥕','🌽','🥦','🍆','🥔','🍠','🥒','🫑','🧅','🧄','🍅','🥬'],
            objects: ['📦','📚','🪑','🖼️','🛏️','🛋️','🪞','🔑','🔨','🧰','🧭','🧯'],
            colors: ['🔴','🟠','🟡','🟢','🔵','🟣','🟤','⚪','⚫','🟥','🟩','🟦'],
            numbers: ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟','➕','➖'],
            letters: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N'],
            holiday: ['🎃','🎄','🎆','🎉','🎁','🕯️','🧨','🪔','🧧','❤️','🦃','🥂'],
            'classic-cards': ['🂡','🂱','🂾','🃁','🃑','🃞','🃏','🂽','🂻','🂺','🂹','🂸']
            ,
            // special mix theme: placeholder symbol (actual pool is built dynamically at runtime)
            mix: ['🔀']
        },
        
        cards: [],
        flippedCards: [],
        matchedPairs: 0,
        moves: 0,
        timer: null,
        time: 0,
        lockBoard: false,
        initialized: false,

        audio: {
            flip: document.getElementById('audio-flip'),
            match: document.getElementById('audio-match'),
            win: document.getElementById('audio-win'),
            error: document.getElementById('audio-error')
        },

        start() {
            if (!this.initialized) {
                this.themeSelect.addEventListener('change', this.resetGame.bind(this));
                this.levelSelect.addEventListener('change', this.resetGame.bind(this));
                this.restartButton.addEventListener('click', this.resetGame.bind(this));
                // Also wire the top restart button (mobile) if present
                try{ const topRestart = document.getElementById('restart-memory-game-top'); if(topRestart) topRestart.addEventListener('click', this.resetGame.bind(this)); }catch(e){}
                // cache top theme display element
                try{ this.themeDisplay = document.getElementById('memory-theme-display'); }catch(e){ this.themeDisplay = null; }
                const exportBtn = document.getElementById('export-theme');
                const importBtn = document.getElementById('import-theme');
                const importFile = document.getElementById('import-theme-file');
                if (exportBtn) {
                    exportBtn.addEventListener('click', () => {
                        const key = this.themeSelect.value;
                        const obj = { name: key, symbols: this.themes[key] || [] };
                        const data = JSON.stringify(obj, null, 2);
                        const blob = new Blob([data], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${key}-theme.json`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        setTimeout(() => URL.revokeObjectURL(url), 1500);
                    });
                }
                // Listen for card-size changes (UI control on memory screen)
                const cardSizeSel = document.getElementById('card-size-select');
                if (cardSizeSel) {
                    cardSizeSel.addEventListener('change', (ev) => {
                        try{
                            const val = ev.target.value;
                            if (window.Settings) { window.Settings.data.memoryCardSize = val; window.Settings.save(); }
                        }catch(e){}
                        try{ this.resetGame(); }catch(e){}
                    });
                    // update preview initially
                    try{ const pv = document.getElementById('card-size-preview'); if(pv){ pv.textContent = '—'; } }catch(e){}
                }
                if (importBtn && importFile) {
                    importBtn.addEventListener('click', () => importFile.click());
                    importFile.addEventListener('change', (e) => {
                        const f = e.target.files[0];
                        if (!f) return;
                        const fr = new FileReader();
                        fr.onload = () => {
                            try {
                                const obj = JSON.parse(fr.result);
                                if (obj && obj.name && Array.isArray(obj.symbols)) {
                                    this.themes[obj.name] = obj.symbols;
                                    const opt = document.createElement('option');
                                    opt.value = obj.name;
                                    opt.textContent = obj.name;
                                    this.themeSelect.appendChild(opt);
                                    this.themeSelect.value = obj.name;
                                    this.resetGame();
                                    alert('Tema importado: ' + obj.name);
                                } else {
                                    alert('JSON de tema inválido');
                                }
                            } catch (err) {
                                alert('Erro ao ler JSON: ' + err.message);
                            }
                        };
                        fr.readAsText(f);
                    });
                }

                // Preenche o select de temas da Memória, caso esteja vazio
                try{
                    if (this.themeSelect) {
                        if (!this.themeSelect.options || this.themeSelect.options.length === 0) {
                            const themeLabels = { 'animals':'Animais', 'animals-extended':'Animais (extenso)', 'food':'Comida', 'tech':'Tecnologia', 'emoji':'Emoji', 'flags':'Bandeiras', 'transport':'Transportes', 'sports':'Esportes', 'faces':'Rostos', 'music':'Música', 'nature':'Natureza', 'fruits':'Frutas', 'vegetables':'Vegetais', 'objects':'Objetos', 'colors':'Cores', 'numbers':'Números', 'letters':'Letras', 'holiday':'Feriados', 'classic-cards':'Cartas Clássicas' };
                            Object.keys(this.themes).forEach(key => {
                                const opt = document.createElement('option');
                                opt.value = key;
                                opt.textContent = themeLabels[key] || key;
                                this.themeSelect.appendChild(opt);
                            });
                            try{
                                const pref = (window.Settings && window.Settings.data && window.Settings.data.memoryTheme) ? window.Settings.data.memoryTheme : null;
                                if (pref && Array.from(this.themeSelect.options).some(o=>o.value===pref)) this.themeSelect.value = pref;
                            }catch(e){}
                        }
                    }
                }catch(e){}

                // Ensure level select reflects saved preference and shows selected option text
                try{
                    const memLevel = this.levelSelect;
                    if (memLevel) {
                        const prefLevel = (window.Settings && window.Settings.data && window.Settings.data.memoryLevel) ? String(window.Settings.data.memoryLevel) : null;
                        // If saved preference matches an option, set it and mark the option as selected
                        if (prefLevel && Array.from(memLevel.options).some(o=>String(o.value)===prefLevel)){
                            memLevel.value = prefLevel;
                            try{ Array.from(memLevel.options).forEach(o=>{ o.selected = (String(o.value)===prefLevel); }); }catch(e){}
                        } else {
                            // If nothing selected (some browsers may show blank), ensure a sensible default index
                            if ((typeof memLevel.selectedIndex === 'number' && memLevel.selectedIndex < 0) || !memLevel.value) {
                                // prefer option with value '8' then fallback to first option
                                const opt8 = Array.from(memLevel.options).find(o=>String(o.value)==='8');
                                if (opt8) { memLevel.value = '8'; opt8.selected = true; }
                                else if (memLevel.options.length) { memLevel.selectedIndex = 0; }
                            }
                        }
                    }
                }catch(e){}

                this.initialized = true;
            }
            this.resetGame();
        },

        // Update the top bar theme display (emoji + friendly name)
        _updateTopTheme(){
            try{
                const el = this.themeDisplay || document.getElementById('memory-theme-display');
                if(!el) return;
                const key = (this.themeSelect && this.themeSelect.value) ? String(this.themeSelect.value) : (Settings && Settings.data && Settings.data.memoryTheme) ? String(Settings.data.memoryTheme) : 'animals';
                const pool = (this.themes && this.themes[key]) ? this.themes[key] : (this.themes && this.themes['animals']) ? this.themes['animals'] : ['❓'];
                const emoji = (Array.isArray(pool) && pool.length) ? pool[0] : '❓';
                const labels = { 'animals':'Animais', 'animals-extended':'Animais (extenso)', 'food':'Comida', 'tech':'Tecnologia', 'emoji':'Emoji', 'flags':'Bandeiras', 'transport':'Transportes', 'sports':'Esportes', 'faces':'Rostos', 'music':'Música', 'nature':'Natureza', 'fruits':'Frutas', 'vegetables':'Vegetais', 'objects':'Objetos', 'colors':'Cores', 'numbers':'Números', 'letters':'Letras', 'holiday':'Feriados', 'classic-cards':'Cartas Clássicas', 'mix':'Mix (Aleatório)' };
                const name = labels[key] || key;
                const emEl = el.querySelector('.theme-emoji');
                const nmEl = el.querySelector('.theme-name');
                if(emEl) emEl.textContent = emoji;
                if(nmEl) nmEl.textContent = name;
            }catch(e){}
        },

        // Recompute preview when window resized or when visible
        _updatePreviewOnResize(){
            try{
                const pv = document.getElementById('card-size-preview');
                const boardEl = this.board;
                if (!pv || !boardEl) return;
                const containerRect = boardEl.getBoundingClientRect();
                let availW = (containerRect && containerRect.width && containerRect.width > 40) ? containerRect.width : Math.min(window.innerWidth - 40, 960);
                let desiredCard = 96, minCard = 64, maxCard = 140;
                const pref = (window.Settings && window.Settings.data && window.Settings.data.memoryCardSize) ? String(window.Settings.data.memoryCardSize) : null;
                if (pref === 'compact') { desiredCard = 72; minCard = 48; maxCard = 100; }
                else if (pref === 'large') { desiredCard = 160; minCard = 120; maxCard = Math.max(180, Math.min(320, Math.floor(window.innerWidth / 6))); }
                const pairs = this.getPairs(); const total = pairs * 2;
                const layout = this.chooseLayout(total, availW, { desiredCard, minCard, maxCard });
                pv.textContent = layout.cardW + 'px';
                try{ this._updateTopTheme(); }catch(e){}
            }catch(e){}
        },

        // Return number of pairs based on current level select value.
        getPairs() {
            try{
                const raw = (this.levelSelect && this.levelSelect.value) ? String(this.levelSelect.value) : (Settings && Settings.data && Settings.data.memoryLevel) ? String(Settings.data.memoryLevel) : '8';
                if (/\d+x\d+/i.test(raw)){
                    const parts = raw.split('x').map(n=>parseInt(n,10));
                    const cols = parts[0] || 4; const rows = parts[1] || 4;
                    return Math.floor((cols * rows) / 2);
                }
                const n = parseInt(raw,10);
                if (!isNaN(n) && n>0) return n;
            }catch(e){}
            return 8;
        },
        // Choose best layout given total cards and available width.
        chooseLayout(total, availW, pref){
            // pref: {desiredCard,minCard,maxCard}
            const desiredCard = pref.desiredCard;
            const minCard = pref.minCard;
            const maxCard = pref.maxCard;
            const idealCols = Math.max(1, Math.round(Math.sqrt(total)));
            const maxColsPossible = Math.min(total, Math.max(1, Math.floor(availW / minCard)));
            // compute available height in the board container (approximate)
            let availH = null;
            try{
                const boardRect = (this && this.board && this.board.getBoundingClientRect) ? this.board.getBoundingClientRect() : null;
                if (boardRect) availH = Math.max(120, Math.floor(window.innerHeight - boardRect.top - 80));
                else availH = Math.max(120, Math.floor(window.innerHeight - 200));
            }catch(e){ availH = Math.max(120, Math.floor(window.innerHeight - 200)); }
            // First, try exact divisors to avoid empty slots (more proportional grids)
            let best = null;
            const divisors = [];
            for (let c = 1; c <= Math.min(total, maxColsPossible); c++){
                if (total % c === 0) divisors.push(c);
            }
            const candidates = divisors.length ? divisors : Array.from({length: Math.min(total, maxColsPossible)}, (_,i)=>i+1);
            for (let idx = 0; idx < candidates.length; idx++){
                const c = candidates[idx];
                const gapC = Math.max(6, Math.round(10 - (c/6)));
                const rawCardW = (availW - (c - 1) * gapC) / c;
                if (rawCardW <= 8) continue;
                // clamp to min/max but allow slightly outside for scoring
                const clamped = Math.max(minCard, Math.min(maxCard, rawCardW));
                const empty = (c * Math.ceil(total / c)) - total; // empty slots (should be 0 for divisors)
                // score: prefer larger clamped card width, fewer empties, and cols near ideal
                // We'll use negative because we want lower score better.
                const sizeScore = -clamped; // prefer larger
                const emptyPenalty = empty * 200; // stronger penalty for empty slots when not divisors
                const squarePenalty = Math.abs(c - idealCols) * 6;
                const rangePenalty = (rawCardW < minCard || rawCardW > maxCard) ? 1200 : 0;
                // penalize vertical overflow: estimate rows*cardH + gaps
                const rows = Math.ceil(total / c);
                const estHeight = (rows * clamped) + ((rows - 1) * gapC);
                const overflow = Math.max(0, estHeight - availH);
                const heightPenalty = overflow > 0 ? (overflow * 12) + 900 : 0;
                const score = sizeScore + emptyPenalty + squarePenalty + rangePenalty;
                const finalScore = score + heightPenalty;
                if (!best || score < best.score) {
                    best = { cols: c, rows: Math.ceil(total / c), cardW: Math.floor(clamped), gap: gapC, calcW: Math.floor((clamped * c) + ((c-1)*gapC)), score: finalScore };
                }
            }
            // If divisors were present but none matched (edge cases), fall back to full scan
            if (!best && divisors.length) {
                for (let c = 1; c <= Math.min(total, maxColsPossible); c++){
                    const gapC = Math.max(6, Math.round(10 - (c/6)));
                    const rawCardW = (availW - (c - 1) * gapC) / c;
                    if (rawCardW <= 8) continue;
                    const clamped = Math.max(minCard, Math.min(maxCard, rawCardW));
                    const empty = (c * Math.ceil(total / c)) - total;
                    const sizeScore = -clamped;
                    const emptyPenalty = empty * 40;
                    const squarePenalty = Math.abs(c - idealCols) * 6;
                    const rangePenalty = (rawCardW < minCard || rawCardW > maxCard) ? 1200 : 0;
                    const rows = Math.ceil(total / c);
                    const estHeight = (rows * clamped) + ((rows - 1) * gapC);
                    const overflow = Math.max(0, estHeight - availH);
                    const heightPenalty = overflow > 0 ? (overflow * 12) + 900 : 0;
                    const score = sizeScore + emptyPenalty + squarePenalty + rangePenalty + heightPenalty;
                    if (!best || score < best.score) {
                        best = { cols: c, rows: Math.ceil(total / c), cardW: Math.floor(clamped), gap: gapC, calcW: Math.floor((clamped * c) + ((c-1)*gapC)), score };
                    }
                }
            }
            return best || { cols: 1, rows: total, cardW: Math.max(minCard, Math.min(desiredCard, maxCard)), gap: 6, calcW: Math.max(minCard, Math.min(desiredCard, maxCard)) };
        },
        stop() { clearInterval(this.timer); },

        resetGame() { clearInterval(this.timer); this.time = 0; this.moves = 0; this.matchedPairs = 0; this.timeSpan.textContent = this.time; this.movesSpan.textContent = this.moves; this.lockBoard = false; this.flippedCards = []; this.createBoard(); this.startTimer(); },

        startTimer() { this.timer = setInterval(() => { this.time++; this.timeSpan.textContent = this.time; }, 1000); },

        createBoard() {
            this.board.innerHTML = '';
            const selectedTheme = this.themeSelect.value;
            const pairs = this.getPairs();
            const total = pairs * 2;
            // build pool for 'mix' by concatenating all other theme pools
            let pool = [];
            try{
                if (selectedTheme === 'mix'){
                    // merge all theme arrays (exclude the 'mix' placeholder itself)
                    const themeKeys = Object.keys(this.themes || {});
                    try{ console.info('[MemoryGame] available theme keys:', themeKeys); }catch(e){}
                    themeKeys.forEach(k=>{ if(k === 'mix') return; const arr = this.themes[k]; if(Array.isArray(arr)) pool.push(...arr); });
                    try{ console.info('[MemoryGame] mix pool before dedupe length=', pool.length, 'sample=', pool.slice(0,12)); }catch(e){}
                    // dedupe while preserving order and filter out empty/undefined
                    const seen = new Set(); pool = pool.filter(s=>{ if(s==null) return false; if(seen.has(s)) return false; seen.add(s); return true; });
                    try{ console.info('[MemoryGame] mix pool after dedupe length=', pool.length, 'sample=', pool.slice(0,12)); }catch(e){}
                } else {
                    pool = this.themes[selectedTheme] || this.themes['emoji'] || [];
                }
            }catch(e){ try{ console.error('[MemoryGame] error building mix pool', e); }catch(err){} pool = this.themes['emoji'] || []; }
            // Choose `pairs` distinct symbols from pool at random (so 'mix' is actually mixed)
            let selectedSymbols = [];
            try{
                // simple Fisher-Yates shuffle copy
                const arr = Array.isArray(pool) ? pool.slice() : [];
                for (let i = arr.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
                }
                if (arr.length < pairs) {
                    // fallback: repeat items until we have enough
                    while (arr.length < pairs) arr.push(...arr.slice());
                }
                selectedSymbols = arr.slice(0, pairs);
            }catch(e){
                // fallback to original behavior
                const symbols = [];
                while (symbols.length < pairs) { symbols.push(...pool); if (symbols.length > pairs) break; }
                selectedSymbols = symbols.slice(0, pairs);
            }
            try{ console.info('[MemoryGame] selectedSymbols sample=', selectedSymbols); }catch(e){}
            const gameSymbols = [];
            selectedSymbols.forEach(s => { gameSymbols.push(s); gameSymbols.push(s); });
            gameSymbols.sort(() => 0.5 - Math.random());

            // Determine columns/rows based on available width so cards fit responsively
            const containerRect = this.board.getBoundingClientRect();
            let availW = (containerRect && containerRect.width && containerRect.width > 40) ? containerRect.width : Math.min(window.innerWidth - 40, 960);
            // Determine card size preferences from Settings (compact/standard/large)
            let desiredCard = 96; // ideal card width (px)
            let minCard = 64; // minimum acceptable card width
            let maxCard = 140; // maximum acceptable card width
            try{
                const pref = (window.Settings && window.Settings.data && window.Settings.data.memoryCardSize) ? String(window.Settings.data.memoryCardSize) : null;
                if (pref === 'compact') { desiredCard = 72; minCard = 48; maxCard = 100; }
                else if (pref === 'large') {
                    // make 'large' scale more aggressively on very wide screens
                    desiredCard = 160; minCard = 120; maxCard = Math.max(180, Math.min(320, Math.floor(window.innerWidth / 6)));
                }
                else { desiredCard = 96; minCard = 64; maxCard = 140; }
            }catch(e){}

            // Try candidates for number of columns and pick the one that yields
            // a card width nearest to `desiredCard`, while keeping it within [minCard,maxCard].
            // Also prefer more square layouts (cols close to sqrt(total)).
            const pref = { desiredCard, minCard, maxCard };
            const layout = this.chooseLayout(total, availW, pref);
            const cols = layout.cols;
            const rows = layout.rows;
            const gap = layout.gap;
            const cardWidth = layout.cardW;
            const calcWidth = Math.min(layout.calcW, Math.max(960, Math.floor(window.innerWidth * 0.9)));

            this.board.style.display = 'grid';
            this.board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
            this.board.style.gap = gap + 'px';
            this.board.style.maxWidth = calcWidth + 'px';
            // Expose computed card size to CSS so font and other visuals can scale
            this.board.style.setProperty('--card-size', cardWidth + 'px');

            // Update preview if present
            try{ const pv = document.getElementById('card-size-preview'); if(pv) pv.textContent = cardWidth + 'px'; }catch(e){}

            // update top theme display (emoji + name)
            try{ this._updateTopTheme(); }catch(e){}

            gameSymbols.forEach(symbol => {
                const cardElement = document.createElement('div');
                cardElement.classList.add('memory-card');
                cardElement.dataset.symbol = symbol;
                cardElement.innerHTML = `
                    <div class="memory-card-inner">
                        <div class="memory-card-front"></div>
                        <div class="memory-card-back">${symbol}</div>
                    </div>
                `;
                this.board.appendChild(cardElement);
                cardElement.addEventListener('click', () => this.flipCard(cardElement));
            });
            try{ console.info(`[MemoryGame] theme=${selectedTheme}, pairs=${pairs}, totalCards=${total}`); }catch(e){}
        },

        flipCard(card) {
            if (this.lockBoard || card.classList.contains('is-flipped') || this.flippedCards.length === 2) return;
            card.classList.add('is-flipped'); try { playSound('flip'); } catch(e){}
            this.flippedCards.push(card);
            if (this.flippedCards.length === 2) { this.updateMoves(); this.checkForMatch(); }
        },

        updateMoves() { this.moves++; this.movesSpan.textContent = this.moves; },

        checkForMatch() { this.lockBoard = true; const [card1, card2] = this.flippedCards; if (card1.dataset.symbol === card2.dataset.symbol) { this.handleMatch(); } else { this.handleMismatch(); } },

        handleMatch() { setTimeout(() => { try { playSound('match'); } catch(e){} this.flippedCards.forEach(card => card.classList.add('matched')); this.matchedPairs++; this.flippedCards = []; this.lockBoard = false; const pairs = this.getPairs(); if (this.matchedPairs === pairs) { try { if (!window.Settings || window.Settings.data.confetti) { Confetti.fire(); } } catch(e){} this.winGame(); } }, 500); },

        handleMismatch() { setTimeout(() => { try { playSound('error'); } catch(e){} this.flippedCards.forEach(card => card.classList.remove('is-flipped')); this.flippedCards = []; this.lockBoard = false; }, 1000); },

        winGame() { clearInterval(this.timer); try { playSound('win'); } catch(e){} setTimeout(() => { alert(`Parabéns! Você venceu em ${this.time} segundos e ${this.moves} movimentos!`); }, 500); }
    };

    // ====== WordSearch ======
    const WordSearch = {
        boardEl: document.getElementById('ws-board'),
        wordsEl: document.getElementById('ws-words'),
        themeSelect: document.getElementById('ws-theme-select'),
        newBtn: document.getElementById('new-ws'),
        size: 10,
        grid: [],
        words: [],
        offlineDict: {},
        definitionCache: {},
        fetchQueue: [],
        activeFetches: 0,
        maxConcurrent: 3,
        selecting: false,
        selected: [],
        start() {
            this.newBtn.addEventListener('click', ()=>this.init());
            this.themeSelect.addEventListener('change', ()=>this.init());
            // cache overlay svg element for polyline drawing
            try{ this.overlayEl = document.getElementById('ws-overlay'); }catch(e){ this.overlayEl = null; }
            const levelSel = document.getElementById('ws-level-select');
            try{
                if (levelSel) {
                    // populate level options if empty
                    if (!levelSel.options || levelSel.options.length === 0) {
                        const opts = [6,8,10,12,16,20,30];
                        opts.forEach(v=>{ const o = document.createElement('option'); o.value = String(v); o.text = String(v); levelSel.appendChild(o); });
                        // apply saved preference
                        try{ const pref = (window.Settings && window.Settings.data && window.Settings.data.wsLevel) ? String(window.Settings.data.wsLevel) : null; if (pref && Array.from(levelSel.options).some(o=>o.value===pref)) levelSel.value = pref; }catch(e){}
                    }
                    levelSel.addEventListener('change', ()=>this.init());
                }
            }catch(e){}
            // Create a toggle button to show/hide the word list (persisted in Settings)
            try{
                const existingToggle = document.getElementById('ws-toggle-words');
                const createToggle = () => {
                    const btn = document.createElement('button');
                    btn.id = 'ws-toggle-words';
                    btn.type = 'button';
                    btn.className = 'game-button ws-toggle-words';
                    const show = !!(window.Settings && window.Settings.data && window.Settings.data.wsShowWords);
                    btn.textContent = show ? 'Ocultar palavras' : 'Mostrar palavras';
                    btn.addEventListener('click', ()=>{
                        try{
                            const words = document.getElementById('ws-words');
                            if (!words) return;
                            const mobile = (window.innerWidth || document.documentElement.clientWidth) <= 900;
                            if (mobile) {
                                // open/close sheet on mobile
                                const isOpen = words.classList.toggle('sheet');
                                if (isOpen) {
                                    words.classList.add('open');
                                    document.body.classList.add('ws-sheet-open');
                                    // ensure header exists
                                    if (!words.querySelector('.sheet-header')){
                                        const header = document.createElement('div'); header.className = 'sheet-header';
                                        const title = document.createElement('div'); title.className='sheet-title'; title.textContent='Palavras';
                                        const closeBtn = document.createElement('button'); closeBtn.className='game-button'; closeBtn.textContent='Fechar'; closeBtn.addEventListener('click', ()=>{ words.classList.remove('sheet'); words.classList.remove('open'); document.body.classList.remove('ws-sheet-open'); try{ const pref = (window.Settings && window.Settings.data && typeof window.Settings.data.wsShowWords !== 'undefined') ? !!window.Settings.data.wsShowWords : (JSON.parse(localStorage.getItem('mg_ws_show_words')||'false')); if (!pref) { Array.from(words.querySelectorAll('.ws-word')).forEach(it=>{ if(!it.classList.contains('found')) it.classList.add('obscured'); }); } }catch(e){} });
                                        header.appendChild(title); header.appendChild(closeBtn);
                                        const handle = document.createElement('div'); handle.className='sheet-handle';
                                        words.insertBefore(handle, words.firstChild);
                                        words.insertBefore(header, handle.nextSibling);
                                    }
                                    // reveal words visually in sheet mode but keep found items visible
                                    Array.from(words.querySelectorAll('.ws-word')).forEach(it=>{ it.classList.remove('obscured'); });
                                } else {
                                    words.classList.remove('open');
                                    document.body.classList.remove('ws-sheet-open');
                                    const hdr = words.querySelector('.sheet-header'); if(hdr) hdr.remove(); const h = words.querySelector('.sheet-handle'); if(h) h.remove();
                                    try{ const pref = (window.Settings && window.Settings.data && typeof window.Settings.data.wsShowWords !== 'undefined') ? !!window.Settings.data.wsShowWords : (JSON.parse(localStorage.getItem('mg_ws_show_words')||'false')); if (!pref) { Array.from(words.querySelectorAll('.ws-word')).forEach(it=>{ if(!it.classList.contains('found')) it.classList.add('obscured'); }); } }catch(e){}
                                }
                                btn.textContent = words.classList.contains('sheet') ? 'Ocultar palavras' : 'Mostrar palavras';
                                return;
                            }
                            // desktop/tablet behavior: toggle revealed state (horizontal panel)
                            const isRevealed = words.classList.toggle('revealed');
                            try{
                                const items = Array.from(words.querySelectorAll('.ws-word'));
                                if (isRevealed) items.forEach(it => it.classList.remove('obscured'));
                                else items.forEach(it => { if (!it.classList.contains('found')) it.classList.add('obscured'); });
                            }catch(e){}
                            try{ words.classList.remove('hidden'); words.style.display = ''; }catch(e){}
                            try{ if (window.Settings && window.Settings.data) { window.Settings.data.wsShowWords = !!isRevealed; window.Settings.save(); } else { localStorage.setItem('mg_ws_show_words', JSON.stringify(!!isRevealed)); } }catch(e){}
                            btn.textContent = (isRevealed) ? 'Ocultar palavras' : 'Mostrar palavras';
                        }catch(e){}
                    });
                    return btn;
                };
                if (!existingToggle) {
                    // try to place next to newBtn if possible
                    try{
                        if (this.newBtn && this.newBtn.parentNode) {
                            const btn = createToggle();
                            this.newBtn.parentNode.insertBefore(btn, this.newBtn.nextSibling);
                        } else {
                            const controls = document.getElementById('ws-controls');
                            if (controls) controls.appendChild(createToggle());
                        }
                    }catch(e){}
                } else {
                    // ensure text reflects setting and attach click handler if missing
                    try{
                        const s = !!(window.Settings && window.Settings.data && window.Settings.data.wsShowWords);
                        existingToggle.textContent = s ? 'Ocultar palavras' : 'Mostrar palavras';
                        // ensure container reflects persisted revealed state
                        try{ const words = document.getElementById('ws-words'); if(words){ if(s) { words.classList.add('revealed'); try{ Array.from(words.querySelectorAll('.ws-word')).forEach(it=>it.classList.remove('obscured')); }catch(e){} } else { words.classList.remove('revealed'); try{ Array.from(words.querySelectorAll('.ws-word')).forEach(it=>{ if(!it.classList.contains('found')) it.classList.add('obscured'); }); }catch(e){} } } }catch(e){}
                        // attach handler once (avoid duplicates)
                        if (!existingToggle.dataset.wsHandlerAttached) {
                            existingToggle.addEventListener('click', ()=>{
                                try{
                                    const words = document.getElementById('ws-words');
                                    if (!words) return;
                                    const mobile = (window.innerWidth || document.documentElement.clientWidth) <= 900;
                                    if (mobile) {
                                        const isOpen = words.classList.toggle('sheet');
                                        if (isOpen) {
                                            words.classList.add('open');
                                            document.body.classList.add('ws-sheet-open');
                                            if (!words.querySelector('.sheet-header')){
                                                const header = document.createElement('div'); header.className = 'sheet-header';
                                                const title = document.createElement('div'); title.className='sheet-title'; title.textContent='Palavras';
                                                const closeBtn = document.createElement('button'); closeBtn.className='game-button'; closeBtn.textContent='Fechar'; closeBtn.addEventListener('click', ()=>{ words.classList.remove('sheet'); words.classList.remove('open'); document.body.classList.remove('ws-sheet-open'); try{ const pref = (window.Settings && window.Settings.data && typeof window.Settings.data.wsShowWords !== 'undefined') ? !!window.Settings.data.wsShowWords : (JSON.parse(localStorage.getItem('mg_ws_show_words')||'false')); if (!pref) { Array.from(words.querySelectorAll('.ws-word')).forEach(it=>{ if(!it.classList.contains('found')) it.classList.add('obscured'); }); } }catch(e){} });
                                                header.appendChild(title); header.appendChild(closeBtn);
                                                const handle = document.createElement('div'); handle.className='sheet-handle';
                                                words.insertBefore(handle, words.firstChild);
                                                words.insertBefore(header, handle.nextSibling);
                                            }
                                            Array.from(words.querySelectorAll('.ws-word')).forEach(it=>{ it.classList.remove('obscured'); });
                                        } else {
                                            words.classList.remove('open');
                                            document.body.classList.remove('ws-sheet-open');
                                            const hdr = words.querySelector('.sheet-header'); if(hdr) hdr.remove(); const h = words.querySelector('.sheet-handle'); if(h) h.remove();
                                            try{ const pref = (window.Settings && window.Settings.data && typeof window.Settings.data.wsShowWords !== 'undefined') ? !!window.Settings.data.wsShowWords : (JSON.parse(localStorage.getItem('mg_ws_show_words')||'false')); if (!pref) { Array.from(words.querySelectorAll('.ws-word')).forEach(it=>{ if(!it.classList.contains('found')) it.classList.add('obscured'); }); } }catch(e){}
                                        }
                                        existingToggle.textContent = words.classList.contains('sheet') ? 'Ocultar palavras' : 'Mostrar palavras';
                                        return;
                                    }
                                    const isRevealed = words.classList.toggle('revealed');
                                    try{
                                        const items = Array.from(words.querySelectorAll('.ws-word'));
                                        if (isRevealed) items.forEach(it=>it.classList.remove('obscured'));
                                        else items.forEach(it=>{ if(!it.classList.contains('found')) it.classList.add('obscured'); });
                                    }catch(e){}
                                    try{ words.classList.remove('hidden'); words.style.display = ''; }catch(e){}
                                    try{ if (window.Settings && window.Settings.data) { window.Settings.data.wsShowWords = !!isRevealed; window.Settings.save(); } else { localStorage.setItem('mg_ws_show_words', JSON.stringify(!!isRevealed)); } }catch(e){}
                                    existingToggle.textContent = (isRevealed) ? 'Ocultar palavras' : 'Mostrar palavras';
                                }catch(e){}
                            });
                            existingToggle.dataset.wsHandlerAttached = '1';
                        }
                    }catch(e){}
                }
            }catch(e){}
            const importBtn = document.getElementById('import-ws-list');
            const importFile = document.getElementById('import-ws-file');
            if (importBtn && importFile) {
                importBtn.addEventListener('click', ()=> importFile.click());
                importFile.addEventListener('change', (ev)=>{
                    const f = ev.target.files && ev.target.files[0];
                    if (!f) return;
                    const fr = new FileReader();
                    fr.onload = ()=>{
                        try{
                            const data = JSON.parse(fr.result);
                            if (Array.isArray(data)) {
                                this.externalLists = this.externalLists || {};
                                const key = 'imported';
                                this.externalLists[key] = Array.from(new Set(data.map(s=>String(s).toUpperCase())));
                                if (!Array.from(this.themeSelect.options).some(o=>o.value===key)){
                                    const opt = document.createElement('option'); opt.value=key; opt.textContent=key; this.themeSelect.appendChild(opt);
                                }
                                this.themeSelect.value = key; this.init(); alert('Lista importada: ' + (data.length||0) + ' palavras.');
                            } else if (data && data.name && Array.isArray(data.words)) {
                                this.externalLists = this.externalLists || {};
                                const key = String(data.name);
                                this.externalLists[key] = Array.from(new Set(data.words.map(s=>String(s).toUpperCase())));
                                if (!Array.from(this.themeSelect.options).some(o=>o.value===key)){
                                    const opt = document.createElement('option'); opt.value=key; opt.textContent=key; this.themeSelect.appendChild(opt);
                                }
                                this.themeSelect.value = key; this.init(); alert('Tema importado: ' + key + ' (' + this.externalLists[key].length + ' palavras).');
                            } else { alert('Formato inválido. Envie um array de palavras ou um objeto {name,words}.'); }
                        }catch(err){ alert('Erro ao importar: ' + err.message); }
                    };
                    fr.readAsText(f);
                });
            }

            // Mobile mini-menu: move controls into a floating panel when opened
            try{
                const miniBtn = document.getElementById('ws-mini-menu-btn');
                const miniPanel = document.getElementById('ws-mini-panel');
                const controlRight = document.querySelector('#wordsearch-screen .controls-right');
                if (miniBtn && miniPanel) {
                    miniBtn.addEventListener('click', ()=>{
                        try{
                            const open = miniPanel.classList.toggle('open');
                            if (open) {
                                // move a few controls into the panel in order
                                const ids = ['ws-theme-select','ws-level-select','import-ws-list','ws-toggle-words','new-ws'];
                                // create a container row
                                miniPanel.innerHTML = '';
                                const row = document.createElement('div'); row.className = 'panel-row';
                                ids.forEach(id=>{
                                    try{ const el = document.getElementById(id); if(el) row.appendChild(el); }catch(e){}
                                });
                                miniPanel.appendChild(row);
                                // add a small close row
                                const closeRow = document.createElement('div'); closeRow.className = 'panel-row';
                                const closeBtn = document.createElement('button'); closeBtn.className='game-button'; closeBtn.textContent='Fechar'; closeBtn.addEventListener('click', ()=>{ try{ miniBtn.click(); }catch(e){} });
                                closeRow.appendChild(closeBtn);
                                miniPanel.appendChild(closeRow);
                                try{ miniPanel.setAttribute('aria-hidden','false'); }catch(e){}
                            } else {
                                // move controls back to the right area
                                try{
                                    const ids = ['ws-theme-select','ws-level-select','import-ws-list','ws-toggle-words','new-ws'];
                                    ids.forEach(id=>{ try{ const el = document.getElementById(id); if(el && controlRight) controlRight.appendChild(el); }catch(e){} });
                                }catch(e){}
                                miniPanel.classList.remove('open');
                                miniPanel.innerHTML = '';
                                try{ miniPanel.setAttribute('aria-hidden','true'); }catch(e){}
                            }
                        }catch(e){}
                    });
                }
            }catch(e){}

            // Floating FAB for word list: toggle a floating panel anchored to the FAB
            try{
                const fab = document.getElementById('ws-words-fab');
                const wordsContainer = document.getElementById('ws-words');
                if (fab && wordsContainer) {
                    // ensure badge element inside FAB for count
                    let badge = fab.querySelector('.fab-badge');
                    if(!badge){ badge = document.createElement('span'); badge.className = 'fab-badge'; badge.style.position = 'absolute'; badge.style.top = '6px'; badge.style.right = '8px'; badge.style.minWidth = '18px'; badge.style.height = '18px'; badge.style.lineHeight = '18px'; badge.style.padding = '0 6px'; badge.style.borderRadius = '999px'; badge.style.fontSize = '0.72rem'; badge.style.background = 'var(--primary-color)'; badge.style.color = '#012'; badge.style.fontWeight = '700'; badge.style.display = 'none'; badge.style.alignItems = 'center'; badge.style.justifyContent = 'center'; badge.style.textAlign = 'center'; badge.style.pointerEvents = 'none'; fab.style.position='fixed'; fab.appendChild(badge); }

                    function updateBadge(){ try{ const count = (wordsContainer && wordsContainer.querySelectorAll) ? wordsContainer.querySelectorAll('.ws-word').length : 0; if(count>0){ badge.textContent = String(count); badge.style.display = 'inline-flex'; } else { badge.style.display = 'none'; } }catch(e){} }
                    updateBadge();

                    // Toggle panel open/close
                    fab.addEventListener('click', (ev)=>{
                        try{
                            ev.preventDefault();
                            ev.stopPropagation();
                            const mobile = (window.innerWidth || document.documentElement.clientWidth) <= 900;
                            // On small screens open as a bottom-sheet (sheet mode). On larger screens use floating panel.
                            if (mobile) {
                                const isOpen = wordsContainer.classList.toggle('sheet');
                                if (isOpen) {
                                    // add sheet helpers
                                    wordsContainer.classList.add('open');
                                    document.body.classList.add('ws-sheet-open');
                                    // add header if not present
                                    if (!wordsContainer.querySelector('.sheet-header')) {
                                        const header = document.createElement('div'); header.className = 'sheet-header';
                                        const title = document.createElement('div'); title.className='sheet-title'; title.textContent = 'Palavras';
                                        const closeBtn = document.createElement('button'); closeBtn.className='game-button'; closeBtn.textContent='Fechar'; closeBtn.addEventListener('click', ()=>{ wordsContainer.classList.remove('sheet'); wordsContainer.classList.remove('open'); document.body.classList.remove('ws-sheet-open'); });
                                        header.appendChild(title);
                                        header.appendChild(closeBtn);
                                        wordsContainer.insertBefore(header, wordsContainer.firstChild);
                                        const handle = document.createElement('div'); handle.className='sheet-handle'; wordsContainer.insertBefore(handle, header);
                                    }
                                    // reveal words visually in sheet mode but keep found items visible
                                    Array.from(wordsContainer.querySelectorAll('.ws-word')).forEach(it=>{ it.classList.remove('obscured'); });
                                } else {
                                    wordsContainer.classList.remove('open');
                                    document.body.classList.remove('ws-sheet-open');
                                    // remove header and handle if present
                                    const hdr = wordsContainer.querySelector('.sheet-header'); if(hdr) hdr.remove(); const h = wordsContainer.querySelector('.sheet-handle'); if(h) h.remove();
                                    // reapply persisted preference
                                    try{ const pref = (window.Settings && window.Settings.data && typeof window.Settings.data.wsShowWords !== 'undefined') ? !!window.Settings.data.wsShowWords : (JSON.parse(localStorage.getItem('mg_ws_show_words')||'false')); if (!pref) { Array.from(wordsContainer.querySelectorAll('.ws-word')).forEach(it=>{ if(!it.classList.contains('found')) it.classList.add('obscured'); }); } }catch(e){}
                                }
                            } else {
                                const isOpen = wordsContainer.classList.toggle('fab-panel');
                                if(isOpen){ wordsContainer.classList.add('open'); wordsContainer.classList.remove('hidden'); }
                                else { wordsContainer.classList.remove('open'); }
                                // if not open in fab mode, keep existing revealed state off unless persisted
                                if (!wordsContainer.classList.contains('fab-panel')) {
                                    // apply persisted preference
                                    try{ const pref = (window.Settings && window.Settings.data && typeof window.Settings.data.wsShowWords !== 'undefined') ? !!window.Settings.data.wsShowWords : (JSON.parse(localStorage.getItem('mg_ws_show_words')||'false')); if (!pref) { Array.from(wordsContainer.querySelectorAll('.ws-word')).forEach(it=>{ if(!it.classList.contains('found')) it.classList.add('obscured'); }); } }catch(e){}
                                }
                            }
                        }catch(e){}
                    });

                    // close the panel when tapping outside
                    document.addEventListener('click', (ev)=>{
                        try{
                            if (!wordsContainer.classList.contains('fab-panel')) return;
                            const path = ev.composedPath ? ev.composedPath() : (ev.path || []);
                            if (path && (path.indexOf(wordsContainer) !== -1 || path.indexOf(fab) !== -1)) return;
                            wordsContainer.classList.remove('fab-panel'); wordsContainer.classList.remove('open');
                        }catch(e){}
                    }, {capture:true});

                    // keep badge updated when word list changes (mutation observer)
                    try{
                        const mo = new MutationObserver(()=>{ updateBadge(); });
                        mo.observe(wordsContainer, { childList:true, subtree:true, characterData:false });
                    }catch(e){}
                }
            }catch(e){}
            this.init();
        },
        stop() {},
        async init() {
            const theme = this.themeSelect.value;
            let externalPools = null;
            // If a static JS-provided pools object exists (works with file://), prefer it and avoid fetch/CORS
            try{ if (window && window.WS_POOLS && window.WS_POOLS.pools) { externalPools = window.WS_POOLS.pools; console.info('[WordSearch] using embedded WS_POOLS from js/ws-pools.js'); } }catch(e){}
            // Only attempt network fetches when we don't already have embedded pools
            // and when not running under file:// (browsers block file:// fetches).
            if (!externalPools) {
                if (window && window.location && window.location.protocol === 'file:') {
                    try{ console.info('[WordSearch] running under file:// - skipping network fetch attempts'); }catch(e){}
                } else {
                    try{
                        // try several likely relative paths (works on GH Pages and local served sites)
                        const candidates = [
                            './json/ws-pools.json',
                            'json/ws-pools.json',
                            '../json/ws-pools.json',
                            '/json/ws-pools.json',
                            'https://maykonlong.github.io/json/ws-pools.json'
                        ];
                        for (let i = 0; i < candidates.length; i++){
                            try{
                                const url = candidates[i];
                                const resp = await fetch(url, { cache: 'no-store' });
                                if (resp && resp.ok){
                                    const data = await resp.json();
                                    if (data && data.pools) { externalPools = data.pools; console.info('[WordSearch] loaded external pools from', url); break; }
                                }
                            }catch(e){ /* try next candidate */ }
                        }
                    }catch(e){ console.info('[WordSearch] no external pools found', e && e.message ? e.message : e); }
                }
            }
            const pools = (externalPools && typeof externalPools === 'object') ? externalPools : {};
            if (!externalPools) { console.info('[WordSearch] no externalPools - using local/externalLists only'); }
            if (this.externalLists) { Object.keys(this.externalLists).forEach(k=> { pools[k] = (this.externalLists[k]||[]).slice(); }); }
            try{
                Object.keys(pools).forEach(k=>{
                    const target = 220;
                    let arr = Array.isArray(pools[k]) ? pools[k] : [];
                    if (!Array.isArray(pools[k])) { try{ console.info('[WordSearch] pool not an array for', k, 'falling back to []'); }catch(e){} }
                    const onlyLetters = v => (/^[\p{L}]+$/u).test(v);
                    // Build cleaned list by extracting letter-sequences from each entry.
                    // This handles cases where a single pool entry contains several words
                    // concatenated with spaces or punctuation (we extract separate words).
                    let cleaned = [];
                    for (const raw of (arr||[])){
                        try{
                            const s = String(raw||'').toUpperCase();
                            if(!s) continue;
                            // extract contiguous sequences of letters (Unicode aware)
                            const parts = s.match(/\p{L}+/gu) || [];
                            for (const p of parts){
                                if (!p) continue;
                                // skip too-short fragments
                                if (p.length < 2) continue;
                                // normalize: remove diacritics? keep as-is for now
                                if (!onlyLetters(p)) continue;
                                if (!cleaned.includes(p)) cleaned.push(p);
                                if (cleaned.length >= target) break;
                            }
                            if (cleaned.length >= target) break;
                        }catch(e){}
                    }
                    cleaned = Array.from(new Set(cleaned));
                    let i = 0;
                    while (cleaned.length < target && cleaned.length>0 && i < target*3) {
                        const base = cleaned[i % cleaned.length];
                        // create a letter-only suffix (A-Z) to avoid numeric tokens like 'LULA1'
                        const suffix = String.fromCharCode(65 + (i % 26));
                        const candidate = base + suffix;
                        if (!cleaned.includes(candidate) && (/^[\p{L}]+$/u).test(candidate)) cleaned.push(candidate);
                        i++;
                    }
                    while (cleaned.length < target) {
                        // generate a random letters-only filler
                        const letters = Array.from({length:4}, ()=> String.fromCharCode(65 + Math.floor(Math.random()*26))).join('');
                        cleaned.push(('PAL' + letters).toUpperCase());
                    }

                    // Normalize tokens: if a token appears to be another token + trailing garbage
                    // (e.g., CISNEPN), prefer the shorter meaningful token. Also remove duplicates.
                    try{
                        const norm = [];
                        for (const t of cleaned) {
                            let chosen = t;
                            // find any shorter token that is a prefix of t
                            const shorter = cleaned.filter(s => s !== t && s.length >= 3 && t.startsWith(s));
                            if (shorter && shorter.length) {
                                shorter.sort((a,b)=> b.length - a.length); // prefer longest matching short token
                                chosen = shorter[0];
                            } else {
                                // try stripping small trailing fragments if that yields an existing token
                                for (let drop = 1; drop <= 4 && drop < t.length; drop++) {
                                    const cand = t.slice(0, t.length - drop);
                                    if (cand.length >= 3 && cleaned.includes(cand)) { chosen = cand; break; }
                                }
                            }
                            if (!norm.includes(chosen)) norm.push(chosen);
                        }
                        cleaned = norm;
                    }catch(e){}

                    pools[k] = cleaned;
                });
            }catch(err){
                try{ console.error('[WordSearch] error processing pools, falling back to safe defaults', err); }catch(e){}
            }
            try{ if (pools) { const enabled = (window.Settings && window.Settings.data && window.Settings.data.enabledPools) || null; if (enabled) { Object.keys(pools).forEach(pk => { if (!enabled[pk]) delete pools[pk]; }); } else { if (pools.hasOwnProperty('tech')) delete pools['tech']; } } }catch(e){}
            try{ this.offlineDict = this.offlineDict || {}; Object.keys(pools).forEach(themeKey => { if (String(themeKey).toLowerCase() === 'tech') return; (pools[themeKey]||[]).forEach(w => { try{ const key = String(w||'').toUpperCase(); if (!key) return; if (!(/^[\p{L}]+$/u).test(key)) return; try{ const enabled = (window.Settings && window.Settings.data && window.Settings.data.enabledPools) || null; if (enabled && enabled[themeKey] === false) return; if (!this.offlineDict.hasOwnProperty(key)) { this.offlineDict[key] = `Palavra (${themeKey}): ${key}`; } }catch(e){} }catch(e){} }); }); }catch(e){}
            // Ensure `pool` is always an array to avoid runtime errors when external data is missing
            let pool = [];
            if (theme === 'tudo') {
                Object.keys(pools).forEach(k=> pool = pool.concat(pools[k] || []));
            } else {
                pool = Array.isArray(pools[theme]) ? pools[theme] : (Array.isArray(pools['animals']) ? pools['animals'] : []);
            }
            try{
                // Normalize pool: split any entry into letter-only parts (handles entries
                // that contain multiple words or separators), upper-case and dedupe.
                const raw = (pool || []).flatMap(item => {
                    try{
                        const s = String(item||'').toUpperCase();
                        if(!s) return [];
                        const parts = s.match(/\p{L}+/gu) || [];
                        return parts.filter(p => p && p.length >= 2);
                    }catch(e){ return []; }
                });
                pool = Array.from(new Set(raw)).filter(p => (/^[\p{L}]+$/u).test(p));
            }catch(e){ pool = []; }

            // Populate theme select with available pools
            try{
                const sel = this.themeSelect;
                if (sel) {
                    // keep current selection if present
                    const current = sel.value;
                    sel.innerHTML = '';
                    const keys = Object.keys(pools || {});
                    // add 'tudo' option to allow mixed pool
                    const optAll = document.createElement('option'); optAll.value = 'tudo'; optAll.text = 'Todos'; sel.appendChild(optAll);
                    const wsLabels = { 'animals':'Animais', 'food':'Comida', 'sports':'Esportes', 'nature':'Natureza', 'tech':'Tecnologia', 'fruits':'Frutas', 'vegetables':'Vegetais', 'objects':'Objetos', 'flags':'Bandeiras', 'transport':'Transportes', 'music':'Música', 'faces':'Rostos', 'emoji':'Emoji', 'colors':'Cores', 'numbers':'Números', 'letters':'Letras', 'holiday':'Feriados', 'classic-cards':'Cartas Clássicas', 'animals-extended':'Animais (extenso)', 'mix':'Mix (Aleatório)' };
                    keys.forEach(k => { const o = document.createElement('option'); o.value = k; o.text = wsLabels[k] || (String(k).charAt(0).toUpperCase() + String(k).slice(1)); sel.appendChild(o); });
                    if (current && Array.from(sel.options).some(o=>o.value===current)) sel.value = current;
                    // update small theme display if present
                    try{
                        const td = document.getElementById('ws-theme-display');
                        if (td) {
                            const key = (sel.value) ? String(sel.value) : (Object.keys(pools||{})[0] || 'Todos');
                            const wsLabels2 = { 'animals':'Animais', 'food':'Comida', 'sports':'Esportes', 'nature':'Natureza', 'tech':'Tecnologia', 'fruits':'Frutas', 'vegetables':'Vegetais', 'objects':'Objetos', 'flags':'Bandeiras', 'transport':'Transportes', 'music':'Música', 'faces':'Rostos', 'emoji':'Emoji', 'colors':'Cores', 'numbers':'Números', 'letters':'Letras', 'holiday':'Feriados', 'classic-cards':'Cartas Clássicas', 'animals-extended':'Animais (extenso)', 'mix':'Mix (Aleatório)' };
                            const label = wsLabels2[key] || (key.charAt(0).toUpperCase() + String(key).slice(1));
                            const emoji = '🔎';
                            const em = td.querySelector('.theme-emoji'); if (em) em.textContent = emoji;
                            const nm = td.querySelector('.theme-name'); if (nm) nm.textContent = label;
                        }
                    }catch(e){}
                }
            }catch(e){}
            const levelSelect = document.getElementById('ws-level-select');
            const amount = levelSelect ? parseInt(levelSelect.value,10) || 10 : 10;
            const chosen = [];
            const poolCopy = pool.slice();
            while (chosen.length < amount && poolCopy.length) { const idx = Math.floor(Math.random()*poolCopy.length); chosen.push(poolCopy.splice(idx,1)[0]); }
            this.words = chosen;
            // choose grid size heuristically based on amount and longest word
            try{
                const longest = this.words.reduce((m,w)=> Math.max(m, String(w||'').length), 0);
                let gridSize = 10;
                if (amount <= 6) gridSize = Math.max(8, longest + 4);
                else if (amount <= 8) gridSize = Math.max(9, longest + 4);
                else if (amount <= 10) gridSize = Math.max(11, longest + 4);
                else if (amount <= 12) gridSize = Math.max(12, longest + 4);
                else if (amount <= 16) gridSize = Math.max(13, longest + 5);
                else if (amount <= 20) gridSize = Math.max(16, longest + 5);
                else gridSize = Math.max(18, Math.ceil(Math.sqrt(amount * 3)));
                this.size = Math.min(24, gridSize);
            }catch(e){}
            this.generateGrid();
            this.render();
        },
        generateGrid() {
            const n = this.size;
            const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const dirs = [[0,1],[1,0],[1,1],[1,-1],[0,-1],[-1,0],[-1,-1],[-1,1]];

            // helper to create empty grid and reserved map
            const makeEmpty = () => ({ grid: Array.from({length:n}, ()=>Array.from({length:n}, ()=>'')), reserved: Array.from({length:n}, ()=>Array.from({length:n}, ()=>false)) });

            // pool words set (all available words across pools) to detect accidental words
            const poolSet = new Set(Object.keys(this.offlineDict || {}).map(k => String(k||'').toUpperCase()));
            const chosenSet = new Set((this.words||[]).map(w=>String(w||'').toUpperCase()));
            const maxPoolLen = Math.max(2, ...Array.from(poolSet).map(w=>w.length));

            const canPlace = (grid, w, r, c, dr, dc) => { for(let i=0;i<w.length;i++){ const rr=r+dr*i, cc=c+dc*i; if(rr<0||rr>=n||cc<0||cc>=n) return false; const ch=grid[rr][cc]; if(ch&&ch!==w[i]) return false; } return true; };
            const placeWord = (grid, reserved, w, r, c, dr, dc) => { for(let i=0;i<w.length;i++){ grid[r+dr*i][c+dc*i]=w[i]; reserved[r+dr*i][c+dc*i]=true; } };

            let attempts = 0;
            let final = null;
            outer: while(attempts < 6){ // try full regenerations a few times if accidental words can't be fixed
                attempts++;
                const { grid, reserved } = makeEmpty();

                // try placing chosen words randomly
                this.words.forEach(w=>{
                    const W = String(w||'').toUpperCase();
                    let placed=false, tries=0;
                    while(!placed && tries < 300){ tries++; const dir = dirs[Math.floor(Math.random()*dirs.length)]; const r = Math.floor(Math.random()*n); const c = Math.floor(Math.random()*n); if (canPlace(grid, W, r, c, dir[0], dir[1])) { placeWord(grid, reserved, W, r, c, dir[0], dir[1]); placed = true; } }
                });

                // fill empty cells with random letters
                for(let i=0;i<n;i++) for(let j=0;j<n;j++) if(!grid[i][j]) grid[i][j]=letters[Math.floor(Math.random()*letters.length)];

                // sanitize: scan for any pool words that are NOT in chosenSet and try to break them by changing a non-reserved letter
                let changed = false;
                let sanitizeTries = 0;
                const flatPool = Array.from(poolSet);
                while(sanitizeTries < 1000){
                    sanitizeTries++;
                    let foundExtraneous = false;
                    for(let r=0;r<n && !foundExtraneous;r++){
                        for(let c=0;c<n && !foundExtraneous;c++){
                            for(const d of dirs){
                                for(let L=2; L<=maxPoolLen; L++){
                                    const rr = r + d[0]*(L-1), cc = c + d[1]*(L-1);
                                    if(rr<0||rr>=n||cc<0||cc>=n) break;
                                    // build word
                                    let s = '';
                                    for(let k=0;k<L;k++) s += grid[r + d[0]*k][c + d[1]*k];
                                    if(!s) continue;
                                    const W = String(s||'').toUpperCase();
                                    if(poolSet.has(W) && !chosenSet.has(W)){
                                        // extraneous occurrence
                                        // try to find an index in this segment that is not reserved to change
                                        const freeIdxs = [];
                                        for(let k=0;k<L;k++){ if(!reserved[r + d[0]*k][c + d[1]*k]) freeIdxs.push(k); }
                                        if(freeIdxs.length===0){
                                            // cannot break this occurrence without touching placed words -> regenerate whole grid
                                            foundExtraneous = true;
                                            break;
                                        }
                                        // change one free index to a different random letter
                                        const pick = freeIdxs[Math.floor(Math.random()*freeIdxs.length)];
                                        const rr2 = r + d[0]*pick, cc2 = c + d[1]*pick;
                                        const old = grid[rr2][cc2];
                                        let newch = old;
                                        let innerTries = 0;
                                        while(newch === old && innerTries < 12){ newch = letters[Math.floor(Math.random()*letters.length)]; innerTries++; }
                                        grid[rr2][cc2] = newch;
                                        changed = true;
                                        foundExtraneous = true;
                                        break;
                                    }
                                }
                                if(foundExtraneous) break;
                            }
                        }
                    }
                    if(!foundExtraneous) break; // no extraneous words found
                }

                if(changed){
                    // after changes, do a final scan to ensure no extraneous remain
                    let any=false;
                    for(let r=0;r<n && !any;r++){
                        for(let c=0;c<n && !any;c++){
                            for(const d of dirs){
                                for(let L=2; L<=maxPoolLen; L++){
                                    const rr = r + d[0]*(L-1), cc = c + d[1]*(L-1);
                                    if(rr<0||rr>=n||cc<0||cc>=n) break;
                                    let s=''; for(let k=0;k<L;k++) s+=grid[r + d[0]*k][c + d[1]*k];
                                    if(poolSet.has(s) && !chosenSet.has(s)){ any = true; break; }
                                }
                                if(any) break;
                            }
                        }
                    }
                    if(!any){ final = {grid, reserved}; break outer; }
                } else {
                    // no changes needed
                    final = {grid, reserved}; break outer;
                }
                // if we reach here, regeneration loop will try again
            }

            if(final){ this.grid = final.grid; } else { this.grid = makeEmpty().grid; }
        },
        render() {
            try{
                const board = this.boardEl = this.boardEl || document.getElementById('ws-board');
                const wordsContainer = this.wordsEl = this.wordsEl || document.getElementById('ws-words');
                if (!board) return;
                // render grid
                const n = this.size;
                board.innerHTML = '';
                board.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
                for (let r = 0; r < n; r++){
                    for (let c = 0; c < n; c++){
                        const cell = document.createElement('div');
                        cell.className = 'ws-cell';
                        cell.style.userSelect = 'none';
                        cell.textContent = (this.grid && this.grid[r] && this.grid[r][c]) ? this.grid[r][c] : '';
                        cell.dataset.row = r; cell.dataset.col = c;
                        cell.style.display = 'flex'; cell.style.alignItems='center'; cell.style.justifyContent='center'; cell.style.padding='6px';
                        cell.style.border = '1px solid rgba(255,255,255,0.03)';
                        cell.style.fontWeight = '700';
                        cell.style.cursor = 'pointer';
                        board.appendChild(cell);
                        // pointerenter for selection
                        cell.addEventListener('pointerenter', (e)=>{ try{ this.onPointerEnter(e); }catch(err){} });
                    }
                }
                // pointerdown on board
                try{ board.removeEventListener('pointerdown', this._boundBoardPointerDown); }catch(e){}
                this._boundBoardPointerDown = this.onPointerDown.bind(this);
                board.addEventListener('pointerdown', this._boundBoardPointerDown);

                // render word list
                        if (wordsContainer){
                            wordsContainer.innerHTML = '';
                            // create an inner scroll row so we can control horizontal scrolling independently
                            const row = document.createElement('div');
                            row.className = 'ws-row';
                            this.words.forEach(w => {
                                const el = document.createElement('div');
                                el.className = 'ws-word';
                                el.dataset.word = w;
                                el.textContent = w;
                                el.style.padding = '6px 10px';
                                el.style.margin = '0';
                                el.style.display = 'inline-flex';
                                el.style.borderRadius = '6px';
                                el.style.background = 'transparent';
                                el.style.border = '1px solid rgba(255,255,255,0.04)';
                                el.style.fontWeight = '600';
                                el.style.whiteSpace = 'nowrap';
                                el.style.overflow = 'hidden';
                                el.style.textOverflow = 'ellipsis';
                                // clicking a word toggles a hint/highlight
                                el.addEventListener('click', ()=>{ try{ const now = el.classList.toggle('found'); if(now){ el.classList.remove('obscured'); } else { const container = document.getElementById('ws-words'); if(container && !container.classList.contains('revealed') && !container.classList.contains('sheet')) el.classList.add('obscured'); } }catch(e){} });
                                // obscure words by default unless user preference requests showing them
                                try{ const pref = (window.Settings && window.Settings.data && typeof window.Settings.data.wsShowWords !== 'undefined') ? !!window.Settings.data.wsShowWords : (JSON.parse(localStorage.getItem('mg_ws_show_words')||'false')); if (!pref) el.classList.add('obscured'); }catch(e){}
                                row.appendChild(el);
                            });
                            wordsContainer.appendChild(row);

                            // helper to update whether the inner row is scrollable (adds class to container)
                            const updateScrollable = () => {
                                try{
                                    const r = wordsContainer.querySelector('.ws-row');
                                    if (!r) { wordsContainer.classList.remove('scrollable'); return; }
                                    // small tolerance for rounding
                                    const isScrollable = r.scrollWidth > (r.clientWidth + 2);
                                    if (isScrollable) wordsContainer.classList.add('scrollable'); else wordsContainer.classList.remove('scrollable');
                                }catch(e){}
                            };

                            // set up mutation observer and resize handler once
                            try{
                                if (!this._wordsMO) {
                                    this._wordsMO = new MutationObserver(()=>{ updateScrollable(); });
                                    this._wordsMO.observe(wordsContainer, { childList:true, subtree:true });
                                    window.addEventListener('resize', ()=>{ try{ updateScrollable(); }catch(e){} });
                                }
                            }catch(e){}

                            // apply persisted visibility preference: default NOT revealed (words obscured) unless user enabled
                            try{
                                const pref = (window.Settings && window.Settings.data && typeof window.Settings.data.wsShowWords !== 'undefined') ? !!window.Settings.data.wsShowWords : (JSON.parse(localStorage.getItem('mg_ws_show_words')||'false'));
                                if (pref) { wordsContainer.classList.add('revealed'); try{ Array.from(wordsContainer.querySelectorAll('.ws-word')).forEach(it=>it.classList.remove('obscured')); }catch(e){} } else { wordsContainer.classList.remove('revealed'); try{ Array.from(wordsContainer.querySelectorAll('.ws-word')).forEach(it=>{ if(!it.classList.contains('found')) it.classList.add('obscured'); }); }catch(e){} }
                                try{ wordsContainer.classList.remove('hidden'); wordsContainer.style.display = ''; }catch(e){}
                                // update toggle button text if present
                                try{ const tbtn = document.getElementById('ws-toggle-words'); if(tbtn) tbtn.textContent = pref ? 'Ocultar palavras' : 'Mostrar palavras'; }catch(e){}
                            }catch(e){}

                            // run initial scrollable detection
                            try{ updateScrollable(); }catch(e){}
                        }
                // ensure overlayEl exists
                try{ if(!this.overlayEl) this.overlayEl = document.getElementById('ws-overlay'); }catch(e){}
            }catch(e){ console.error('[WordSearch] render error', e); }
        },
        onPointerDown(e){ if(!e.target.classList.contains('ws-cell')) return; this.selecting=true; this.selected=[e.target]; e.target.classList.add('selected'); try{ // try to capture pointer on the touched cell to improve move events
                try{ if (e && e.pointerId && e.target && e.target.setPointerCapture) { e.target.setPointerCapture(e.pointerId); this._capturedPointerId = e.pointerId; this._capturedEl = e.target; } }catch(__){}
                this._boundBoardPointerMove = this._onBoardPointerMove.bind(this); this.boardEl.addEventListener('pointermove', this._boundBoardPointerMove); this._boundDocPointerUp = this._onDocumentPointerUp.bind(this); document.addEventListener('pointerup', this._boundDocPointerUp); document.addEventListener('pointercancel', this._boundDocPointerUp);
            }catch(err){} try{ if (!this.polyline && this.overlayEl) { const ns = 'http://www.w3.org/2000/svg'; const poly = document.createElementNS(ns, 'polyline'); poly.setAttribute('fill','none'); poly.setAttribute('stroke','rgba(0,204,153,0.85)'); poly.setAttribute('stroke-width','8'); poly.setAttribute('stroke-linecap','round'); poly.setAttribute('stroke-linejoin','round'); poly.setAttribute('pointer-events','none'); poly.setAttribute('class','ws-polyline'); this.overlayEl.appendChild(poly); this.polyline = poly; } if (this.polyline) { this.points = []; this._addPointForCell(e.target); this._updatePolyline(); this.polyline.style.display = ''; } }catch(e){} },
        onPointerEnter(e){ if(this.selecting && e.target.classList.contains('ws-cell') && !this.selected.includes(e.target)){ this.selected.push(e.target); e.target.classList.add('selected'); if (this.polyline) { this._addPointForCell(e.target); this._updatePolyline(); } } },
        onPointerUp(e){
        if(!this.selecting) return;
        this.selecting=false;
        const word = this.selected.map(s=>s.textContent).join('');
        const rev = word.split('').reverse().join('');
        const found = this.words.find(w=>w===word||w===rev);

            if(found){
            this.selected.forEach(s=>{ s.classList.remove('selected'); s.classList.add('found'); });
            const list = this.wordsEl ? Array.from(this.wordsEl.querySelectorAll('.ws-word')).find(x=> x.dataset && x.dataset.word === found) : null;
            if(list) {
                list.style.textDecoration = 'line-through';
                list.classList.add('found');
                try{ list.classList.remove('obscured'); }catch(e){}
                list.dataset.showing = 'name';
                list.textContent = found;
            }
            if (this.polyline) {
                try{ this.polyline.setAttribute('stroke','rgba(255,200,60,0.95)'); }catch(e){}
                const poly = this.polyline; // Capture for timeout
                setTimeout(() => {
                    try {
                        if (poly && this.overlayEl && this.overlayEl.contains(poly)) {
                            this.overlayEl.removeChild(poly);
                        }
                        // Aggressive cleanup from original code
                        if (this.overlayEl) this.overlayEl.innerHTML = '';
                        setTimeout(() => {
                            if (this.overlayEl) this.overlayEl.innerHTML = '';
                        }, 120);
                    } catch(e) {}
                }, 600);
            // after marking a found word, check for victory
                try{
                const total = this.words ? this.words.length : 0;
                const foundCount = (this.wordsEl) ? (this.wordsEl.querySelectorAll('.ws-word.found') || []).length : 0;
                if (total > 0 && foundCount >= total) {
                    try{ playSound('win'); }catch(e){}
                    try{ if(!window.Settings || window.Settings.data.confetti) { Confetti.fire(); } }catch(e){}
                    setTimeout(()=>{ try{ alert('Parabéns — você encontrou todas as palavras!'); }catch(e){} }, 300);
                }
            }catch(e){}
            }
        } else {
            this.selected.forEach(s=>s.classList.remove('selected'));
            // If not found, remove polyline immediately
            try{
                if (this.polyline && this.overlayEl) {
                    if (this.overlayEl.contains(this.polyline)) this.overlayEl.removeChild(this.polyline);
                }
            }catch(e){}
            try{ if (this.overlayEl) this.overlayEl.innerHTML = ''; }catch(e){}
            setTimeout(()=>{
                try{ if (this.overlayEl) this.overlayEl.innerHTML = ''; }catch(e){}
            }, 120);
        }

        try{ if (this._boundBoardPointerMove) this.boardEl.removeEventListener('pointermove', this._boundBoardPointerMove); }catch(err){}
        try{ if (this._boundDocPointerUp) { document.removeEventListener('pointerup', this._boundDocPointerUp); document.removeEventListener('pointercancel', this._boundDocPointerUp); } }catch(err){}
        
        this.polyline = null;
        this.selected=[];
    },
        _addPointForCell(cell){ try{ const rect = cell.getBoundingClientRect(); const boardRect = this.boardEl.getBoundingClientRect(); const cx = rect.left - boardRect.left + rect.width/2; const cy = rect.top - boardRect.top + rect.height/2; this.points = this.points || []; const last = this.points.length? this.points[this.points.length-1]: null; if (!last || Math.hypot(last.x-cx, last.y-cy) > 4) this.points.push({x:cx,y:cy}); }catch(e){} },
        _updatePolyline(){ if (!this.polyline) return; const pts = (this.points||[]).map(p=>`${p.x},${p.y}`).join(' '); this.polyline.setAttribute('points', pts); try{ this.polyline.removeAttribute('stroke-dasharray'); this.polyline.removeAttribute('stroke-dashoffset'); }catch(e){} },
        _onBoardPointerMove(e){ try{ const els = document.elementsFromPoint ? document.elementsFromPoint(e.clientX, e.clientY) : [document.elementFromPoint(e.clientX, e.clientY)]; if (!els || !els.length) {
                    // try a few nearby points to tolerate finger imprecision
                    const probes = [[-12,0],[12,0],[0,-12],[0,12],[-8,-8],[8,8],[-8,8],[8,-8]];
                    let found=null;
                    for (let p=0;p<probes.length && !found;p++){ try{ const dx=probes[p][0], dy=probes[p][1]; const els2 = document.elementsFromPoint ? document.elementsFromPoint(e.clientX+dx, e.clientY+dy) : [document.elementFromPoint(e.clientX+dx, e.clientY+dy)]; if (!els2 || !els2.length) continue; for (let j=0;j<els2.length;j++){ if (els2[j] && els2[j].classList && els2[j].classList.contains('ws-cell')) { found = els2[j]; break; } } }catch(__){} }
                    if (!found) return; var el = found;
                } else {
                    let el = null; for (let i=0;i<els.length;i++){ if (els[i] && els[i].classList && els[i].classList.contains('ws-cell')) { el = els[i]; break; } }
                    if (!el) {
                        // fallback: try nearby probes
                        const probes = [[-12,0],[12,0],[0,-12],[0,12],[-8,-8],[8,8],[-8,8],[8,-8]];
                        for (let p=0;p<probes.length;p++){ try{ const dx=probes[p][0], dy=probes[p][1]; const els2 = document.elementsFromPoint ? document.elementsFromPoint(e.clientX+dx, e.clientY+dy) : [document.elementFromPoint(e.clientX+dx, e.clientY+dy)]; if (!els2 || !els2.length) continue; for (let j=0;j<els2.length;j++){ if (els2[j] && els2[j].classList && els2[j].classList.contains('ws-cell')) { el = els2[j]; break; } } }catch(__){} if (el) break; }
                        if (!el) return;
                    }
                    if (!this.selected.includes(el)){ this.selected.push(el); el.classList.add('selected'); if (this.polyline) { this._addPointForCell(el); this._updatePolyline(); } }
                    return;
                }
                // if we got a 'found' from probes above
                try{ if (found && !this.selected.includes(found)) { this.selected.push(found); found.classList.add('selected'); if (this.polyline) { this._addPointForCell(found); this._updatePolyline(); } } }catch(err){}
            }catch(err){} },
        _onDocumentPointerUp(e){ try{ this.onPointerUp(e); }catch(err){} try{ // release pointer capture if we set one
                try{ if (this._capturedEl && this._capturedPointerId && this._capturedEl.releasePointerCapture) { this._capturedEl.releasePointerCapture(this._capturedPointerId); } }catch(__){}
                this._capturedEl = null; this._capturedPointerId = null;
            }catch(__){} },
        async _fetchDefinition(word){ if (!word) return null; const key = String(word).toUpperCase(); if (this.definitionCache.hasOwnProperty(key)) return this.definitionCache[key]; try{ const w = String(word || '').trim(); const isLookupable = (/^[\p{L}]{3,22}$/u).test(w); if (!isLookupable) { this.definitionCache[key] = null; return null; } return new Promise((resolve) => { this.fetchQueue.push({ word: w, resolve }); this._processFetchQueue(); }); }catch(err){ this.definitionCache[key] = null; return null; } },
        async _processFetchQueue(){ if (this.activeFetches >= this.maxConcurrent || this.fetchQueue.length === 0) return; this.activeFetches++; const { word, resolve } = this.fetchQueue.shift(); const key = word.toUpperCase(); try{ let result = null; const apiPt = `https://api.dictionaryapi.dev/api/v2/entries/pt/${encodeURIComponent(word.toLowerCase())}`; let resp = await fetch(apiPt); if (resp && resp.ok) { const data = await resp.json(); if (Array.isArray(data) && data.length>0) { const meanings = data[0].meanings || []; if (meanings.length>0) { const defs = []; for (const m of meanings) { if (m.definitions && m.definitions.length>0) defs.push(m.definitions.map(d=>d.definition).join('; ')); } if (defs.length) result = defs.join('\n'); } } } if (!result) { const apiEn = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`; resp = await fetch(apiEn); if (resp && resp.ok) { const data = await resp.json(); if (Array.isArray(data) && data.length>0) { const meanings = data[0].meanings || []; if (meanings.length>0) result = meanings[0].definitions.map(d=>d.definition).join('; '); } } } if (!result) { try{ const wikiPt = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(word)}`; let wresp = await fetch(wikiPt); if (wresp && wresp.ok) { const wdata = await wresp.json(); if (wdata && wdata.extract) result = wdata.extract; } }catch(e){} } if (!result) { try{ const wikiEn = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(word)}`; let wresp2 = await fetch(wikiEn); if (wresp2 && wresp2.ok) { const wdata2 = await wresp2.json(); if (wdata2 && wdata2.extract) result = wdata2.extract; } }catch(e){} } this.definitionCache[key] = result; resolve(result); }catch(err){ this.definitionCache[key] = null; resolve(null); }finally{ this.activeFetches--; setTimeout(() => this._processFetchQueue(), 10); } }
    };

    // ====== 2048 ======
    const Game2048 = {
        boardEl: document.getElementById('g2048-board'),
        scoreEl: document.getElementById('score-2048'),
        size:4, board: null, score:0,
        start(){ document.getElementById('restart-2048').addEventListener('click', ()=>this.init()); this.init(); window.addEventListener('keydown', (e)=>{ if(!document.getElementById('game2048-screen').classList.contains('hidden')) this.onKey(e); }); this.boardEl.addEventListener('pointerdown',(ev)=>{ this.sx=ev.clientX; this.sy=ev.clientY; }); this.boardEl.addEventListener('pointerup',(ev)=>{ const dx=ev.clientX-this.sx, dy=ev.clientY-this.sy; if(Math.abs(dx)<20&&Math.abs(dy)<20) return; if(Math.abs(dx)>Math.abs(dy)){ if(dx>0) this.move('right'); else this.move('left'); } else { if(dy>0) this.move('down'); else this.move('up'); } }); },
        stop(){},
        init(){ this.board = Array.from({length:this.size}, ()=>Array.from({length:this.size}, ()=>0)); this.score=0; this.addRandom(); this.addRandom(); this.render(); },
        addRandom(){ const empties=[]; for(let r=0;r<this.size;r++) for(let c=0;c<this.size;c++) if(this.board[r][c]===0) empties.push([r,c]); if(!empties.length) return; const [r,c]=empties[Math.floor(Math.random()*empties.length)]; this.board[r][c] = Math.random()<0.9?2:4; },
        render(){ this.boardEl.innerHTML=''; for(let r=0;r<this.size;r++){ for(let c=0;c<this.size;c++){ const v=this.board[r][c]; const tile=document.createElement('div'); tile.className='tile'; tile.style.width='80px'; tile.style.height='80px'; tile.style.display='flex'; tile.style.alignItems='center'; tile.style.justifyContent='center'; tile.style.borderRadius='8px'; tile.style.background=v? '#eee':'rgba(255,255,255,0.04)'; tile.style.fontWeight='700'; tile.textContent=v?v:''; this.boardEl.appendChild(tile); } } this.scoreEl.textContent=this.score; },
        collapseLine(arr){ const a=arr.filter(v=>v!==0); for(let i=0;i<a.length-1;i++){ if(a[i]===a[i+1]){ a[i]*=2; this.score+=a[i]; a.splice(i+1,1); } } while(a.length<this.size) a.push(0); return a; },
        move(dir){ const old=JSON.stringify(this.board); if(dir==='left'){ for(let r=0;r<this.size;r++){ this.board[r]=this.collapseLine(this.board[r]); } } else if(dir==='right'){ for(let r=0;r<this.size;r++){ this.board[r]=this.collapseLine(this.board[r].slice().reverse()).reverse(); } } else if(dir==='up'){ for(let c=0;c<this.size;c++){ const col=[]; for(let r=0;r<this.size;r++) col.push(this.board[r][c]); const col2=this.collapseLine(col); for(let r=0;r<this.size;r++) this.board[r][c]=col2[r]; } } else if(dir==='down'){ for(let c=0;c<this.size;c++){ const col=[]; for(let r=0;r<this.size;r++) col.push(this.board[r][c]); const col2=this.collapseLine(col.slice().reverse()).reverse(); for(let r=0;r<this.size;r++) this.board[r][c]=col2[r]; } }
            if(JSON.stringify(this.board)!==old){ this.addRandom(); this.render(); }
        },
        onKey(e){ if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){ e.preventDefault(); const map={'ArrowUp':'up','ArrowDown':'down','ArrowLeft':'left','ArrowRight':'right'}; this.move(map[e.key]); } }
    };

    // ====== Sudoku (simple) ======
    const SudokuGame = {
        boardEl: document.getElementById('sudoku-board'),
        start(){ document.getElementById('new-sudoku').addEventListener('click', ()=>this.init()); this.init(); },
        stop(){},
        init(){ const base=[ [5,3,0,0,7,0,0,0,0],[6,0,0,1,9,5,0,0,0],[0,9,8,0,0,0,0,6,0],[8,0,0,0,6,0,0,0,3],[4,0,0,8,0,3,0,0,1],[7,0,0,0,2,0,0,0,6],[0,6,0,0,0,0,2,8,0],[0,0,0,4,1,9,0,0,5],[0,0,0,0,8,0,0,7,9] ]; this.boardEl.innerHTML=''; for(let i=0;i<9;i++){ for(let j=0;j<9;j++){ const cell=document.createElement('div'); cell.className='sudoku-cell'; cell.style.width='44px'; cell.style.height='44px'; cell.style.display='flex'; cell.style.alignItems='center'; cell.style.justifyContent='center'; cell.style.background='#223'; cell.style.color='#fff'; cell.style.border='1px solid rgba(255,255,255,0.04)'; cell.textContent = base[i][j]===0 ? '' : base[i][j]; if(base[i][j]===0){ cell.contentEditable=true; cell.addEventListener('input', ()=>{ if(!/^[1-9]$/.test(cell.textContent)) cell.textContent=''; }); } else { cell.style.background='#334'; } this.boardEl.appendChild(cell); } } }
    };

    // ====== Hangman (Forca) ======
    const HangmanGame = {
        area: document.getElementById('hangman-area'),
        wordEl: document.getElementById('hm-word'),
        keyboardEl: document.getElementById('hm-keyboard'),
        mistakesEl: document.getElementById('hm-mistakes'),
        maxEl: document.getElementById('hm-max'),
        messageEl: document.getElementById('hm-message'),
        newBtn: document.getElementById('new-hangman'),
        words: ['JAVASCRIPT','MEMORIA','FORCA','DESAFIO','PROGRAMAR','COMPUTADOR','GABARITO','DESENVOLVER','ALGORITMO','INTERFACE'],
        secret: '',
        display: [],
        guessed: new Set(),
        mistakes: 0,
        maxMistakes: 6,
        start(){ if(this.newBtn) this.newBtn.addEventListener('click', ()=>this.init()); document.getElementById('back-to-hub-hm').addEventListener('click', ()=>{ this.stop(); switchScreen('hub'); }); this.init(); },
        stop(){},
        init(){ this.mistakes=0; this.guessed=new Set(); this.secret = this.words[Math.floor(Math.random()*this.words.length)]; this.display = Array.from(this.secret).map(ch=> ch === ' ' ? ' ' : '_'); this.render(); this.renderKeyboard(); this.mistakesEl.textContent = this.mistakes; this.maxEl.textContent = this.maxMistakes; this.messageEl.textContent=''; },
        render(){ this.wordEl.textContent = this.display.join(' '); this.mistakesEl.textContent = this.mistakes; if(!this.display.includes('_')){ this.messageEl.textContent = 'Você venceu! 🎉'; } else if(this.mistakes>=this.maxMistakes){ this.messageEl.textContent = `Perdeu! Palavra: ${this.secret}`; } },
        renderKeyboard(){ this.keyboardEl.innerHTML=''; const letters='ABCDEFGHIJKLMNOPQRSTUVWXYZ'; for(let ch of letters){ const btn=document.createElement('button'); btn.className='game-button hm-key'; btn.textContent=ch; btn.style.padding='8px 10px'; btn.style.minWidth='36px'; btn.addEventListener('click', ()=>this.guess(ch)); this.keyboardEl.appendChild(btn); } },
        guess(letter){ if(this.guessed.has(letter) || this.mistakes>=this.maxMistakes || !this.secret) return; this.guessed.add(letter); if(this.secret.includes(letter)){ for(let i=0;i<this.secret.length;i++){ if(this.secret[i]===letter) this.display[i]=letter; } } else { this.mistakes++; } const btns = Array.from(this.keyboardEl.children).filter(b=>b.textContent===letter); btns.forEach(b=>b.disabled=true); this.render(); }
    };

    // initialization of games is handled when cards are clicked above
});
