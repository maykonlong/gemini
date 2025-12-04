// Word Search Hints System
(function () {
    const wordHints = {
        // Animais
        'CACHORRO': 'Animal doméstico de quatro patas, melhor amigo do homem',
        'GATO': 'Felino doméstico que mia',
        'LEAO': 'Rei da selva',
        'TIGRE': 'Felino listrado',
        'ELEFANTE': 'Maior animal terrestre',
        'GIRAFA': 'Animal de pescoço muito longo',
        'ZEBRA': 'Como um cavalo listrado',
        'MACACO': 'Primata que vive em árvores',

        // Comida
        'PIZZA': 'Comida italiana redonda com queijo',
        'HAMBURGUER': 'Sanduíche com carne',
        'BOLO': 'Doce de aniversário',
        'CHOCOLATE': 'Doce marrom feito de cacau',
        'SORVETE': 'Sobremesa gelada',
        'ARROZ': 'Grão branco básico da culinária',
        'FEIJAO': 'Grão que se come com arroz',

        // Natureza
        'ARVORE': 'Planta grande com tronco e folhas',
        'FLOR': 'Parte colorida das plantas',
        'MONTANHA': 'Elevação natural muito alta',
        'RIO': 'Corrente de água que flui',
        'MAR': 'Grande extensão de água salgada',
        'SOL': 'Estrela que ilumina a Terra',
        'LUA': 'Satélite natural da Terra',
        'ESTRELA': 'Ponto brilhante no céu noturno',

        // Objetos
        'CADEIRA': 'Móvel para sentar',
        'MESA': 'Móvel com superfície plana',
        'LIVRO': 'Objeto com páginas para ler',
        'LAPIS': 'Instrumento para escrever',
        'RELOGIO': 'Marca as horas',
        'TELEFONE': 'Aparelho para falar à distância',
        'CARRO': 'Veículo com quatro rodas',

        // Cores
        'VERMELHO': 'Cor do sangue',
        'AZUL': 'Cor do céu',
        'VERDE': 'Cor da grama',
        'AMARELO': 'Cor do sol',
        'PRETO': 'Ausência total de cor',
        'BRANCO': 'Cor da neve',
    };

    // Add hints to word search when a word is found
    if (window.WordSearch) {
        const originalOnPointerUp = window.WordSearch.onPointerUp;

        window.WordSearch.onPointerUp = function (e) {
            originalOnPointerUp.call(this, e);

            // Check if hints should be shown
            const showHints = window.Settings && window.Settings.data && window.Settings.data.wsShowDefs !== false;
            if (!showHints) return;

            // Show hint for recently found word
            setTimeout(() => {
                const hintDiv = document.getElementById('ws-hint');
                if (!hintDiv) return;

                const foundWords = Array.from(document.querySelectorAll('.ws-word.found'));
                if (foundWords.length === 0) {
                    hintDiv.innerHTML = '';
                    return;
                }

                let hintsHTML = '<strong>💡 Dicas das palavras encontradas:</strong><br>';
                foundWords.forEach(wordEl => {
                    const word = wordEl.dataset.word || wordEl.textContent.replace(/[\s-]/g, '');
                    const hint = wordHints[word.toUpperCase()];
                    if (hint) {
                        hintsHTML += `<div style="margin:8px 0;"><strong>${word}:</strong> ${hint}</div>`;
                    }
                });

                hintDiv.innerHTML = hintsHTML;
            }, 100);
        };
    }
})();
