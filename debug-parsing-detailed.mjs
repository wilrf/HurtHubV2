import { MessageFormattingService } from './src/core/services/MessageFormattingService.js';

const service = new MessageFormattingService();

// Test the failing case: "**First** and **Second** bold texts."
console.log('=== DEBUGGING: Multiple bold texts ===');
const testContent = "**First** and **Second** bold texts.";
console.log(`Input: "${testContent}"`);

const result = service.parseAIResponse(testContent);
console.log(`Segments found: ${result.segments.length}`);
console.log('Expected: 5 segments (BOLD "First", TEXT " and ", BOLD "Second", TEXT " bold texts.")');

result.segments.forEach((segment, i) => {
  console.log(`${i}: ${segment.type} - "${segment.content}"`);
});

// Test another failing case: "**Start** middle **End**"
console.log('\n=== DEBUGGING: Bold at start and end ===');
const testContent2 = "**Start** middle **End**";
console.log(`Input: "${testContent2}"`);

const result2 = service.parseAIResponse(testContent2);
console.log(`Segments found: ${result2.segments.length}`);
console.log('Expected: 4 segments (BOLD "Start", TEXT " middle ", BOLD "End")');

result2.segments.forEach((segment, i) => {
  console.log(`${i}: ${segment.type} - "${segment.content}"`);
});

// Test complex real-world case that's failing
console.log('\n=== DEBUGGING: Complex business response ===');
const complexContent = "Here are some top revenue companies:\n\n1. **Beyond The Numbers Accounting**: Revenue of **$12,524,122** with **36 employees**.\n\n2. **King Law**: Located in Matthews, generating **$9,977,919** in revenue.";
console.log(`Input: "${complexContent}"`);

const result3 = service.parseAIResponse(complexContent);
console.log(`Total segments found: ${result3.segments.length}`);

// Count specific segment types
const boldSegments = result3.segments.filter(s => s.type === 'BOLD');
const numberedSegments = result3.segments.filter(s => s.type === 'NUMBERED_LIST');
const textSegments = result3.segments.filter(s => s.type === 'TEXT');

console.log(`Bold segments: ${boldSegments.length}`);
console.log(`Numbered list segments: ${numberedSegments.length}`);
console.log(`Text segments: ${textSegments.length}`);

console.log('\nAll segments:');
result3.segments.forEach((segment, i) => {
  console.log(`${i}: ${segment.type} - "${segment.content}"`);
});