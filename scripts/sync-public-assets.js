const fs = require('fs');
const path = require('path');

const root = process.cwd();
const files = [
  ['src/header.css', 'public/src/header.css'],
  ['src/input.css', 'public/src/input.css'],
  ['src/output.css', 'public/src/output.css'],
  ['image/icon.jpeg', 'public/image/icon.jpeg']
];

for (const [from, to] of files) {
  const source = path.join(root, from);
  const target = path.join(root, to);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

console.log('Static assets synced to public/');
