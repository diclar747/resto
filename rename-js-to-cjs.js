// Rename .js to .cjs recursively and fix internal require paths
const fs = require('fs');
const path = require('path');

const dir = process.argv[2];
if (!dir) { console.error('Usage: node rename-js-to-cjs.js <dir>'); process.exit(1); }

function processDir(d) {
  for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
    const full = path.join(d, entry.name);
    if (entry.isDirectory()) {
      processDir(full);
    } else if (entry.name.endsWith('.js')) {
      let content = fs.readFileSync(full, 'utf8');
      // Fix require paths: require("./foo") -> require("./foo.cjs")
      content = content.replace(/require\("(\.\/[^"]+?)"\)/g, (m, p) => {
        if (p.endsWith('.js') || p.endsWith('.json') || p.endsWith('.node')) return m;
        return `require("${p}.cjs")`;
      });
      const newPath = full.replace(/\.js$/, '.cjs');
      fs.writeFileSync(newPath, content);
      fs.unlinkSync(full);
    }
  }
}

processDir(path.resolve(dir));
console.log(`Renamed .js to .cjs in ${dir}`);
