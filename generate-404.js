const fs = require('fs');

// Lies die `index.html`-Datei
const indexHtml = fs.readFileSync('dist/worktimer/browser/index.html', 'utf8');

// Kopiere `index.html` zu `404.html`
fs.writeFileSync('dist/worktimer/browser/404.html', indexHtml);