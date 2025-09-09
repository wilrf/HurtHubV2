import { MessageFormattingService } from './src/core/services/MessageFormattingService.js';

const service = new MessageFormattingService();

// Test simple bold parsing
console.log('=== Testing: **First** and **Second** bold texts. ===');
const result = service.parseAIResponse("**First** and **Second** bold texts.");
console.log('Segments found:', result.segments.length);
result.segments.forEach((segment, i) => {
  console.log(`${i}: ${segment.type} - "${segment.content}"`);
});

// Test numbered list parsing  
console.log('\n=== Testing numbered lists ===');
const listResult = service.parseAIResponse("1. **Company A**: Revenue\n2. **Company B**: Revenue");
console.log('Segments found:', listResult.segments.length);
listResult.segments.forEach((segment, i) => {
  console.log(`${i}: ${segment.type} - "${segment.content}"`);
});