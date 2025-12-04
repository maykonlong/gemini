document.addEventListener('DOMContentLoaded', () => {
    try { console.info('[main.js] loaded'); } catch (e) { }

    // 1. Initialize Core Modules
    if (window.SoundEngine) window.SoundEngine.init();
    if (window.Settings) {
        window.Settings.init();
        window.Settings.applyToGames();
        try { setSoundEnabled(window.Settings.data.enableSound); } catch (e) { }
    }

    // 2. Setup Icons and Labels (DOM Manipulation)
    (function () {
        try {
            const icons = {
                memory: '🧠',
                wordsearch: '🔎',
                '2048': '2️⃣',
                sudoku: '🔢',
                hangman: '🪢',
                chess: '♟️'
            };
            const cards = Array.from(document.querySelectorAll('.game-card'));
            cards.forEach(c => {
                try {
                    const g = c.dataset.game;
                    const ic = icons[g] || '🎮';
                    if (!c.querySelector('.game-icon')) {
                        const el = document.createElement('div');
                        el.className = 'game-icon';
                        el.textContent = ic;
                        el.style.fontSize = '2.2em';
                        el.style.marginBottom = '8px';
                        c.insertBefore(el, c.firstChild);
                    }
                } catch (e) { }
            });
            try {
                const mapBtn = {
                    mem: 'mem-config-btn',
                    ws: 'ws-settings-btn',
                    g2048: 'g2048-settings-btn',
                    sd: 'sd-settings-btn',
                    hm: 'hm-settings-btn'
                };
                const gameLabels = {
                    memory: 'Memória',
                    wordsearch: 'Caça‑Palavras',
                    '2048': '2048',
                    sudoku: 'Sudoku',
                    hangman: 'Forca'
                };
                Object.keys(mapBtn).forEach(key => {
                    const id = mapBtn[key];
                    const btn = document.getElementById(id);
                    if (!btn) return;
                    const gameKey = ({
                        mem: 'memory',
                        ws: 'wordsearch',
                        g2048: '2048',
                        sd: 'sudoku',
                        hm: 'hangman'
                    })[key];
                    try { btn.type = btn.type || 'button'; } catch (e) { }
                    const label = gameLabels[gameKey] || (gameKey || 'Jogo');

                    // Simplified icon: just the gear
                    btn.innerHTML = `<span class="gear" style="font-size:1.4em;">⚙️</span> <span class="sr-only">Configurações — ${label}</span>`;

                    try {
                        btn.setAttribute('aria-label', 'Configurações — ' + label);
                        btn.title = 'Configurações — ' + label;
                    } catch (e) { }
                });
            } catch (e) { }
        } catch (e) { }
    })();

    // 3. UI Elements & Screen Switching
    const hubScreen = document.getElementById('hub-screen');
    const gameScreens = document.querySelectorAll('.game-screen');
    const gameCards = document.querySelectorAll('.game-card:not(.disabled)');
    const backToHubButton = document.getElementById('back-to-hub');

    const switchScreen = (screenId) => {
        const screenMap = {
            memory: 'memory-game',
            wordsearch: 'wordsearch',
            sudoku: 'sudoku',
            '2048': 'game2048',
            hangman: 'hangman',
            chess: 'chess'
        };
        hubScreen.classList.add('hidden');
        gameScreens.forEach(screen => screen.classList.add('hidden'));
        if (screenId === 'hub') {
            hubScreen.classList.remove('hidden');
            try { document.body.classList.remove('compact-controls'); } catch (e) { }
        } else {
            const key = screenMap[screenId] || screenId;
            const activeScreen = document.getElementById(`${key}-screen`);
            if (activeScreen) activeScreen.classList.remove('hidden');
            try {
                if (key === 'memory-game') {
                    document.body.classList.add('compact-controls');
                } else {
                    document.body.classList.remove('compact-controls');
                }
            } catch (e) { }
        }
    };

    // Initial Load
    switchScreen('hub');

    // 4. Event Listeners

    // Game Card Clicks
    gameCards.forEach(card => {
        card.addEventListener('click', () => {
            const gameId = card.getAttribute('data-game');
            try { if (window.Settings) window.Settings.applyToGames(gameId); } catch (e) { }

            if (gameId === 'memory') {
                switchScreen('memory');
                if (window.MemoryGame) window.MemoryGame.start();
            } else if (gameId === 'wordsearch') {
                switchScreen('wordsearch');
                if (window.WordSearch) window.WordSearch.start();
            } else if (gameId === '2048') {
                switchScreen('2048');
                if (window.Game2048) window.Game2048.start();
            } else if (gameId === 'sudoku') {
                switchScreen('sudoku');
                if (window.SudokuGame) window.SudokuGame.start();
            } else if (gameId === 'hangman') {
                switchScreen('hangman');
                if (window.HangmanGame) window.HangmanGame.start();
            } else {
                switchScreen('hub');
            }
        });
    });

    // Back Buttons
    if (backToHubButton) {
        backToHubButton.addEventListener('click', () => {
            if (window.MemoryGame) window.MemoryGame.stop();
            switchScreen('hub');
        });
    }

    // Additional back buttons for other games
    const backToHubWS = document.getElementById('back-to-hub-ws');
    if (backToHubWS) {
        backToHubWS.addEventListener('click', () => {
            if (window.WordSearch) window.WordSearch.stop();
            switchScreen('hub');
        });
    }

    const backToHub2048 = document.getElementById('back-to-hub-2048');
    if (backToHub2048) {
        backToHub2048.addEventListener('click', () => {
            if (window.Game2048) window.Game2048.stop();
            switchScreen('hub');
        });
    }

    const backToHubSudoku = document.getElementById('back-to-hub-sudoku');
    if (backToHubSudoku) {
        backToHubSudoku.addEventListener('click', () => {
            if (window.SudokuGame) window.SudokuGame.stop();
            switchScreen('hub');
        });
    }

    const backToHubHM = document.getElementById('back-to-hub-hm');
    if (backToHubHM) {
        backToHubHM.addEventListener('click', () => {
            if (window.HangmanGame) window.HangmanGame.stop();
            switchScreen('hub');
        });
    }
    const backWs = document.getElementById('back-to-hub-ws');
    if (backWs) backWs.addEventListener('click', () => {
        if (window.WordSearch) window.WordSearch.stop();
        switchScreen('hub');
    });
    const back2048 = document.getElementById('back-to-hub-2048');
    if (back2048) back2048.addEventListener('click', () => {
        if (window.Game2048) window.Game2048.stop();
        switchScreen('hub');
    });
    const backSd = document.getElementById('back-to-hub-sd');
    if (backSd) backSd.addEventListener('click', () => {
        if (window.SudokuGame) window.SudokuGame.stop();
        switchScreen('hub');
    });
    const backHm = document.getElementById('back-to-hub-hm');
    if (backHm) backHm.addEventListener('click', () => {
        if (window.HangmanGame) window.HangmanGame.stop();
        switchScreen('hub');
    });

    // Settings Buttons - ROBUST DELEGATION
    document.addEventListener('click', (e) => {
        // Memory Settings
        const memBtn = e.target.closest('#mem-config-btn');
        if (memBtn) {
            e.preventDefault();
            e.stopPropagation();
            if (window.Settings) {
                window.Settings.openModal();
                setTimeout(() => { try { window.Settings._switchTab('tab-memory'); } catch (e) { } }, 120);
            }
            return;
        }

        // Word Search Settings
        if (e.target.closest('#ws-config-btn')) {
            if (window.Settings) {
                window.Settings.openModal();
                setTimeout(() => { try { window.Settings._switchTab('tab-ws'); } catch (e) { } }, 120);
            }
            return;
        }

        // 2048 Settings
        if (e.target.closest('#g2048-config-btn')) {
            if (window.Settings) {
                window.Settings.openModal();
                setTimeout(() => { try { window.Settings._switchTab('tab-2048'); } catch (e) { } }, 120);
            }
            return;
        }

        // Sudoku Settings
        if (e.target.closest('#sd-config-btn')) {
            if (window.Settings) {
                window.Settings.openModal();
                setTimeout(() => { try { window.Settings._switchTab('tab-sudoku'); } catch (e) { } }, 120);
            }
            return;
        }

        // Hangman Settings
        if (e.target.closest('#hm-config-btn')) {
            if (window.Settings) {
                window.Settings.openModal();
                setTimeout(() => { try { window.Settings._switchTab('tab-hangman'); } catch (e) { } }, 120);
            }
            return;
        }
    });

    // Mobile Bottom Sheet Logic (Settings)
    (function () {
        try {
            const modal = document.getElementById('settings-modal');
            const sheet = document.getElementById('settings-sheet');
            const header = document.querySelector('.settings-header-mobile');
            if (!modal || !sheet) return;
            let dragging = false;
            let startY = 0;
            let currentY = 0;
            let sheetHeight = 0;

            function setTranslate(y) {
                sheet.style.transform = `translateY(${y}px)`;
            }

            function start(e) {
                dragging = true;
                startY = e.touches ? e.touches[0].clientY : e.clientY;
                sheetHeight = sheet.getBoundingClientRect().height;
                sheet.style.transition = 'none';
                document.body.style.userSelect = 'none';
            }

            function move(e) {
                if (!dragging) return;
                currentY = (e.touches ? e.touches[0].clientY : e.clientY) - startY;
                if (currentY < 0) currentY = 0;
                setTranslate(currentY);
            }

            function end() {
                if (!dragging) return;
                dragging = false;
                sheet.style.transition = '';
                document.body.style.userSelect = '';
                if (currentY > (sheetHeight * 0.33)) {
                    if (window.Settings) window.Settings.closeModal();
                } else {
                    sheet.style.transform = '';
                }
                currentY = 0;
            }
            (header || sheet).addEventListener('pointerdown', (ev) => {
                ev.preventDefault();
                start(ev);
            });
            window.addEventListener('pointermove', move);
            window.addEventListener('pointerup', end);
            window.addEventListener('touchstart', (ev) => {
                if ((modal.classList.contains('sheet-mode'))) start(ev);
            }, {
                passive: false
            });
            window.addEventListener('touchmove', (ev) => {
                if ((modal.classList.contains('sheet-mode'))) move(ev);
            }, {
                passive: false
            });
            window.addEventListener('touchend', (ev) => {
                if ((modal.classList.contains('sheet-mode'))) end(ev);
            });
            const obs = new MutationObserver(() => {
                if (!modal.classList.contains('sheet-open')) sheet.style.transform = '';
            });
            obs.observe(modal, {
                attributes: true,
                attributeFilter: ['class']
            });
        } catch (e) { }
    })();
});
