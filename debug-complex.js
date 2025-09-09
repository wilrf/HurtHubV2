// Test the complex content to understand what's happening
const content = "Here are some top revenue companies:\n\n1. **Beyond The Numbers Accounting**: Revenue of **$12,524,122** with **36 employees**.\n\n2. **King Law**: Located in Matthews, generating **$9,977,919** in revenue.";

console.log('Complex content analysis:');
console.log(content);
console.log('\nLines:');
const lines = content.split('\n');
lines.forEach((line, i) => {
  console.log(`  ${i}: "${line}"`);
});

console.log('\nExpected behavior:');
console.log('- Line 0: "Here are some top revenue companies:" -> TEXT segment');
console.log('- Line 1: "" (empty) -> possibly ignored or newline');
console.log('- Line 2: "1. **Beyond..." -> NUMBERED_LIST segment with flattened content');
console.log('- Line 3: "" (empty) -> possibly ignored or newline');
console.log('- Line 4: "2. **King Law..." -> NUMBERED_LIST segment with flattened content');

console.log('\nThe issue:');
console.log('Bold text **Beyond The Numbers Accounting** is INSIDE a numbered list');
console.log('Current architecture: numbered lists contain plain text only');
console.log('Test expectation: find BOLD segments');
console.log('Reality: bold formatting is parsed but then flattened to plain text');

console.log('\nPossible solutions:');
console.log('1. Change architecture to allow nested segments in lists');
console.log('2. Fix the tests to not expect bold segments from numbered lists');
console.log('3. Parse bold text that is NOT inside lists as separate segments');