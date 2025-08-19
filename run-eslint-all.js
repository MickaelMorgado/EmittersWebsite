#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const toolsDir = path.join(__dirname, 'tools');

// Get all JS files directly inside tools/, excluding *.min.js
const files = fs
  .readdirSync(toolsDir)
  .filter((f) => f.endsWith('.js') && !f.endsWith('.min.js'))
  .map((f) => path.join(toolsDir, f));

if (files.length === 0) {
  console.log('No JS files to lint in tools/');
  process.exit(0);
}

console.log('Linting JS files in tools/:', files.join(', '));

execSync(`npx eslint ${files.join(' ')} --fix`, { stdio: 'inherit' });

console.log('Done!');
