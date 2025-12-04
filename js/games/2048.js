// 2048 Game - Complete Implementation
window.Game2048 = {
    size: 4,
    board: [],
    score: 0,
    gameOver: false,

    start() {
        this.boardEl = document.getElementById('game2048-board');
        this.scoreEl = document.getElementById('2048-score');
        this.newBtn = document.getElementById('new-2048');

        if (this.newBtn) {
            this.newBtn.addEventListener('click', () => this.init());
        }

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!document.getElementById('game2048-screen').classList.contains('hidden')) {
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.move('up');
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.move('down');
                } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    this.move('left');
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    this.move('right');
                }
            }
        });

        // Touch controls
        let touchStartX = 0;
        let touchStartY = 0;

        if (this.boardEl) {
            this.boardEl.addEventListener('touchstart', (e) => {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            });

            this.boardEl.addEventListener('touchend', (e) => {
                const touchEndX = e.changedTouches[0].clientX;
                const touchEndY = e.changedTouches[0].clientY;
                const dx = touchEndX - touchStartX;
                const dy = touchEndY - touchStartY;

                if (Math.abs(dx) > Math.abs(dy)) {
                    this.move(dx > 0 ? 'right' : 'left');
                } else {
                    this.move(dy > 0 ? 'down' : 'up');
                }
            });
        }

        // Arrow button controls
        const arrowUp = document.getElementById('arrow-up');
        const arrowDown = document.getElementById('arrow-down');
        const arrowLeft = document.getElementById('arrow-left');
        const arrowRight = document.getElementById('arrow-right');

        if (arrowUp) arrowUp.addEventListener('click', () => this.move('up'));
        if (arrowDown) arrowDown.addEventListener('click', () => this.move('down'));
        if (arrowLeft) arrowLeft.addEventListener('click', () => this.move('left'));
        if (arrowRight) arrowRight.addEventListener('click', () => this.move('right'));

        this.init();
    },

    stop() { },

    init() {
        // Get size from settings
        if (window.Settings && window.Settings.data && window.Settings.data.g2048Size) {
            this.size = parseInt(window.Settings.data.g2048Size, 10) || 4;
        }

        this.score = 0;
        this.gameOver = false;
        this.board = Array.from({ length: this.size }, () => Array(this.size).fill(0));

        // Add two initial tiles
        this.addRandomTile();
        this.addRandomTile();

        this.render();
    },

    addRandomTile() {
        const empty = [];
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.board[i][j] === 0) {
                    empty.push({ i, j });
                }
            }
        }

        if (empty.length > 0) {
            const { i, j } = empty[Math.floor(Math.random() * empty.length)];
            this.board[i][j] = Math.random() < 0.9 ? 2 : 4;
        }
    },

    move(direction) {
        if (this.gameOver) return;

        const oldBoard = JSON.stringify(this.board);

        if (direction === 'left') {
            for (let i = 0; i < this.size; i++) {
                this.board[i] = this.mergeLine(this.board[i]);
            }
        } else if (direction === 'right') {
            for (let i = 0; i < this.size; i++) {
                this.board[i] = this.mergeLine(this.board[i].reverse()).reverse();
            }
        } else if (direction === 'up') {
            for (let j = 0; j < this.size; j++) {
                const column = [];
                for (let i = 0; i < this.size; i++) {
                    column.push(this.board[i][j]);
                }
                const merged = this.mergeLine(column);
                for (let i = 0; i < this.size; i++) {
                    this.board[i][j] = merged[i];
                }
            }
        } else if (direction === 'down') {
            for (let j = 0; j < this.size; j++) {
                const column = [];
                for (let i = 0; i < this.size; i++) {
                    column.push(this.board[i][j]);
                }
                const merged = this.mergeLine(column.reverse()).reverse();
                for (let i = 0; i < this.size; i++) {
                    this.board[i][j] = merged[i];
                }
            }
        }

        if (oldBoard !== JSON.stringify(this.board)) {
            this.addRandomTile();
            this.render();
            this.checkGameOver();
        }
    },

    mergeLine(line) {
        // Remove zeros
        let filtered = line.filter(val => val !== 0);

        // Merge adjacent same values
        for (let i = 0; i < filtered.length - 1; i++) {
            if (filtered[i] === filtered[i + 1]) {
                filtered[i] *= 2;
                this.score += filtered[i];
                filtered.splice(i + 1, 1);
            }
        }

        // Add zeros back
        while (filtered.length < this.size) {
            filtered.push(0);
        }

        return filtered;
    },

    checkGameOver() {
        // Check for empty cells
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.board[i][j] === 0) return;
            }
        }

        // Check for possible merges
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const current = this.board[i][j];
                if (j < this.size - 1 && current === this.board[i][j + 1]) return;
                if (i < this.size - 1 && current === this.board[i + 1][j]) return;
            }
        }

        this.gameOver = true;
        setTimeout(() => {
            alert(`Game Over! Pontuação: ${this.score}`);
        }, 300);
    },

    render() {
        if (!this.boardEl) return;

        this.boardEl.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;
        this.boardEl.innerHTML = '';

        const tileSize = this.size === 4 ? '100px' : (this.size === 5 ? '80px' : '70px');

        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const value = this.board[i][j];
                const tile = document.createElement('div');
                tile.className = value ? `tile-2048 tile-2048-${value}` : 'tile-2048';
                tile.textContent = value || '';
                tile.style.width = tileSize;
                tile.style.height = tileSize;
                this.boardEl.appendChild(tile);
            }
        }

        if (this.scoreEl) {
            this.scoreEl.textContent = this.score;
        }
    }
};
