const fs = require('fs');
const p = 'c:/Users/Acer/Projetos/Memoria_games/gemini/js/script.js';
const s = fs.readFileSync(p, 'utf8');
const chars = ['(',')','{','}','[',']','`','"',"'"];
chars.forEach(c => {
  const cnt = s.split(c).length - 1;
  console.log(`${c} : ${cnt}`);
});
console.log('length :', s.length);
