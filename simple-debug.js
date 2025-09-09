// Simple debug without imports
console.log('Testing regex pattern...');

const text = "**First** and **Second** bold texts.";
console.log(`Input: "${text}"`);

// Test the bold pattern directly
const boldPattern = /\*\*([^*]+)\*\*/g;
let match;
const matches = [];

while ((match = boldPattern.exec(text)) !== null) {
  matches.push({
    start: match.index,
    end: match.index + match[0].length,
    content: match[1],
    fullMatch: match[0]
  });
}

console.log(`Found ${matches.length} bold matches:`);
matches.forEach((m, i) => {
  console.log(`  ${i}: "${m.content}" at position ${m.start}-${m.end}`);
});

// Simulate the parsing logic
let position = 0;
const segments = [];

for (const formatMatch of matches) {
  // Add text before the match
  if (formatMatch.start > position) {
    const beforeText = text.substring(position, formatMatch.start);
    if (beforeText) {
      segments.push({ type: 'TEXT', content: beforeText });
    }
  }
  
  // Add the formatted segment
  segments.push({ type: 'BOLD', content: formatMatch.content });
  
  // Update position
  position = formatMatch.end;
}

// Add any remaining text
if (position < text.length) {
  const remainingText = text.substring(position);
  if (remainingText) {
    segments.push({ type: 'TEXT', content: remainingText });
  }
}

console.log(`\nExpected 5 segments, got ${segments.length}:`);
segments.forEach((s, i) => {
  console.log(`  ${i}: ${s.type} - "${s.content}"`);
});