import { readFileSync, writeFileSync } from 'node:fs';

// Lies die `index.html`-Datei
const indexHtml = readFileSync('dist/worktimer/browser/index.html', 'utf8');

// Kopiere `index.html` zu `404.html`
writeFileSync('dist/worktimer/browser/404.html', indexHtml);
