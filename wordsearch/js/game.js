// WordSearch Game Logic
window.WordSearch = {
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
        this.boardEl = document.getElementById('ws-board');
        this.wordsEl = document.getElementById('ws-words');
        this.themeSelect = document.getElementById('ws-theme-select');
        this.newBtn = document.getElementById('new-ws');

        if (this.newBtn) this.newBtn.addEventListener('click', () => this.init());
        if (this.themeSelect) this.themeSelect.addEventListener('change', () => this.init());

        try { this.overlayEl = document.getElementById('ws-overlay'); } catch (e) { this.overlayEl = null; }

        const levelSel = document.getElementById('ws-level-select');
        try {
            if (levelSel) {
                if (!levelSel.options || levelSel.options.length === 0) {
                    const opts = [6, 8, 10, 12, 16, 20, 30];
                    opts.forEach(v => { const o = document.createElement('option'); o.value = String(v); o.text = String(v); levelSel.appendChild(o); });
                    try { const pref = (window.Settings && window.Settings.data && window.Settings.data.wsLevel) ? String(window.Settings.data.wsLevel) : null; if (pref && Array.from(levelSel.options).some(o => o.value === pref)) levelSel.value = pref; } catch (e) { }
                }
                levelSel.addEventListener('change', () => this.init());
            }
        } catch (e) { }

        // Toggle words button
        try {
            const existingToggle = document.getElementById('ws-toggle-words');
            const createToggle = () => {
                const btn = document.createElement('button');
                btn.id = 'ws-toggle-words';
                btn.type = 'button';
                btn.className = 'game-button ws-toggle-words';
                const show = !!(window.Settings && window.Settings.data && window.Settings.data.wsShowWords);
                btn.textContent = show ? 'Ocultar palavras' : 'Mostrar palavras';
                btn.addEventListener('click', () => {
                    try {
                        const words = document.getElementById('ws-words');
                        if (!words) return;
                        const mobile = (window.innerWidth || document.documentElement.clientWidth) <= 900;
                        if (mobile) {
                            const isOpen = words.classList.toggle('sheet');
                            if (isOpen) {
                                words.classList.add('open');
                                document.body.classList.add('ws-sheet-open');
                                if (!words.querySelector('.sheet-header')) {
                                    const header = document.createElement('div'); header.className = 'sheet-header';
                                    const title = document.createElement('div'); title.className = 'sheet-title'; title.textContent = 'Palavras';
                                    const closeBtn = document.createElement('button'); closeBtn.className = 'game-button'; closeBtn.textContent = 'Fechar'; closeBtn.addEventListener('click', () => { words.classList.remove('sheet'); words.classList.remove('open'); document.body.classList.remove('ws-sheet-open'); try { const pref = (window.Settings && window.Settings.data && typeof window.Settings.data.wsShowWords !== 'undefined') ? !!window.Settings.data.wsShowWords : (JSON.parse(localStorage.getItem('mg_ws_show_words') || 'false')); if (!pref) { Array.from(words.querySelectorAll('.ws-word')).forEach(it => { if (!it.classList.contains('found')) it.classList.add('obscured'); }); } } catch (e) { } });
                                    header.appendChild(title); header.appendChild(closeBtn);
                                    const handle = document.createElement('div'); handle.className = 'sheet-handle';
                                    words.insertBefore(handle, words.firstChild);
                                    words.insertBefore(header, handle.nextSibling);
                                }
                                Array.from(words.querySelectorAll('.ws-word')).forEach(it => { it.classList.remove('obscured'); });
                            } else {
                                words.classList.remove('open');
                                document.body.classList.remove('ws-sheet-open');
                                const hdr = words.querySelector('.sheet-header'); if (hdr) hdr.remove(); const h = words.querySelector('.sheet-handle'); if (h) h.remove();
                                try { const pref = (window.Settings && window.Settings.data && typeof window.Settings.data.wsShowWords !== 'undefined') ? !!window.Settings.data.wsShowWords : (JSON.parse(localStorage.getItem('mg_ws_show_words') || 'false')); if (!pref) { Array.from(words.querySelectorAll('.ws-word')).forEach(it => { if (!it.classList.contains('found')) it.classList.add('obscured'); }); } } catch (e) { }
                            }
                            btn.textContent = words.classList.contains('sheet') ? 'Ocultar palavras' : 'Mostrar palavras';
                            return;
                        }
                        const isRevealed = words.classList.toggle('revealed');
                        try {
                            const items = Array.from(words.querySelectorAll('.ws-word'));
                            if (isRevealed) items.forEach(it => it.classList.remove('obscured'));
                            else items.forEach(it => { if (!it.classList.contains('found')) it.classList.add('obscured'); });
                        } catch (e) { }
                        try { words.classList.remove('hidden'); words.style.display = ''; } catch (e) { }
                        try { if (window.Settings && window.Settings.data) { window.Settings.data.wsShowWords = !!isRevealed; window.Settings.save(); } else { localStorage.setItem('mg_ws_show_words', JSON.stringify(!!isRevealed)); } } catch (e) { }
                        btn.textContent = (isRevealed) ? 'Ocultar palavras' : 'Mostrar palavras';
                    } catch (e) { }
                });
                return btn;
            };
            if (!existingToggle) {
                try {
                    if (this.newBtn && this.newBtn.parentNode) {
                        const btn = createToggle();
                        this.newBtn.parentNode.insertBefore(btn, this.newBtn.nextSibling);
                    } else {
                        const controls = document.getElementById('ws-controls');
                        if (controls) controls.appendChild(createToggle());
                    }
                } catch (e) { }
            } else {
                try {
                    const s = !!(window.Settings && window.Settings.data && window.Settings.data.wsShowWords);
                    existingToggle.textContent = s ? 'Ocultar palavras' : 'Mostrar palavras';
                    try { const words = document.getElementById('ws-words'); if (words) { if (s) { words.classList.add('revealed'); try { Array.from(words.querySelectorAll('.ws-word')).forEach(it => it.classList.remove('obscured')); } catch (e) { } } else { words.classList.remove('revealed'); try { Array.from(words.querySelectorAll('.ws-word')).forEach(it => { if (!it.classList.contains('found')) it.classList.add('obscured'); }); } catch (e) { } } } } catch (e) { }
                    if (!existingToggle.dataset.wsHandlerAttached) {
                        existingToggle.addEventListener('click', () => {
                            try {
                                const words = document.getElementById('ws-words');
                                if (!words) return;
                                const mobile = (window.innerWidth || document.documentElement.clientWidth) <= 900;
                                if (mobile) {
                                    const isOpen = words.classList.toggle('sheet');
                                    if (isOpen) {
                                        words.classList.add('open');
                                        document.body.classList.add('ws-sheet-open');
                                        if (!words.querySelector('.sheet-header')) {
                                            const header = document.createElement('div'); header.className = 'sheet-header';
                                            const title = document.createElement('div'); title.className = 'sheet-title'; title.textContent = 'Palavras';
                                            const closeBtn = document.createElement('button'); closeBtn.className = 'game-button'; closeBtn.textContent = 'Fechar'; closeBtn.addEventListener('click', () => { words.classList.remove('sheet'); words.classList.remove('open'); document.body.classList.remove('ws-sheet-open'); try { const pref = (window.Settings && window.Settings.data && typeof window.Settings.data.wsShowWords !== 'undefined') ? !!window.Settings.data.wsShowWords : (JSON.parse(localStorage.getItem('mg_ws_show_words') || 'false')); if (!pref) { Array.from(words.querySelectorAll('.ws-word')).forEach(it => { if (!it.classList.contains('found')) it.classList.add('obscured'); }); } } catch (e) { } });
                                            header.appendChild(title); header.appendChild(closeBtn);
                                            const handle = document.createElement('div'); handle.className = 'sheet-handle';
                                            words.insertBefore(handle, words.firstChild);
                                            words.insertBefore(header, handle.nextSibling);
                                        }
                                        Array.from(words.querySelectorAll('.ws-word')).forEach(it => { it.classList.remove('obscured'); });
                                    } else {
                                        words.classList.remove('open');
                                        document.body.classList.remove('ws-sheet-open');
                                        const hdr = words.querySelector('.sheet-header'); if (hdr) hdr.remove(); const h = words.querySelector('.sheet-handle'); if (h) h.remove();
                                        try { const pref = (window.Settings && window.Settings.data && typeof window.Settings.data.wsShowWords !== 'undefined') ? !!window.Settings.data.wsShowWords : (JSON.parse(localStorage.getItem('mg_ws_show_words') || 'false')); if (!pref) { Array.from(words.querySelectorAll('.ws-word')).forEach(it => { if (!it.classList.contains('found')) it.classList.add('obscured'); }); } } catch (e) { }
                                    }
                                    existingToggle.textContent = words.classList.contains('sheet') ? 'Ocultar palavras' : 'Mostrar palavras';
                                    return;
                                }
                                const isRevealed = words.classList.toggle('revealed');
                                try {
                                    const items = Array.from(words.querySelectorAll('.ws-word'));
                                    if (isRevealed) items.forEach(it => it.classList.remove('obscured'));
                                    else items.forEach(it => { if (!it.classList.contains('found')) it.classList.add('obscured'); });
                                } catch (e) { }
                                try { words.classList.remove('hidden'); words.style.display = ''; } catch (e) { }
                                try { if (window.Settings && window.Settings.data) { window.Settings.data.wsShowWords = !!isRevealed; window.Settings.save(); } else { localStorage.setItem('mg_ws_show_words', JSON.stringify(!!isRevealed)); } } catch (e) { }
                                existingToggle.textContent = (isRevealed) ? 'Ocultar palavras' : 'Mostrar palavras';
                            } catch (e) { }
                        });
                        existingToggle.dataset.wsHandlerAttached = '1';
                    }
                } catch (e) { }
            }
        } catch (e) { }

        const importBtn = document.getElementById('import-ws-list');
        const importFile = document.getElementById('import-ws-file');
        if (importBtn && importFile) {
            importBtn.addEventListener('click', () => importFile.click());
            importFile.addEventListener('change', (ev) => {
                const f = ev.target.files && ev.target.files[0];
                if (!f) return;
                const fr = new FileReader();
                fr.onload = () => {
                    try {
                        const data = JSON.parse(fr.result);
                        if (Array.isArray(data)) {
                            this.externalLists = this.externalLists || {};
                            const key = 'imported';
                            this.externalLists[key] = Array.from(new Set(data.map(s => String(s).toUpperCase())));
                            if (!Array.from(this.themeSelect.options).some(o => o.value === key)) {
                                const opt = document.createElement('option'); opt.value = key; opt.textContent = key; this.themeSelect.appendChild(opt);
                            }
                            this.themeSelect.value = key; this.init(); alert('Lista importada: ' + (data.length || 0) + ' palavras.');
                        } else if (data && data.name && Array.isArray(data.words)) {
                            this.externalLists = this.externalLists || {};
                            const key = String(data.name);
                            this.externalLists[key] = Array.from(new Set(data.words.map(s => String(s).toUpperCase())));
                            if (!Array.from(this.themeSelect.options).some(o => o.value === key)) {
                                const opt = document.createElement('option'); opt.value = key; opt.textContent = key; this.themeSelect.appendChild(opt);
                            }
                            this.themeSelect.value = key; this.init(); alert('Tema importado: ' + key + ' (' + this.externalLists[key].length + ' palavras).');
                        } else { alert('Formato inválido. Envie um array de palavras ou um objeto {name,words}.'); }
                    } catch (err) { alert('Erro ao importar: ' + err.message); }
                };
                fr.readAsText(f);
            });
        }

        this.init();
    },
    stop() { },
    async init() {
        const theme = this.themeSelect ? this.themeSelect.value : 'animals';
        let externalPools = null;
        try { if (window && window.WS_POOLS && window.WS_POOLS.pools) { externalPools = window.WS_POOLS.pools; } } catch (e) { }

        if (!externalPools) {
            if (window && window.location && window.location.protocol === 'file:') {
                // skipping fetch
            } else {
                try {
                    const candidates = [
                        './json/ws-pools.json',
                        'json/ws-pools.json',
                        '../json/ws-pools.json',
                        '/json/ws-pools.json',
                        'https://maykonlong.github.io/json/ws-pools.json'
                    ];
                    for (let i = 0; i < candidates.length; i++) {
                        try {
                            const url = candidates[i];
                            const resp = await fetch(url, { cache: 'no-store' });
                            if (resp && resp.ok) {
                                const data = await resp.json();
                                if (data && data.pools) { externalPools = data.pools; break; }
                            }
                        } catch (e) { }
                    }
                } catch (e) { }
            }
        }
        const pools = (externalPools && typeof externalPools === 'object') ? externalPools : {};
        if (this.externalLists) { Object.keys(this.externalLists).forEach(k => { pools[k] = (this.externalLists[k] || []).slice(); }); }

        try {
            Object.keys(pools).forEach(k => {
                const target = 220;
                let arr = Array.isArray(pools[k]) ? pools[k] : [];
                const onlyLetters = v => (/^[\p{L}]+$/u).test(v);
                let cleaned = [];
                for (const raw of (arr || [])) {
                    try {
                        const s = String(raw || '').toUpperCase();
                        if (!s) continue;
                        const parts = s.match(/\p{L}+/gu) || [];
                        for (const p of parts) {
                            if (!p) continue;
                            if (p.length < 2) continue;
                            if (!onlyLetters(p)) continue;
                            if (!cleaned.includes(p)) cleaned.push(p);
                            if (cleaned.length >= target) break;
                        }
                        if (cleaned.length >= target) break;
                    } catch (e) { }
                }
                cleaned = Array.from(new Set(cleaned));
                let i = 0;
                while (cleaned.length < target && cleaned.length > 0 && i < target * 3) {
                    const base = cleaned[i % cleaned.length];
                    const suffix = String.fromCharCode(65 + (i % 26));
                    const candidate = base + suffix;
                    if (!cleaned.includes(candidate) && (/^[\p{L}]+$/u).test(candidate)) cleaned.push(candidate);
                    i++;
                }
                while (cleaned.length < target) {
                    const letters = Array.from({ length: 4 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
                    cleaned.push(('PAL' + letters).toUpperCase());
                }
                try {
                    const norm = [];
                    for (const t of cleaned) {
                        let chosen = t;
                        const shorter = cleaned.filter(s => s !== t && s.length >= 3 && t.startsWith(s));
                        if (shorter && shorter.length) {
                            shorter.sort((a, b) => b.length - a.length);
                            chosen = shorter[0];
                        } else {
                            for (let drop = 1; drop <= 4 && drop < t.length; drop++) {
                                const cand = t.slice(0, t.length - drop);
                                if (cand.length >= 3 && cleaned.includes(cand)) { chosen = cand; break; }
                            }
                        }
                        if (!norm.includes(chosen)) norm.push(chosen);
                    }
                    cleaned = norm;
                } catch (e) { }
                pools[k] = cleaned;
            });
        } catch (err) { }

        try { if (pools) { const enabled = (window.Settings && window.Settings.data && window.Settings.data.enabledPools) || null; if (enabled) { Object.keys(pools).forEach(pk => { if (!enabled[pk]) delete pools[pk]; }); } else { if (pools.hasOwnProperty('tech')) delete pools['tech']; } } } catch (e) { }
        try { this.offlineDict = this.offlineDict || {}; Object.keys(pools).forEach(themeKey => { if (String(themeKey).toLowerCase() === 'tech') return; (pools[themeKey] || []).forEach(w => { try { const key = String(w || '').toUpperCase(); if (!key) return; if (!(/^[\p{L}]+$/u).test(key)) return; try { const enabled = (window.Settings && window.Settings.data && window.Settings.data.enabledPools) || null; if (enabled && enabled[themeKey] === false) return; if (!this.offlineDict.hasOwnProperty(key)) { this.offlineDict[key] = `Palavra (${themeKey}): ${key}`; } } catch (e) { } } catch (e) { } }); }); } catch (e) { }

        let pool = [];
        if (theme === 'tudo') {
            Object.keys(pools).forEach(k => pool = pool.concat(pools[k] || []));
        } else {
            pool = Array.isArray(pools[theme]) ? pools[theme] : (Array.isArray(pools['animals']) ? pools['animals'] : []);
        }
        try {
            const raw = (pool || []).flatMap(item => {
                try {
                    const s = String(item || '').toUpperCase();
                    if (!s) return [];
                    const parts = s.match(/\p{L}+/gu) || [];
                    return parts.filter(p => p && p.length >= 2);
                } catch (e) { return []; }
            });
            pool = Array.from(new Set(raw)).filter(p => (/^[\p{L}]+$/u).test(p));
        } catch (e) { pool = []; }

        try {
            const sel = this.themeSelect;
            if (sel) {
                const current = sel.value;
                sel.innerHTML = '';
                const keys = Object.keys(pools || {});
                const optAll = document.createElement('option'); optAll.value = 'tudo'; optAll.text = 'Todos'; sel.appendChild(optAll);
                const wsLabels = { 'animals': 'Animais', 'food': 'Comida', 'sports': 'Esportes', 'nature': 'Natureza', 'tech': 'Tecnologia', 'fruits': 'Frutas', 'vegetables': 'Vegetais', 'objects': 'Objetos', 'flags': 'Bandeiras', 'transport': 'Transportes', 'music': 'Música', 'faces': 'Rostos', 'emoji': 'Emoji', 'colors': 'Cores', 'numbers': 'Números', 'letters': 'Letras', 'holiday': 'Feriados', 'classic-cards': 'Cartas Clássicas', 'animals-extended': 'Animais (extenso)', 'mix': 'Mix (Aleatório)' };
                keys.forEach(k => { const o = document.createElement('option'); o.value = k; o.text = wsLabels[k] || (String(k).charAt(0).toUpperCase() + String(k).slice(1)); sel.appendChild(o); });
                if (current && Array.from(sel.options).some(o => o.value === current)) sel.value = current;

                try {
                    const td = document.getElementById('ws-theme-display');
                    if (td) {
                        const key = (sel.value) ? String(sel.value) : (Object.keys(pools || {})[0] || 'Todos');
                        const wsLabels2 = { 'animals': 'Animais', 'food': 'Comida', 'sports': 'Esportes', 'nature': 'Natureza', 'tech': 'Tecnologia', 'fruits': 'Frutas', 'vegetables': 'Vegetais', 'objects': 'Objetos', 'flags': 'Bandeiras', 'transport': 'Transportes', 'music': 'Música', 'faces': 'Rostos', 'emoji': 'Emoji', 'colors': 'Cores', 'numbers': 'Números', 'letters': 'Letras', 'holiday': 'Feriados', 'classic-cards': 'Cartas Clássicas', 'animals-extended': 'Animais (extenso)', 'mix': 'Mix (Aleatório)' };
                        const label = wsLabels2[key] || (key.charAt(0).toUpperCase() + String(key).slice(1));
                        const emoji = '🔎';
                        const em = td.querySelector('.theme-emoji'); if (em) em.textContent = emoji;
                        const nm = td.querySelector('.theme-name'); if (nm) nm.textContent = label;
                    }
                } catch (e) { }
            }
        } catch (e) { }

        const levelSelect = document.getElementById('ws-level-select');
        const amount = levelSelect ? parseInt(levelSelect.value, 10) || 10 : 10;
        const chosen = [];
        const poolCopy = pool.slice();
        while (chosen.length < amount && poolCopy.length) { const idx = Math.floor(Math.random() * poolCopy.length); chosen.push(poolCopy.splice(idx, 1)[0]); }
        this.words = chosen;

        try {
            const longest = this.words.reduce((m, w) => Math.max(m, String(w || '').length), 0);
            let gridSize = 10;
            if (amount <= 6) gridSize = Math.max(8, longest + 4);
            else if (amount <= 8) gridSize = Math.max(9, longest + 4);
            else if (amount <= 10) gridSize = Math.max(11, longest + 4);
            else if (amount <= 12) gridSize = Math.max(12, longest + 4);
            else if (amount <= 16) gridSize = Math.max(13, longest + 5);
            else if (amount <= 20) gridSize = Math.max(16, longest + 5);
            else gridSize = Math.max(18, Math.ceil(Math.sqrt(amount * 3)));
            this.size = Math.min(24, gridSize);
        } catch (e) { }
        this.generateGrid();
        this.render();
    },
    generateGrid() {
        const n = this.size;
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const dirs = [[0, 1], [1, 0], [1, 1], [1, -1], [0, -1], [-1, 0], [-1, -1], [-1, 1]];

        const makeEmpty = () => ({ grid: Array.from({ length: n }, () => Array.from({ length: n }, () => '')), reserved: Array.from({ length: n }, () => Array.from({ length: n }, () => false)) });

        const poolSet = new Set(Object.keys(this.offlineDict || {}).map(k => String(k || '').toUpperCase()));
        const chosenSet = new Set((this.words || []).map(w => String(w || '').toUpperCase()));
        const maxPoolLen = Math.max(2, ...Array.from(poolSet).map(w => w.length));

        const canPlace = (grid, w, r, c, dr, dc) => { for (let i = 0; i < w.length; i++) { const rr = r + dr * i, cc = c + dc * i; if (rr < 0 || rr >= n || cc < 0 || cc >= n) return false; const ch = grid[rr][cc]; if (ch && ch !== w[i]) return false; } return true; };
        const placeWord = (grid, reserved, w, r, c, dr, dc) => { for (let i = 0; i < w.length; i++) { grid[r + dr * i][c + dc * i] = w[i]; reserved[r + dr * i][c + dc * i] = true; } };

        let attempts = 0;
        let final = null;
        outer: while (attempts < 6) {
            attempts++;
            const { grid, reserved } = makeEmpty();

            this.words.forEach(w => {
                const W = String(w || '').toUpperCase();
                let placed = false, tries = 0;
                while (!placed && tries < 300) { tries++; const dir = dirs[Math.floor(Math.random() * dirs.length)]; const r = Math.floor(Math.random() * n); const c = Math.floor(Math.random() * n); if (canPlace(grid, W, r, c, dir[0], dir[1])) { placeWord(grid, reserved, W, r, c, dir[0], dir[1]); placed = true; } }
            });

            for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (!grid[i][j]) grid[i][j] = letters[Math.floor(Math.random() * letters.length)];

            let changed = false;
            let sanitizeTries = 0;
            while (sanitizeTries < 1000) {
                sanitizeTries++;
                let foundExtraneous = false;
                for (let r = 0; r < n && !foundExtraneous; r++) {
                    for (let c = 0; c < n && !foundExtraneous; c++) {
                        for (const d of dirs) {
                            for (let L = 2; L <= maxPoolLen; L++) {
                                const rr = r + d[0] * (L - 1), cc = c + d[1] * (L - 1);
                                if (rr < 0 || rr >= n || cc < 0 || cc >= n) break;
                                let s = '';
                                for (let k = 0; k < L; k++) s += grid[r + d[0] * k][c + d[1] * k];
                                if (!s) continue;
                                const W = String(s || '').toUpperCase();
                                if (poolSet.has(W) && !chosenSet.has(W)) {
                                    const freeIdxs = [];
                                    for (let k = 0; k < L; k++) { if (!reserved[r + d[0] * k][c + d[1] * k]) freeIdxs.push(k); }
                                    if (freeIdxs.length === 0) {
                                        foundExtraneous = true;
                                        break;
                                    }
                                    const pick = freeIdxs[Math.floor(Math.random() * freeIdxs.length)];
                                    const rr2 = r + d[0] * pick, cc2 = c + d[1] * pick;
                                    const old = grid[rr2][cc2];
                                    let newch = old;
                                    let innerTries = 0;
                                    while (newch === old && innerTries < 12) { newch = letters[Math.floor(Math.random() * letters.length)]; innerTries++; }
                                    grid[rr2][cc2] = newch;
                                    changed = true;
                                    foundExtraneous = true;
                                    break;
                                }
                            }
                            if (foundExtraneous) break;
                        }
                    }
                }
                if (!foundExtraneous) break;
            }

            if (changed) {
                let any = false;
                for (let r = 0; r < n && !any; r++) {
                    for (let c = 0; c < n && !any; c++) {
                        for (const d of dirs) {
                            for (let L = 2; L <= maxPoolLen; L++) {
                                const rr = r + d[0] * (L - 1), cc = c + d[1] * (L - 1);
                                if (rr < 0 || rr >= n || cc < 0 || cc >= n) break;
                                let s = ''; for (let k = 0; k < L; k++) s += grid[r + d[0] * k][c + d[1] * k];
                                if (poolSet.has(s) && !chosenSet.has(s)) { any = true; break; }
                            }
                            if (any) break;
                        }
                    }
                }
                if (!any) { final = { grid, reserved }; break outer; }
            } else {
                final = { grid, reserved }; break outer;
            }
        }

        if (final) { this.grid = final.grid; } else { this.grid = makeEmpty().grid; }
    },
    render() {
        try {
            const board = this.boardEl = this.boardEl || document.getElementById('ws-board');
            const wordsContainer = this.wordsEl = this.wordsEl || document.getElementById('ws-words');
            if (!board) return;
            const n = this.size;
            board.innerHTML = '';
            board.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
            for (let r = 0; r < n; r++) {
                for (let c = 0; c < n; c++) {
                    const cell = document.createElement('div');
                    cell.className = 'ws-cell';
                    cell.style.userSelect = 'none';
                    cell.textContent = (this.grid && this.grid[r] && this.grid[r][c]) ? this.grid[r][c] : '';
                    cell.dataset.row = r; cell.dataset.col = c;
                    cell.style.display = 'flex'; cell.style.alignItems = 'center'; cell.style.justifyContent = 'center'; cell.style.padding = '6px';
                    cell.style.border = '1px solid rgba(255,255,255,0.03)';
                    cell.style.fontWeight = '700';
                    cell.style.cursor = 'pointer';
                    board.appendChild(cell);
                    cell.addEventListener('pointerenter', (e) => { try { this.onPointerEnter(e); } catch (err) { } });
                }
            }
            try { board.removeEventListener('pointerdown', this._boundBoardPointerDown); } catch (e) { }
            this._boundBoardPointerDown = this.onPointerDown.bind(this);
            board.addEventListener('pointerdown', this._boundBoardPointerDown);

            if (wordsContainer) {
                wordsContainer.innerHTML = '';
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
                    el.addEventListener('click', () => { try { const now = el.classList.toggle('found'); if (now) { el.classList.remove('obscured'); } else { const container = document.getElementById('ws-words'); if (container && !container.classList.contains('revealed') && !container.classList.contains('sheet')) el.classList.add('obscured'); } } catch (e) { } });
                    try { const pref = (window.Settings && window.Settings.data && typeof window.Settings.data.wsShowWords !== 'undefined') ? !!window.Settings.data.wsShowWords : (JSON.parse(localStorage.getItem('mg_ws_show_words') || 'false')); if (!pref) el.classList.add('obscured'); } catch (e) { }
                    row.appendChild(el);
                });
                wordsContainer.appendChild(row);

                const updateScrollable = () => {
                    try {
                        const r = wordsContainer.querySelector('.ws-row');
                        if (!r) { wordsContainer.classList.remove('scrollable'); return; }
                        const isScrollable = r.scrollWidth > (r.clientWidth + 2);
                        if (isScrollable) wordsContainer.classList.add('scrollable'); else wordsContainer.classList.remove('scrollable');
                    } catch (e) { }
                };

                try {
                    if (!this._wordsMO) {
                        this._wordsMO = new MutationObserver(() => { updateScrollable(); });
                        this._wordsMO.observe(wordsContainer, { childList: true, subtree: true });
                        window.addEventListener('resize', () => { try { updateScrollable(); } catch (e) { } });
                    }
                } catch (e) { }

                try {
                    const pref = (window.Settings && window.Settings.data && typeof window.Settings.data.wsShowWords !== 'undefined') ? !!window.Settings.data.wsShowWords : (JSON.parse(localStorage.getItem('mg_ws_show_words') || 'false'));
                    if (pref) { wordsContainer.classList.add('revealed'); try { Array.from(wordsContainer.querySelectorAll('.ws-word')).forEach(it => it.classList.remove('obscured')); } catch (e) { } } else { wordsContainer.classList.remove('revealed'); try { Array.from(wordsContainer.querySelectorAll('.ws-word')).forEach(it => { if (!it.classList.contains('found')) it.classList.add('obscured'); }); } catch (e) { } }
                    try { wordsContainer.classList.remove('hidden'); wordsContainer.style.display = ''; } catch (e) { }
                    try { const tbtn = document.getElementById('ws-toggle-words'); if (tbtn) tbtn.textContent = pref ? 'Ocultar palavras' : 'Mostrar palavras'; } catch (e) { }
                } catch (e) { }

                try { updateScrollable(); } catch (e) { }
            }
            try { if (!this.overlayEl) this.overlayEl = document.getElementById('ws-overlay'); } catch (e) { }
        } catch (e) { console.error('[WordSearch] render error', e); }
    },
    onPointerDown(e) {
        if (!e.target.classList.contains('ws-cell')) return; this.selecting = true; this.selected = [e.target]; e.target.classList.add('selected'); try {
            try { if (e && e.pointerId && e.target && e.target.setPointerCapture) { e.target.setPointerCapture(e.pointerId); this._capturedPointerId = e.pointerId; this._capturedEl = e.target; } } catch (__) { }
            this._boundBoardPointerMove = this._onBoardPointerMove.bind(this); this.boardEl.addEventListener('pointermove', this._boundBoardPointerMove); this._boundDocPointerUp = this._onDocumentPointerUp.bind(this); document.addEventListener('pointerup', this._boundDocPointerUp); document.addEventListener('pointercancel', this._boundDocPointerUp);
        } catch (err) { } try { if (!this.polyline && this.overlayEl) { const ns = 'http://www.w3.org/2000/svg'; const poly = document.createElementNS(ns, 'polyline'); poly.setAttribute('fill', 'none'); poly.setAttribute('stroke', 'rgba(0,204,153,0.85)'); poly.setAttribute('stroke-width', '8'); poly.setAttribute('stroke-linecap', 'round'); poly.setAttribute('stroke-linejoin', 'round'); poly.setAttribute('pointer-events', 'none'); poly.setAttribute('class', 'ws-polyline'); this.overlayEl.appendChild(poly); this.polyline = poly; } if (this.polyline) { this.points = []; this._addPointForCell(e.target); this._updatePolyline(); this.polyline.style.display = ''; } } catch (e) { }
    },
    onPointerEnter(e) { if (this.selecting && e.target.classList.contains('ws-cell') && !this.selected.includes(e.target)) { this.selected.push(e.target); e.target.classList.add('selected'); if (this.polyline) { this._addPointForCell(e.target); this._updatePolyline(); } } },
    onPointerUp(e) {
        if (!this.selecting) return;
        this.selecting = false;
        const word = this.selected.map(s => s.textContent).join('');
        const rev = word.split('').reverse().join('');
        const found = this.words.find(w => w === word || w === rev);

        if (found) {
            this.selected.forEach(s => { s.classList.remove('selected'); s.classList.add('found'); });
            const list = this.wordsEl ? Array.from(this.wordsEl.querySelectorAll('.ws-word')).find(x => x.dataset && x.dataset.word === found) : null;
            if (list) {
                list.style.textDecoration = 'line-through';
                list.classList.add('found');
                try { list.classList.remove('obscured'); } catch (e) { }
                list.dataset.showing = 'name';
                list.textContent = found;
            }
            if (this.polyline) {
                try { this.polyline.setAttribute('stroke', 'rgba(255,200,60,0.95)'); } catch (e) { }
                const poly = this.polyline;
                setTimeout(() => {
                    try {
                        if (poly && this.overlayEl && this.overlayEl.contains(poly)) {
                            this.overlayEl.removeChild(poly);
                        }
                        if (this.overlayEl) this.overlayEl.innerHTML = '';
                        setTimeout(() => {
                            if (this.overlayEl) this.overlayEl.innerHTML = '';
                        }, 120);
                    } catch (e) { }
                }, 600);
                try {
                    const total = this.words ? this.words.length : 0;
                    const foundCount = (this.wordsEl) ? (this.wordsEl.querySelectorAll('.ws-word.found') || []).length : 0;
                    if (total > 0 && foundCount >= total) {
                        try { playSound('win'); } catch (e) { }
                        try { if (!window.Settings || window.Settings.data.confetti) { Confetti.fire(); } } catch (e) { }
                        setTimeout(() => { try { alert('Parabéns — você encontrou todas as palavras!'); } catch (e) { } }, 300);
                    }
                } catch (e) { }
            }
        } else {
            this.selected.forEach(s => s.classList.remove('selected'));
            try {
                if (this.polyline && this.overlayEl) {
                    if (this.overlayEl.contains(this.polyline)) this.overlayEl.removeChild(this.polyline);
                }
            } catch (e) { }
            try { if (this.overlayEl) this.overlayEl.innerHTML = ''; } catch (e) { }
            setTimeout(() => {
                try { if (this.overlayEl) this.overlayEl.innerHTML = ''; } catch (e) { }
            }, 120);
        }

        try { if (this._boundBoardPointerMove) this.boardEl.removeEventListener('pointermove', this._boundBoardPointerMove); } catch (err) { }
        try { if (this._boundDocPointerUp) { document.removeEventListener('pointerup', this._boundDocPointerUp); document.removeEventListener('pointercancel', this._boundDocPointerUp); } } catch (err) { }

        this.polyline = null;
        this.selected = [];
    },
    _addPointForCell(cell) { try { const rect = cell.getBoundingClientRect(); const boardRect = this.boardEl.getBoundingClientRect(); const cx = rect.left - boardRect.left + rect.width / 2; const cy = rect.top - boardRect.top + rect.height / 2; this.points = this.points || []; const last = this.points.length ? this.points[this.points.length - 1] : null; if (!last || Math.hypot(last.x - cx, last.y - cy) > 4) this.points.push({ x: cx, y: cy }); } catch (e) { } },
    _updatePolyline() { if (!this.polyline) return; const pts = (this.points || []).map(p => `${p.x},${p.y}`).join(' '); this.polyline.setAttribute('points', pts); try { this.polyline.removeAttribute('stroke-dasharray'); this.polyline.removeAttribute('stroke-dashoffset'); } catch (e) { } },
    _onBoardPointerMove(e) {
        try {
            const els = document.elementsFromPoint ? document.elementsFromPoint(e.clientX, e.clientY) : [document.elementFromPoint(e.clientX, e.clientY)]; if (!els || !els.length) {
                const probes = [[-12, 0], [12, 0], [0, -12], [0, 12], [-8, -8], [8, 8], [-8, 8], [8, -8]];
                let found = null;
                for (let p = 0; p < probes.length && !found; p++) { try { const dx = probes[p][0], dy = probes[p][1]; const els2 = document.elementsFromPoint ? document.elementsFromPoint(e.clientX + dx, e.clientY + dy) : [document.elementFromPoint(e.clientX + dx, e.clientY + dy)]; if (!els2 || !els2.length) continue; for (let j = 0; j < els2.length; j++) { if (els2[j] && els2[j].classList && els2[j].classList.contains('ws-cell')) { found = els2[j]; break; } } } catch (__) { } }
                if (!found) return; var el = found;
            } else {
                let el = null; for (let i = 0; i < els.length; i++) { if (els[i] && els[i].classList && els[i].classList.contains('ws-cell')) { el = els[i]; break; } }
                if (!el) {
                    const probes = [[-12, 0], [12, 0], [0, -12], [0, 12], [-8, -8], [8, 8], [-8, 8], [8, -8]];
                    for (let p = 0; p < probes.length; p++) { try { const dx = probes[p][0], dy = probes[p][1]; const els2 = document.elementsFromPoint ? document.elementsFromPoint(e.clientX + dx, e.clientY + dy) : [document.elementFromPoint(e.clientX + dx, e.clientY + dy)]; if (!els2 || !els2.length) continue; for (let j = 0; j < els2.length; j++) { if (els2[j] && els2[j].classList && els2[j].classList.contains('ws-cell')) { el = els2[j]; break; } } } catch (__) { } if (el) break; }
                    if (!el) return;
                }
                if (!this.selected.includes(el)) { this.selected.push(el); el.classList.add('selected'); if (this.polyline) { this._addPointForCell(el); this._updatePolyline(); } }
                return;
            }
            try { if (found && !this.selected.includes(found)) { this.selected.push(found); found.classList.add('selected'); if (this.polyline) { this._addPointForCell(found); this._updatePolyline(); } } } catch (err) { }
        } catch (err) { }
    },
    _onDocumentPointerUp(e) {
        try { this.onPointerUp(e); } catch (err) { } try {
            try { if (this._capturedEl && this._capturedPointerId && this._capturedEl.releasePointerCapture) { this._capturedEl.releasePointerCapture(this._capturedPointerId); } } catch (__) { }
            this._capturedEl = null; this._capturedPointerId = null;
        } catch (__) { }
    },
};
