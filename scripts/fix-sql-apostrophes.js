/**
 * Fix SQL apostrophes - Escape single quotes INSIDE SQL strings only
 *
 * Usage: node scripts/fix-sql-apostrophes.js
 */

const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, '../exercises_rows.sql');
const outputFile = path.join(__dirname, '../exercises_rows_fixed.sql');

console.log('🔧 Fixing SQL apostrophes (CORRECT PARSER)...');
console.log(`📂 Reading: ${inputFile}`);

// Read file
let content = fs.readFileSync(inputFile, 'utf-8');

console.log('📊 Original file size:', (content.length / 1024).toFixed(2), 'KB');

// CORRECT APPROACH: Parse SQL and escape ONLY inside strings
let result = '';
let inString = false;
let prevChar = '';
let escapedCount = 0;

console.log('🔄 Parsing SQL and escaping apostrophes inside strings...');

for (let i = 0; i < content.length; i++) {
  const char = content[i];
  const nextChar = content[i + 1] || '';

  if (char === "'" && prevChar !== '\\') {
    if (!inString) {
      // Starting a string
      inString = true;
      result += char;
    } else {
      // We're in a string and hit an apostrophe
      // Check if it's the end of the string or an apostrophe inside

      // Look ahead to see if next char suggests we're still in the string
      // If next char is a comma, closing paren, or space followed by comma, we're ending the string
      if (nextChar === ',' || nextChar === ')' || (nextChar === ' ' && content[i + 2] === ',')) {
        // This is the closing quote
        inString = false;
        result += char;
      } else {
        // This is an apostrophe INSIDE the string - escape it!
        result += "''";
        escapedCount++;
      }
    }
  } else {
    result += char;
  }

  prevChar = char;
}

console.log(`✅ Escaped ${escapedCount} apostrophes inside SQL strings`);
console.log('📊 Fixed file size:', (result.length / 1024).toFixed(2), 'KB');

// Write fixed file
fs.writeFileSync(outputFile, result, 'utf-8');

console.log(`✅ Saved fixed file: ${outputFile}`);
console.log('');
console.log('📋 Now you can:');
console.log('1. Copy content of exercises_rows_fixed.sql');
console.log('2. Paste in Neon SQL Editor');
console.log('3. Run the query');
console.log('');
console.log('✨ File is ready!');
