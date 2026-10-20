import fs from 'fs';

const filePath = 'c:\\mecano\\Mecano-main\\Mecano-main\\src\\keyboard\\CurriculumData.js';
let content = fs.readFileSync(filePath, 'utf8');

const lvl6Marker = '// NIVEL 6:';
const lvl6Index = content.indexOf(lvl6Marker);
if (lvl6Index === -1) {
  console.error('Could not find marker:', lvl6Marker);
  process.exit(1);
}

const part1 = content.slice(0, lvl6Index);
const part2 = content.slice(lvl6Index);

// Replace only text: '...' occurrences in levels 1 to 5
const updatedPart1 = part1.replace(/text:\s*'([^']+)'/g, (match, val) => {
  return "text: '" + val.toUpperCase() + "'";
});

fs.writeFileSync(filePath, updatedPart1 + part2, 'utf8');
console.log('Successfully updated levels 1 to 5 to uppercase!');
