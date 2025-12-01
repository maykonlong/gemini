const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, '..', 'js', 'script.js');
let raw;
try{
  raw = fs.readFileSync(file);
}catch(e){
  console.error('Error reading file:', file, e.message);
  process.exit(2);
}

// Report bytes with code <32 (except \n \r \t) or code > 126 (non-ASCII printable)
const badPositions = [];
for(let i=0;i<raw.length;i++){
  const b = raw[i];
  if(b === 0x0A || b === 0x0D || b === 0x09) continue; // allow LF CR TAB
  if(b < 0x20 || b > 0x7E){
    badPositions.push({ idx: i, code: b });
  }
}

if(badPositions.length === 0){
  console.log('No suspicious non-ASCII/control bytes found.');
  process.exit(0);
}

console.log('Found', badPositions.length, 'suspicious bytes. Showing context (line numbers):\n');

// Convert to string assuming utf8 to display lines
const txt = raw.toString('utf8');
const lines = txt.split(/\r?\n/);

function posToLineCol(pos){
  let acc = 0;
  for(let i=0;i<lines.length;i++){
    const ln = lines[i] + '\n';
    if(pos < acc + Buffer.byteLength(ln)){
      const col = pos - acc + 1;
      return { line: i+1, col };
    }
    acc += Buffer.byteLength(ln);
  }
  return { line: lines.length, col: Math.max(1, lines[lines.length-1].length) };
}

const shown = new Set();
badPositions.forEach(p => {
  const lc = posToLineCol(p.idx);
  if(shown.has(lc.line)) return; shown.add(lc.line);
  const start = Math.max(0, lc.line - 4);
  const end = Math.min(lines.length, lc.line + 3);
  console.log('--- around line', lc.line, '---');
  for(let i = start; i < end; i++){
    const mark = (i+1 === lc.line) ? '>>' : '  ';
    // show hex codes for suspicious characters in the line
    let display = lines[i];
    const bytes = Buffer.from(display, 'utf8');
    const annotated = Array.from(bytes).map((b, idx) => {
      if(b < 0x20 || b > 0x7E) return '[' + b.toString(16).padStart(2,'0') + ']';
      return String.fromCharCode(b);
    }).join('');
    console.log(`${mark} ${String(i+1).padStart(4)}: ${annotated}`);
  }
  console.log('');
});

process.exit(0);
