import fs from 'node:fs';
import path from 'node:path';

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(getFiles(full));
    } else if (full.endsWith('.js') && !full.endsWith('.test.js')) {
      results.push(full);
    }
  }
  return results;
}

const srcDir = path.resolve('./src');
const files = getFiles(srcDir);
const adj = new Map();

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const dir = path.dirname(file);
  const imports = [];
  const regex = /import\s+.*?from\s+['"](.*?)['"]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const target = path.resolve(dir, match[1]);
    imports.push(target);
  }
  adj.set(path.resolve(file), imports);
}

const visited = new Map();
function dfs(node, pathStack = []) {
  visited.set(node, 1);
  pathStack.push(node);
  const neighbors = adj.get(node) || [];
  for (const n of neighbors) {
    if (visited.get(n) === 1) {
      console.error('Cycle detected:', pathStack.concat(n).map(p => path.basename(p)));
      return true;
    }
    if (!visited.has(n)) {
      if (dfs(n, pathStack)) return true;
    }
  }
  pathStack.pop();
  visited.set(node, 2);
  return false;
}

let hasCycle = false;
for (const f of adj.keys()) {
  if (!visited.has(f)) {
    if (dfs(f)) {
      hasCycle = true;
      break;
    }
  }
}

console.log(JSON.stringify({
  totalProductionFiles: adj.size,
  hasCycle: hasCycle,
  directories: Array.from(new Set(files.map(f => path.dirname(f).split(path.sep).pop()))).sort()
}, null, 2));
