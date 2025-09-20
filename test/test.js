const assert = require('assert');
const { extractEmails: extractEmailsFixed } = require('../popup.js');
const { extractEmails: extractEmailsBuggy } = require('./buggy.js');

const testHtml = `
  <html>
    <body>
      <p>Here are some emails:</p>
      <p>test1@example.com, test2@example.com, test3@another.org</p>
      <span>And another one: final@test.co.uk</span>
    </body>
  </html>
`;

// Test case 1: Verify the buggy code
const buggyResult = extractEmailsBuggy(testHtml);
console.log('Buggy version found:', buggyResult);
assert.strictEqual(buggyResult.length, 1, 'Buggy version should only find the first email.');
assert.strictEqual(buggyResult[0], 'test1@example.com', 'Buggy version should find test1@example.com.');

// Test case 2: Verify the fixed code
const fixedResult = extractEmailsFixed(testHtml);
console.log('Fixed version found:', fixedResult);
assert.strictEqual(fixedResult.length, 4, 'Fixed version should find all 4 emails.');
assert.deepStrictEqual(fixedResult, [
  'test1@example.com',
  'test2@example.com',
  'test3@another.org',
  'final@test.co.uk'
], 'Fixed version should extract all emails in order.');

console.log('All tests passed!');
