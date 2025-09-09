// Test the parsing with real AI response format
import { MessageFormattingService } from './src/core/services/MessageFormattingService.js';

const service = new MessageFormattingService();

// Test various content
const testCases = [
  "Simple text without formatting",
  "Text with **bold** formatting",
  "1. First item\n2. Second item",
  "**Bank of America** (from our database) has significant presence",
  "Companies like **Wells Fargo** (from our database) and **Truist** (from our database)"
];

testCases.forEach((content, i) => {
  console.log(`\n=== Test ${i + 1}: "${content.substring(0, 50)}..." ===`);
  
  try {
    const result = service.parseAIResponse(content);
    console.log(`Segments: ${result.segments.length}`);
    console.log(`Is empty: ${result.isEmpty()}`);
    
    result.segments.forEach((seg, j) => {
      console.log(`  ${j}: ${seg.type} = "${seg.content}" ${seg.metadata ? JSON.stringify(seg.metadata) : ''}`);
    });
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
  }
});