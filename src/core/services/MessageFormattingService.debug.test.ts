import { describe, it, expect } from "vitest";
import { MessageFormattingService } from "./MessageFormattingService";
import { SegmentType } from "@/core/valueObjects/ParsedMessage";

describe("MessageFormattingService - Debug Live Issues", () => {
  let service: MessageFormattingService;

  beforeEach(() => {
    service = new MessageFormattingService();
  });

  it("should parse simple text", () => {
    const content = "Simple text without formatting";
    const result = service.parseAIResponse(content);
    
    console.log('Simple text segments:', result.segments);
    expect(result.segments.length).toBeGreaterThan(0);
    expect(result.isEmpty()).toBe(false);
  });

  it("should parse text with database marker", () => {
    const content = "**Bank of America** (from our database) has significant presence";
    const result = service.parseAIResponse(content);
    
    console.log('Database marker segments:', result.segments.map(s => ({
      type: s.type,
      content: s.content,
      metadata: s.metadata
    })));
    
    expect(result.segments.length).toBeGreaterThan(0);
    expect(result.isEmpty()).toBe(false);
    
    // Should have a DATABASE_INDICATOR segment
    const dbSegments = result.getSegmentsByType(SegmentType.DATABASE_INDICATOR);
    expect(dbSegments.length).toBe(1);
  });

  it("should handle real AI response format", () => {
    const content = `Based on our database, here are some major companies in Charlotte:

1. **Bank of America** (from our database): One of the largest banks
2. **Wells Fargo** (from our database): Major financial institution

These companies have significant presence in the area.`;
    
    const result = service.parseAIResponse(content);
    
    console.log('Real AI response segments:', result.segments.map(s => ({
      type: s.type,
      content: s.content.substring(0, 50),
      metadata: s.metadata
    })));
    
    expect(result.segments.length).toBeGreaterThan(0);
    expect(result.isEmpty()).toBe(false);
    
    // Should have DATABASE_INDICATOR segments
    const dbSegments = result.getSegmentsByType(SegmentType.DATABASE_INDICATOR);
    expect(dbSegments.length).toBe(2);
  });
});