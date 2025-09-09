// Test case 2: "**Start** middle **End**"
const text = "**Start** middle **End**";
console.log(`Input: "${text}"`);

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

let position = 0;
const segments = [];

for (const formatMatch of matches) {
  if (formatMatch.start > position) {
    const beforeText = text.substring(position, formatMatch.start);
    if (beforeText) {
      segments.push({ type: 'TEXT', content: beforeText });
    }
  }
  
  segments.push({ type: 'BOLD', content: formatMatch.content });
  position = formatMatch.end;
}

if (position < text.length) {
  const remainingText = text.substring(position);
  if (remainingText) {
    segments.push({ type: 'TEXT', content: remainingText });
  }
}

console.log(`\nExpected 4 segments, got ${segments.length}:`);
segments.forEach((s, i) => {
  console.log(`  ${i}: ${s.type} - "${s.content}"`);
});

console.log('\nExpected segments:');
console.log('  0: BOLD - "Start"');
console.log('  1: TEXT - " middle "');  
console.log('  2: BOLD - "End"');
console.log('  3: ???'); // What should the 4th segment be?