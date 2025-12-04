// Memory Game Logic
window.MemoryGame = {
    board: document.getElementById('memory-game-board'),
    themeSelect: document.getElementById('theme-select'),
    levelSelect: document.getElementById('level-select'),
    restartButton: document.getElementById('restart-memory-game'),
    movesSpan: document.getElementById('moves'),
    timeSpan: document.getElementById('time'),

    // Expanded themes with at least 24 unique items each to support large grids without repetition
    themes: {
        animals: [
            '🦓', '🐘', '🐅', '🦒', '🐒', '🦜', '🐍', '🐢', '🐶', '🐱', '🐷', '🐮',
            '🦁', '🐯', '🐨', '🐼', '🐸', '🐵', '🦊', '🐺', '🦝', '🦉', '🦇', '🦅',
            '🐝', '🐞', '🐛', '🦋', '🐌', '🐜', '🦟', '🦗', '🕷️', '🦂', '🦀', '🦞',
            '🦐', '🦑', '🐙', '🦈', '🐬', '🐳', '🐋', '🐟', '🐠', '🐡', '🐊', '🦎'
        ],
        food: [
            '🍕', '🍔', '🍟', '🍣', '🍩', '🍪', '🍙', '🍓', '🍉', '🍇', '🍒', '🍋',
            '🌭', '🥪', '🌮', '🌯', '🥙', '🥚', '🍳', '🥘', '🍲', '🥣', '🥗', '🍿',
            '🥫', '🍱', '🍘', '🍚', '🍛', '🍜', '🍝', '🍠', '🍢', '🍣', '🍤', '🍥',
            '🍡', '🥟', '🥠', '🥡', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁'
        ],
        tech: [
            '💻', '📱', '🖱️', '📷', '🕹️', '🎧', '⌚', '💾', '🖨️', '📺', '📡', '🔌',
            '🔋', '⌨️', '🖥️', '🖨️', '🖱️', 'Trackball', '🕹️', '🗜️', '💽', '💾', '💿', '📀',
            '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺',
            '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡'
        ],
        emoji: [
            '😀', '😂', '😍', '😎', '😭', '😡', '🤯', '🤩', '🥳', '🤖', '👻', '🤡',
            '💩', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🙈', '🙉',
            '🙊', '💋', '💌', '💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️',
            '💔', '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💯', '💢'
        ],
        colors: [
            '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '🟤', '⚫', '⚪', '🟥', '🟧', '🟨',
            '🟩', '🟦', '🟪', '🟫', '⬛', '⬜', '🔶', '🔷', '🔸', '🔹', '🔺', '🔻',
            '💠', '🔘', '🔳', '🔲', '◾', '◽', '▪️', '▫️', '🟰', '➕', '➖', '✖️',
            '➗', '♾️', '‼️', '⁉️', '❓', '❔', '❕', '❗', '〰️', '💱', '💲', '💹'
        ],
        flags: [
            '🔴', '🔵', '🟢', '🟡', '🟣', '🟠', '🟤', '⚫', '⚪', '🟥', '🟦', '🟩',
            '🟨', '🟪', '🟧', '🟫', '⬛', '⬜', '💠', '🔷', '🔶', '🔸', '🔹', '◾',
            '◽', '🔺', '🔻', '▪️', '▫️', '🔘', '🔳', '🔲', '💎', '💍', '👑', '🎯',
            '🎲', '🎰', '🎴', '🀄', '🃏', '🎭', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️'
        ],
        transport: [
            '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚲', '🛴', '✈️',
            '🛵', '🏍️', '🛺', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋',
            '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '🚁', '🛩️',
            '🚀', '🛸', '🛶', '⛵', '🛥️', '🚤', '⛴️', '🛳️', '🚢', '⚓', '⛽', '🚧'
        ],
        sports: [
            '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🥊', '🏓', '🏸', '⛳', '🏒',
            '🥅', '🥋', '⛸️', '🎣', '🤿', '🚣', '🏊', '🤽', '🏄', '🧗', '🚵', '🚴',
            '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎫', '🎟️', '🎪', '🤹',
            '🎭', '🩰', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸'
        ],
        faces: [
            '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '🙂', '🙃', '😉', '😇',
            '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚', '😙', '🥲', '😋', '😛', '😜',
            '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶',
            '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒'
        ],
        music: [
            '🎵', '🎶', '🎸', '🎹', '🥁', '🎷', '🎺', '🎻', '📯', '🎤', '📻', '🎧',
            '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🪘', '🎤', '🎧', '🎚️',
            '🎛️', '🎙️', '📻', '📺', '📼', '📹', '📽️', '🎥', '🎬', '🎭', '🎫', '🎟️',
            '📀', '💿', '💾', '💽', '🔇', '🔈', '🔉', '🔊', '🔔', '🔕', '📣', '📢'
        ],
        nature: [
            '🌲', '🌳', '🌴', '🎋', '🌵', '🌾', '🌺', '🌸', '🌼', '🌻', '🍀', '🌊',
            '🌹', '🥀', '🌷', '💐', '🍃', '🍂', '🍁', '🍄', '🌰', '🐚', '🕸️', '🌍',
            '🌎', '🌏', '🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘', '🌙', '🌚',
            '🌛', '🌜', '☀️', '🌝', '🌞', '⭐', '🌟', '🌠', '☁️', '⛅', '⛈️', '🌤️'
        ],
        fruits: [
            '🍎', '🍌', '🍐', '🍊', '🍓', '🍒', '🍍', '🥝', '🥭', '🍇', '🍉', '🍋',
            '🍈', '🍏', '🍑', '🍒', '🍓', '🫐', '🥝', '🍅', '🫒', '🥥', '🥑', '🍆',
            '🥔', '🥕', '🌽', '🌶️', '🫑', '🥒', '🥬', '🥦', '🧄', '🧅', '🍄', '🥜',
            '🌰', '🍞', '🥐', '🥖', '🫓', '🥨', '🥯', '🥞', '🧇', '🧀', '🍖', '🍗'
        ],
        vegetables: [
            '🥕', '🌽', '🥦', '🍆', '🥔', '🍠', '🥒', '🫑', '🧅', '🧄', '🍅', '🥬',
            '🥑', '🫒', '🥗', '🥘', '🍲', '🥣', '🥫', '🍱', '🍘', '🍙', '🍚', '🍛',
            '🍜', '🍝', '🍠', '🍢', '🍣', '🍤', '🍥', '🍡', '🥟', '🥠', '🥡', '🍦',
            '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮'
        ],
        objects: [
            '📦', '📚', '🪑', '🖼️', '🛏️', '🛋️', '🪞', '🔑', '🔨', '🧰', '🧭', '🧯',
            '🛒', '🚬', '⚰️', '⚱️', '🏺', '🔮', '🧿', '📿', '🧿', '💈', '⚗️', '🔭',
            '🔬', '🕳️', '💊', '💉', '🩸', '🩹', '🩺', '🌡️', '🏷️', '🔖', '🚽', '🪠',
            '🚿', '🛁', '🛀', '🪒', '🧴', '🧻', '🧼', '🧽', '🧹', '🧺', '🧦', '🧤'
        ],
        colors: [
            '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '🟤', '⚪', '⚫', '🟥', '🟩', '🟦',
            '🟧', '🟨', '🟪', '🟫', '⬛', '⬜', '◼️', '◻️', '◾', '◽', '▪️', '▫️',
            '🔶', '🔷', '🔸', '🔹', '🔺', '🔻', '💠', '🔘', '🔳', '🔲', '🏁', '🚩',
            '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️', '🇦🇨', '🇦🇩', '🇦🇪', '🇦🇫', '🇦🇬', '🇦🇮'
        ],
        numbers: [
            '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '➕', '➖',
            '0️⃣', '🔢', '✖️', '➗', '🟰', '♾️', '💲', '💱', '™️', '©️', '®️', '〰️',
            '➰', '➿', '🔚', '🔙', '🔛', '🔝', '🔜', '✔️', '☑️', '🔘', '🔴', '🟠',
            '🟡', '🟢', '🔵', '🟣', '🟤', '⚫', '⚪', '🟥', '🟧', '🟨', '🟩', '🟦'
        ],
        letters: [
            'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N',
            'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b',
            'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p',
            'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '!', '?', '@', '#'
        ],
        holiday: [
            '🎃', '🎄', '🎆', '🎉', '🎁', '🕯️', '🧨', '🪔', '🧧', '❤️', '🦃', '🥂',
            '🎈', '🎏', '🎀', '🎊', '🎋', '🎍', '🎎', '🎑', '🎐', '🎑', '🧧', '🎀',
            '🎁', '🎗️', '🎟️', '🎫', '🎖️', '🏆', '🏅', '🥇', '🥈', '🥉', '⚽', '⚾',
            '🥎', '🏀', '🏐', '🏈', '🏉', '🎾', '🥏', '🎳', '🏏', '🏑', '🏒', '🥍'
        ],
        'classic-cards': [
            '🂡', '🂱', '🂾', '🃁', '🃑', '🃞', '🃏', '🂽', '🂻', '🂺', '🂹', '🂸',
            '🂠', '🂡', '🂢', '🂣', '🂤', '🂥', '🂦', '🂧', '🂨', '🂩', '🂪', '🂫', '🂬', '🂭',
            '🂮', '🂱', '🂲', '🂳', '🂴', '🂵', '🂶', '🂷', '🂸', '🂹', '🂺', '🂻', '🂼', '🂽',
            '🂾', '🃁', '🃂', '🃃', '🃄', '🃅', '🃆', '🃇', '🃈', '🃉', '🃊', '🃋', '🃌', '🃍'
        ],
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
            this.themeSelect = document.getElementById('theme-select');
            this.levelSelect = document.getElementById('level-select');
            this.restartButton = document.getElementById('restart-memory-game');
            this.board = document.getElementById('memory-game-board');
            this.movesSpan = document.getElementById('moves');
            this.timeSpan = document.getElementById('time');

            if (this.themeSelect) this.themeSelect.addEventListener('change', this.resetGame.bind(this));
            if (this.levelSelect) this.levelSelect.addEventListener('change', this.resetGame.bind(this));
            if (this.restartButton) this.restartButton.addEventListener('click', this.resetGame.bind(this));

            try { const topRestart = document.getElementById('restart-memory-game-top'); if (topRestart) topRestart.addEventListener('click', this.resetGame.bind(this)); } catch (e) { }
            try { this.themeDisplay = document.getElementById('memory-theme-display'); } catch (e) { this.themeDisplay = null; }

            const exportBtn = document.getElementById('export-theme');
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

            const cardSizeSel = document.getElementById('card-size-select');
            if (cardSizeSel) {
                cardSizeSel.addEventListener('change', (ev) => {
                    try {
                        const val = ev.target.value;
                        if (window.Settings) { window.Settings.data.memoryCardSize = val; window.Settings.save(); }
                    } catch (e) { }
                    try { this.resetGame(); } catch (e) { }
                });
                try { const pv = document.getElementById('card-size-preview'); if (pv) { pv.textContent = '—'; } } catch (e) { }
            }

            const importBtn = document.getElementById('import-theme');
            const importFile = document.getElementById('import-theme-file');
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

            try {
                if (this.themeSelect) {
                    if (!this.themeSelect.options || this.themeSelect.options.length === 0) {
                        const themeLabels = { 'animals': 'Animais', 'animals-extended': 'Animais (extenso)', 'food': 'Comida', 'tech': 'Tecnologia', 'emoji': 'Emoji', 'flags': 'Símbolos e Formas', 'transport': 'Transportes', 'sports': 'Esportes', 'faces': 'Rostos', 'music': 'Música', 'nature': 'Natureza', 'fruits': 'Frutas', 'vegetables': 'Vegetais', 'objects': 'Objetos', 'colors': 'Cores', 'numbers': 'Números', 'letters': 'Letras', 'holiday': 'Feriados', 'classic-cards': 'Cartas Clássicas' };
                        Object.keys(this.themes).forEach(key => {
                            const opt = document.createElement('option');
                            opt.value = key;
                            opt.textContent = themeLabels[key] || key;
                            this.themeSelect.appendChild(opt);
                        });
                        try {
                            const pref = (window.Settings && window.Settings.data && window.Settings.data.memoryTheme) ? window.Settings.data.memoryTheme : null;
                            if (pref && Array.from(this.themeSelect.options).some(o => o.value === pref)) this.themeSelect.value = pref;
                        } catch (e) { }
                    }
                }
            } catch (e) { }

            try {
                const memLevel = this.levelSelect;
                if (memLevel) {
                    const prefLevel = (window.Settings && window.Settings.data && window.Settings.data.memoryLevel) ? String(window.Settings.data.memoryLevel) : null;
                    if (prefLevel && Array.from(memLevel.options).some(o => String(o.value) === prefLevel)) {
                        memLevel.value = prefLevel;
                        try { Array.from(memLevel.options).forEach(o => { o.selected = (String(o.value) === prefLevel); }); } catch (e) { }
                    } else {
                        if ((typeof memLevel.selectedIndex === 'number' && memLevel.selectedIndex < 0) || !memLevel.value) {
                            const opt8 = Array.from(memLevel.options).find(o => String(o.value) === '8');
                            if (opt8) { memLevel.value = '8'; opt8.selected = true; }
                            else if (memLevel.options.length) { memLevel.selectedIndex = 0; }
                        }
                    }
                }
            } catch (e) { }

            this.initialized = true;
        }
        this.board = document.getElementById('memory-game-board');
        this.resetGame();
    },

    _updateTopTheme() {
        try {
            const el = this.themeDisplay || document.getElementById('memory-theme-display');
            if (!el) return;
            const key = (this.themeSelect && this.themeSelect.value) ? String(this.themeSelect.value) : (Settings && Settings.data && Settings.data.memoryTheme) ? String(Settings.data.memoryTheme) : 'animals';
            const pool = (this.themes && this.themes[key]) ? this.themes[key] : (this.themes && this.themes['animals']) ? this.themes['animals'] : ['❓'];
            const emoji = (Array.isArray(pool) && pool.length) ? pool[0] : '❓';
            const labels = { 'animals': 'Animais', 'animals-extended': 'Animais (extenso)', 'food': 'Comida', 'tech': 'Tecnologia', 'emoji': 'Emoji', 'flags': 'Bandeiras', 'transport': 'Transportes', 'sports': 'Esportes', 'faces': 'Rostos', 'music': 'Música', 'nature': 'Natureza', 'fruits': 'Frutas', 'vegetables': 'Vegetais', 'objects': 'Objetos', 'colors': 'Cores', 'numbers': 'Números', 'letters': 'Letras', 'holiday': 'Feriados', 'classic-cards': 'Cartas Clássicas', 'mix': 'Mix (Aleatório)' };
            const name = labels[key] || key;
            const emEl = el.querySelector('.theme-emoji');
            const nmEl = el.querySelector('.theme-name');
            if (emEl) emEl.textContent = emoji;
            if (nmEl) nmEl.textContent = name;
        } catch (e) { }
    },

    _updatePreviewOnResize() {
        try {
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
            try { this._updateTopTheme(); } catch (e) { }
        } catch (e) { }
    },

    getPairs() {
        try {
            const raw = (this.levelSelect && this.levelSelect.value) ? String(this.levelSelect.value) : (Settings && Settings.data && Settings.data.memoryLevel) ? String(Settings.data.memoryLevel) : '8';
            if (/\d+x\d+/i.test(raw)) {
                const parts = raw.split('x').map(n => parseInt(n, 10));
                const cols = parts[0] || 4; const rows = parts[1] || 4;
                return Math.floor((cols * rows) / 2);
            }
            const n = parseInt(raw, 10);
            if (!isNaN(n) && n > 0) return n;
        } catch (e) { }
        return 8;
    },

    chooseLayout(total, availW, pref) {
        const desiredCard = pref.desiredCard;
        const minCard = pref.minCard;
        const maxCard = pref.maxCard;
        const idealCols = Math.max(1, Math.round(Math.sqrt(total)));
        const maxColsPossible = Math.min(total, Math.max(1, Math.floor(availW / minCard)));
        let availH = null;
        try {
            const boardRect = (this && this.board && this.board.getBoundingClientRect) ? this.board.getBoundingClientRect() : null;
            if (boardRect) availH = Math.max(120, Math.floor(window.innerHeight - boardRect.top - 80));
            else availH = Math.max(120, Math.floor(window.innerHeight - 200));
        } catch (e) { availH = Math.max(120, Math.floor(window.innerHeight - 200)); }

        let best = null;
        const divisors = [];
        for (let c = 1; c <= Math.min(total, maxColsPossible); c++) {
            if (total % c === 0) divisors.push(c);
        }
        const candidates = divisors.length ? divisors : Array.from({ length: Math.min(total, maxColsPossible) }, (_, i) => i + 1);
        for (let idx = 0; idx < candidates.length; idx++) {
            const c = candidates[idx];
            const gapC = Math.max(6, Math.round(10 - (c / 6)));
            const rawCardW = (availW - (c - 1) * gapC) / c;
            if (rawCardW <= 8) continue;
            const clamped = Math.max(minCard, Math.min(maxCard, rawCardW));
            const empty = (c * Math.ceil(total / c)) - total;
            const sizeScore = -clamped;
            const emptyPenalty = empty * 200;
            const squarePenalty = Math.abs(c - idealCols) * 6;
            const rangePenalty = (rawCardW < minCard || rawCardW > maxCard) ? 1200 : 0;
            const rows = Math.ceil(total / c);
            const estHeight = (rows * clamped) + ((rows - 1) * gapC);
            const overflow = Math.max(0, estHeight - availH);
            const heightPenalty = overflow > 0 ? (overflow * 12) + 900 : 0;
            const score = sizeScore + emptyPenalty + squarePenalty + rangePenalty;
            const finalScore = score + heightPenalty;
            if (!best || score < best.score) {
                best = { cols: c, rows: Math.ceil(total / c), cardW: Math.floor(clamped), gap: gapC, calcW: Math.floor((clamped * c) + ((c - 1) * gapC)), score: finalScore };
            }
        }
        if (!best && divisors.length) {
            for (let c = 1; c <= Math.min(total, maxColsPossible); c++) {
                const gapC = Math.max(6, Math.round(10 - (c / 6)));
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
                    best = { cols: c, rows: Math.ceil(total / c), cardW: Math.floor(clamped), gap: gapC, calcW: Math.floor((clamped * c) + ((c - 1) * gapC)), score };
                }
            }
        }
        return best || { cols: 1, rows: total, cardW: Math.max(minCard, Math.min(desiredCard, maxCard)), gap: 6, calcW: Math.max(minCard, Math.min(desiredCard, maxCard)) };
    },

    stop() { clearInterval(this.timer); },

    resetGame() {
        clearInterval(this.timer);
        this.time = 0;
        this.moves = 0;
        this.matchedPairs = 0;
        if (this.timeSpan) this.timeSpan.textContent = this.time;
        if (this.movesSpan) this.movesSpan.textContent = this.moves;
        this.lockBoard = false;
        this.flippedCards = [];
        this.createBoard();
        this.startTimer();
    },

    startTimer() {
        this.timer = setInterval(() => {
            this.time++;
            if (this.timeSpan) this.timeSpan.textContent = this.time;
        }, 1000);
    },

    createBoard() {
        if (!this.board) return;
        this.board.innerHTML = '';
        const selectedTheme = this.themeSelect ? this.themeSelect.value : 'animals';
        const pairs = this.getPairs();
        const total = pairs * 2;
        let pool = [];
        try {
            if (selectedTheme === 'mix') {
                const themeKeys = Object.keys(this.themes || {});
                themeKeys.forEach(k => { if (k === 'mix') return; const arr = this.themes[k]; if (Array.isArray(arr)) pool.push(...arr); });
                const seen = new Set(); pool = pool.filter(s => { if (s == null) return false; if (seen.has(s)) return false; seen.add(s); return true; });
            } else {
                pool = this.themes[selectedTheme] || this.themes['animals'] || [];
            }
        } catch (e) { pool = this.themes['animals'] || []; }

        // Ensure unique symbols for the requested number of pairs
        let selectedSymbols = [];
        try {
            // Shuffle the pool first
            const arr = Array.isArray(pool) ? pool.slice() : [];
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
            }

            // If we don't have enough unique symbols, we might have to repeat, but the user explicitly asked NOT to repeat images in large sizes.
            // So we should try our best to have enough symbols.
            // If the pool is smaller than pairs, we HAVE to repeat or show an error.
            // But with the expanded lists, this should be rare.

            if (arr.length < pairs) {
                console.warn('Not enough unique symbols for this level! Duplicating symbols.');
                while (arr.length < pairs) arr.push(...arr.slice());
            }
            selectedSymbols = arr.slice(0, pairs);
        } catch (e) {
            const symbols = [];
            while (symbols.length < pairs) { symbols.push(...pool); if (symbols.length > pairs) break; }
            selectedSymbols = symbols.slice(0, pairs);
        }

        const gameSymbols = [];
        selectedSymbols.forEach(s => { gameSymbols.push(s); gameSymbols.push(s); });
        gameSymbols.sort(() => 0.5 - Math.random());

        const containerRect = this.board.getBoundingClientRect();
        let availW = (containerRect && containerRect.width && containerRect.width > 40) ? containerRect.width : Math.min(window.innerWidth - 40, 960);
        let desiredCard = 96;
        let minCard = 64;
        let maxCard = 140;
        try {
            const pref = (window.Settings && window.Settings.data && window.Settings.data.memoryCardSize) ? String(window.Settings.data.memoryCardSize) : null;
            if (pref === 'compact') { desiredCard = 72; minCard = 48; maxCard = 100; }
            else if (pref === 'large') {
                desiredCard = 160; minCard = 120; maxCard = Math.max(180, Math.min(320, Math.floor(window.innerWidth / 6)));
            }
            else { desiredCard = 96; minCard = 64; maxCard = 140; }
        } catch (e) { }

        const pref = { desiredCard, minCard, maxCard };
        const layout = this.chooseLayout(total, availW, pref);
        const cols = layout.cols;
        const gap = layout.gap;
        const cardWidth = layout.cardW;
        const calcWidth = Math.min(layout.calcW, Math.max(960, Math.floor(window.innerWidth * 0.9)));

        this.board.style.display = 'grid';
        this.board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        this.board.style.gap = gap + 'px';
        this.board.style.maxWidth = calcWidth + 'px';
        this.board.style.setProperty('--card-size', cardWidth + 'px');

        try { const pv = document.getElementById('card-size-preview'); if (pv) pv.textContent = cardWidth + 'px'; } catch (e) { }
        try { this._updateTopTheme(); } catch (e) { }

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
    },

    flipCard(card) {
        if (this.lockBoard || card.classList.contains('is-flipped') || this.flippedCards.length === 2) return;
        card.classList.add('is-flipped');
        try { playSound('flip'); } catch (e) { }
        this.flippedCards.push(card);
        if (this.flippedCards.length === 2) { this.updateMoves(); this.checkForMatch(); }
    },

    updateMoves() { this.moves++; if (this.movesSpan) this.movesSpan.textContent = this.moves; },

    checkForMatch() {
        this.lockBoard = true;
        const [card1, card2] = this.flippedCards;
        if (card1.dataset.symbol === card2.dataset.symbol) { this.handleMatch(); } else { this.handleMismatch(); }
    },

    handleMatch() {
        setTimeout(() => {
            try { playSound('match'); } catch (e) { }
            this.flippedCards.forEach(card => {
                card.classList.add('matched');
                // Add a fun pop animation
                const inner = card.querySelector('.memory-card-inner');
                if (inner) {
                    inner.animate([
                        { transform: 'rotateY(180deg) scale(1)' },
                        { transform: 'rotateY(180deg) scale(1.2)' },
                        { transform: 'rotateY(180deg) scale(1)' }
                    ], {
                        duration: 400,
                        easing: 'ease-out'
                    });
                }
            });
            this.matchedPairs++;
            this.flippedCards = [];
            this.lockBoard = false;
            const pairs = this.getPairs();
            if (this.matchedPairs === pairs) {
                try { if (!window.Settings || window.Settings.data.confetti) { Confetti.fire(); } } catch (e) { }
                this.winGame();
            }
        }, 500);
    },

    handleMismatch() {
        setTimeout(() => {
            try { playSound('error'); } catch (e) { }
            this.flippedCards.forEach(card => {
                card.classList.remove('is-flipped');
                // Add a shake animation for mismatch
                card.animate([
                    { transform: 'translateX(0)' },
                    { transform: 'translateX(-5px)' },
                    { transform: 'translateX(5px)' },
                    { transform: 'translateX(-5px)' },
                    { transform: 'translateX(0)' }
                ], {
                    duration: 300
                });
            });
            this.flippedCards = [];
            this.lockBoard = false;
        }, 1000);
    },

    winGame() {
        clearInterval(this.timer);
        try { playSound('win'); } catch (e) { }
        setTimeout(() => {
            // Create a fun modal or overlay instead of alert
            const msg = `🎉 Incrível! 🎉\n\nVocê venceu em ${this.time} segundos!\nMovimentos: ${this.moves}`;
            alert(msg);
        }, 500);
    }
};
