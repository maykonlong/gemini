// Sudoku Game Logic
window.SudokuGame = {
    boardEl: document.getElementById('sudoku-board'),
    start() {
        this.boardEl = document.getElementById('sudoku-board');
        const newBtn = document.getElementById('new-sudoku');
        if (newBtn) newBtn.addEventListener('click', () => this.init());
        this.init();
    },
    stop() { },
    init() {
        const fullBoard = this.generateFullBoard();
        const puzzle = this.createPuzzle(fullBoard, 40); // Remove 40 numbers
        this.render(puzzle, fullBoard);
    },
    generateFullBoard() {
        const board = Array.from({ length: 9 }, () => Array(9).fill(0));
        this.fillBoard(board);
        return board;
    },
    fillBoard(board) {
        const empty = this.findEmpty(board);
        if (!empty) return true;
        const [row, col] = empty;
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);

        for (const num of nums) {
            if (this.isValid(board, num, row, col)) {
                board[row][col] = num;
                if (this.fillBoard(board)) return true;
                board[row][col] = 0;
            }
        }
        return false;
    },
    createPuzzle(fullBoard, attempts) {
        const board = JSON.parse(JSON.stringify(fullBoard));
        while (attempts > 0) {
            let row = Math.floor(Math.random() * 9);
            let col = Math.floor(Math.random() * 9);
            while (board[row][col] === 0) {
                row = Math.floor(Math.random() * 9);
                col = Math.floor(Math.random() * 9);
            }
            board[row][col] = 0;
            attempts--;
        }
        return board;
    },
    findEmpty(board) {
        for (let r = 0; r < 9; r++)
            for (let c = 0; c < 9; c++)
                if (board[r][c] === 0) return [r, c];
        return null;
    },
    isValid(board, num, row, col) {
        for (let i = 0; i < 9; i++) {
            if (board[row][i] === num && i !== col) return false;
            if (board[i][col] === num && i !== row) return false;
            const boxR = 3 * Math.floor(row / 3) + Math.floor(i / 3);
            const boxC = 3 * Math.floor(col / 3) + i % 3;
            if (board[boxR][boxC] === num && (boxR !== row || boxC !== col)) return false;
        }
        return true;
    },
    render(puzzle, solution) {
        if (!this.boardEl) return;
        this.boardEl.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const cell = document.createElement('div');
                cell.className = 'sudoku-cell';
                cell.style.width = '44px';
                cell.style.height = '44px';
                cell.style.display = 'flex';
                cell.style.alignItems = 'center';
                cell.style.justifyContent = 'center';
                cell.style.background = '#223';
                cell.style.color = '#fff';
                cell.style.border = '1px solid rgba(255,255,255,0.04)';

                // Thicker borders for 3x3 boxes
                if (i % 3 === 0 && i !== 0) cell.style.borderTop = '2px solid #666';
                if (j % 3 === 0 && j !== 0) cell.style.borderLeft = '2px solid #666';

                if (puzzle[i][j] !== 0) {
                    cell.textContent = puzzle[i][j];
                    cell.style.background = '#334';
                    cell.style.fontWeight = 'bold';
                } else {
                    cell.contentEditable = true;
                    cell.dataset.row = i;
                    cell.dataset.col = j;
                    cell.addEventListener('input', (e) => {
                        const val = parseInt(cell.textContent);
                        if (!/^[1-9]$/.test(cell.textContent)) {
                            cell.textContent = '';
                            cell.classList.remove('error');
                        } else {
                            if (val !== solution[i][j]) {
                                cell.style.color = '#ff6b6b';
                            } else {
                                cell.style.color = '#6bf7b3';
                            }
                            this.checkWin(solution);
                        }
                    });
                }
                this.boardEl.appendChild(cell);
            }
        }
    },
    checkWin(solution) {
        const cells = Array.from(this.boardEl.children);
        let correct = 0;
        cells.forEach(cell => {
            if (!cell.isContentEditable) {
                correct++;
            } else {
                const r = parseInt(cell.dataset.row);
                const c = parseInt(cell.dataset.col);
                const val = parseInt(cell.textContent);
                if (val === solution[r][c]) correct++;
            }
        });
        if (correct === 81) {
            try { playSound('win'); } catch (e) { }
            try { if (!window.Settings || window.Settings.data.confetti) { Confetti.fire(); } } catch (e) { }
            setTimeout(() => alert('Parabéns! Sudoku completado!'), 500);
        }
    }
};
