# Memoria_games — Test & Run

Este repositório contém vários *single-file* hubs de jogos em HTML (ex.: `index_gemini.html`). As instruções abaixo ajudam a servir localmente e testar em desktop e mobile.

Pré-requisitos
- Python 3 (opcional)
- Node.js (opcional)
- Um navegador moderno (Chrome/Edge/Firefox)

Servir local (PowerShell - Windows)
```powershell
# abrir um terminal na pasta do projeto
cd "C:\Users\Acer\Projetos\Memoria_games"
# servir a partir da porta 8000
python -m http.server 8000
# abrir no navegador: http://localhost:8000/index_gemini.html
``` 

Servir local (WSL)
```bash
# dentro do WSL, navegue para a pasta montada
cd /mnt/c/Users/Acer/Projetos/Memoria_games
python3 -m http.server 8000
# no Windows, abra http://localhost:8000/index_gemini.html
```

Alternativa com Node (http-server)
```powershell
npm install -g http-server
http-server -p 8000
```

Testes rápidos
- Abra `index_gemini.html` via `http://localhost:8000/index_gemini.html`.
- No Hub, clique em `Jogo da Memória`.
  - Troque `Nível` e `Tema` e clique em `Reiniciar`.
  - Teste `Exportar Tema` e `Importar Tema` (importe um JSON válido).
- Volte ao Hub e abra `Jogo da Forca` (Hangman) — teste o teclado virtual.
- Teste `Caça-Palavras`, `2048`, `Sudoku`.

Observações
- Áudios podem requerer interação do usuário antes de tocarem em mobile.
- Se ocorrerem erros no console, cole-os aqui para que eu os corrija.

Próximos passos
- Popular mais temas (posso fazer isso agora).
- Implementar Palavras Cruzadas e Soletra.
- Melhorar responsividade e salvar temas/placares localmente.

Atualização: o arquivo `index_gemini.html` foi modificado para incluir um botão "Ativar Som" no canto superior direito. Esse botão inicializa um mecanismo WebAudio local (não precisa de arquivos remotos) e fornece efeitos sonoros gerados dinamicamente — adequado para uso offline. O motor de som foi afinado (envoltórias, acordes e ruído para efeitos). Se preferir arquivos estáticos embutidos (base64) eu também posso adicioná-los sob demanda.

---
