import fs from 'fs';
import { getLeftHandSVG, getRightHandSVG } from '../src/keyboard/InteractiveHandsSVG.js';

let html = fs.readFileSync('index.html', 'utf8');

// Replace Left Hand SVG
const leftSvg = getLeftHandSVG().trim();
const leftRegex = /<svg class="interactive-hand-svg[^"]*" id="hand-svg-left"[\s\S]*?<\/svg>/;
html = html.replace(leftRegex, leftSvg);

// Replace Right Hand SVG
const rightSvg = getRightHandSVG().trim();
const rightRegex = /<svg class="interactive-hand-svg[^"]*" id="hand-svg-right"[\s\S]*?<\/svg>/;
html = html.replace(rightRegex, rightSvg);

fs.writeFileSync('index.html', html, 'utf8');
console.log('Successfully synchronized index.html with new anatomical vector hands!');
