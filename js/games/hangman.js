// Hangman Game with Gallows Drawing
window.HangmanGame = {
    canvas: null,
    ctx: null,
    wordEl: null,
    keyboardEl: null,
    mistakesEl: null,
    hintEl: null,
    newBtn: null,

    wordsWithHints: [
        { word: 'JAVASCRIPT', hint: 'Linguagem de programação para web' },
        { word: 'COMPUTADOR', hint: 'Máquina eletrônica para processar dados' },
        { word: 'PROGRAMAR', hint: 'Escrever código para criar software' },
        { word: 'ALGORITMO', hint: 'Sequência de instruções para resolver um problema' },
        { word: 'INTERNET', hint: 'Rede mundial de computadores' },
        { word: 'NAVEGADOR', hint: 'Software para acessar páginas web' },
        { word: 'TECLADO', hint: 'Dispositivo de entrada com letras e números' },
        { word: 'MEMORIA', hint: 'Onde o computador armazena informações' },
        { word: 'MONITOR', hint: 'Tela do computador' },
        { word: 'ARQUIVO', hint: 'Documento digital armazenado' },
        { word: 'PASTA', hint: 'Organiza arquivos no computador' },
        { word: 'IMPRESSORA', hint: 'Dispositivo que transfere para papel' },
        { word: 'MOUSE', hint: 'Dispositivo apontador' },
        { word: 'JANELA', hint: 'Área na tela de um programa' },
        { word: 'MENU', hint: 'Lista de opções' },
        { word: 'ATALHO', hint: 'Caminho rápido para acessar algo' },
        { word: 'SALVAR', hint: 'Guardar trabalho no computador' },
        { word: 'DELETAR', hint: 'Remover permanentemente' },
        { word: 'COPIAR', hint: 'Duplicar texto ou arquivo' },
        { word: 'COLAR', hint: 'Inserir conteúdo copiado' },
        { word: 'EMAIL', hint: 'Correio eletrônico' },
        { word: 'SENHA', hint: 'Código secreto de acesso' },
        { word: 'VIRUS', hint: 'Programa malicioso' },
        { word: 'BACKUP', hint: 'Cópia de segurança' },
        { word: 'NUVEM', hint: 'Armazenamento online' },
    ],

    secret: '',
    currentHint: '',
    display: [],
    guessed: new Set(),
    mistakes: 0,
    maxMistakes: 6,

    start() {
        this.canvas = document.getElementById('hangman-canvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.wordEl = document.getElementById('hm-word');
        this.keyboardEl = document.getElementById('hm-keyboard');
        this.mistakesEl = document.getElementById('hm-mistakes');
        this.hintEl = document.getElementById('hm-hint');
        this.newBtn = document.getElementById('new-hangman');

        if (this.newBtn) {
            this.newBtn.addEventListener('click', () => this.init());
        }

        if (this.canvas) {
            this.canvas.width = 300;
            this.canvas.height = 350;
        }

        this.init();
    },

    stop() { },

    init() {
        if (window.Settings && window.Settings.data && window.Settings.data.hangmanMax) {
            this.maxMistakes = parseInt(window.Settings.data.hangmanMax, 10) || 6;
        }

        this.mistakes = 0;
        this.guessed = new Set();

        const chosen = this.wordsWithHints[Math.floor(Math.random() * this.wordsWithHints.length)];
        this.secret = chosen.word;
        this.currentHint = chosen.hint;

        this.display = Array.from(this.secret).map(ch => ch === ' ' ? ' ' : '_');
        this.render();
        this.renderKeyboard();
        this.drawGallows();

        if (this.mistakesEl) {
            this.mistakesEl.textContent = `Erros: ${this.mistakes} / ${this.maxMistakes}`;
        }

        const messageEl = document.getElementById('hm-message');
        if (messageEl) messageEl.textContent = '';

        // Show hint
        if (this.hintEl) {
            const showHints = !window.Settings || !window.Settings.data || window.Settings.data.showHints !== false;
            if (showHints) {
                this.hintEl.innerHTML = `💡 <strong>Dica:</strong> ${this.currentHint}`;
                this.hintEl.style.display = 'block';
            } else {
                this.hintEl.style.display = 'none';
            }
        }
    },

    drawGallows() {
        if (!this.ctx) return;

        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.strokeStyle = '#2E7D32';
        ctx.lineWidth = 4;

        // Base
        ctx.beginPath();
        ctx.moveTo(20, 330);
        ctx.lineTo(180, 330);
        ctx.stroke();

        // Vertical pole
        ctx.beginPath();
        ctx.moveTo(60, 330);
        ctx.lineTo(60, 30);
        ctx.stroke();

        // Top beam
        ctx.beginPath();
        ctx.moveTo(60, 30);
        ctx.lineTo(180, 30);
        ctx.stroke();

        // Rope
        ctx.beginPath();
        ctx.moveTo(180, 30);
        ctx.lineTo(180, 60);
        ctx.stroke();

        // Draw body parts based on mistakes
        ctx.strokeStyle = '#C62828';
        ctx.fillStyle = '#C62828';
        ctx.lineWidth = 3;

        if (this.mistakes >= 1) {
            // Head
            ctx.beginPath();
            ctx.arc(180, 80, 20, 0, Math.PI * 2);
            ctx.stroke();
        }

        if (this.mistakes >= 2) {
            // Body
            ctx.beginPath();
            ctx.moveTo(180, 100);
            ctx.lineTo(180, 180);
            ctx.stroke();
        }

        if (this.mistakes >= 3) {
            // Left arm
            ctx.beginPath();
            ctx.moveTo(180, 120);
            ctx.lineTo(150, 150);
            ctx.stroke();
        }

        if (this.mistakes >= 4) {
            // Right arm
            ctx.beginPath();
            ctx.moveTo(180, 120);
            ctx.lineTo(210, 150);
            ctx.stroke();
        }

        if (this.mistakes >= 5) {
            // Left leg
            ctx.beginPath();
            ctx.moveTo(180, 180);
            ctx.lineTo(150, 220);
            ctx.stroke();
        }

        if (this.mistakes >= 6) {
            // Right leg
            ctx.beginPath();
            ctx.moveTo(180, 180);
            ctx.lineTo(210, 220);
            ctx.stroke();

            // Face (sad)
            ctx.fillStyle = '#C62828';
            ctx.beginPath();
            ctx.arc(175, 77, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(185, 77, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(180, 90, 8, 0, Math.PI, false);
            ctx.stroke();
        }
    },

    render() {
        if (this.wordEl) {
            this.wordEl.textContent = this.display.join(' ');
        }

        if (this.mistakesEl) {
            this.mistakesEl.textContent = `Erros: ${this.mistakes} / ${this.maxMistakes}`;
        }

        this.drawGallows();

        const messageEl = document.getElementById('hm-message');
        if (messageEl) {
            if (!this.display.includes('_')) {
                messageEl.textContent = '🎉 Você venceu!';
                messageEl.style.color = '#2E7D32';
                try { playSound('win'); } catch (e) { }
                try { if (!window.Settings || window.Settings.data.confetti) { Confetti.fire(); } } catch (e) { }
            } else if (this.mistakes >= this.maxMistakes) {
                messageEl.textContent = `😢 Perdeu! Palavra: ${this.secret}`;
                messageEl.style.color = '#C62828';
                try { playSound('error'); } catch (e) { }
            }
        }
    },

    renderKeyboard() {
        if (!this.keyboardEl) return;

        this.keyboardEl.innerHTML = '';
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

        for (let ch of letters) {
            const btn = document.createElement('button');
            btn.textContent = ch;
            btn.addEventListener('click', () => this.guess(ch));
            this.keyboardEl.appendChild(btn);
        }
    },

    guess(letter) {
        if (this.guessed.has(letter) || this.mistakes >= this.maxMistakes || !this.display.includes('_')) {
            return;
        }

        this.guessed.add(letter);
        const btns = Array.from(this.keyboardEl.children).filter(b => b.textContent === letter);

        if (this.secret.includes(letter)) {
            for (let i = 0; i < this.secret.length; i++) {
                if (this.secret[i] === letter) {
                    this.display[i] = letter;
                }
            }
            btns.forEach(b => {
                b.disabled = true;
                b.classList.add('correct');
            });
            try { playSound('match'); } catch (e) { }
        } else {
            this.mistakes++;
            btns.forEach(b => {
                b.disabled = true;
                b.classList.add('wrong');
            });
            try { playSound('flip'); } catch (e) { }
        }

        this.render();
    }
};
