// Test numbered list with bold content
const text = "1. **Bold text** in numbered list";
console.log(`Input: "${text}"`);

// This should create a numbered list segment containing bold formatting
// But current implementation flattens it to plain text

// Let's simulate what should happen:
console.log('\nWhat SHOULD happen:');
console.log('1. NUMBERED_LIST segment with content that preserves bold formatting');
console.log('2. Or: separate segments for numbered list marker + bold content');

console.log('\nWhat PROBABLY happens now:');
console.log('1. NUMBERED_LIST segment with flattened content: "Bold text in numbered list"');
console.log('2. No BOLD segments because they get converted to plain text');

// Test a simple non-numbered case
const simpleText = "**Bold text** not in list";
console.log(`\nSimple text: "${simpleText}"`);
console.log('Expected: BOLD segment "Bold text" + TEXT segment " not in list"');