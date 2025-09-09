import { describe, it, expect, beforeEach } from "vitest";
import { MessageFormattingService } from "./MessageFormattingService";
import { SegmentType } from "@/core/valueObjects/ParsedMessage";

describe("MessageFormattingService", () => {
  let service: MessageFormattingService;

  beforeEach(() => {
    service = new MessageFormattingService();
  });

  describe("parseAIResponse", () => {
    it("should handle plain text without formatting", () => {
      const content = "This is plain text without any formatting.";
      const result = service.parseAIResponse(content);

      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].type).toBe(SegmentType.TEXT);
      expect(result.segments[0].content).toBe(content);
      expect(result.isEmpty()).toBe(false);
    });

    it("should handle empty content", () => {
      const result = service.parseAIResponse("");
      expect(result.isEmpty()).toBe(true);
    });

    it("should handle whitespace-only content", () => {
      const result = service.parseAIResponse("   \n  \t  ");
      expect(result.isEmpty()).toBe(true);
    });

    describe("Bold formatting (**text**)", () => {
      it("should parse single bold text", () => {
        const content = "This is **bold** text.";
        const result = service.parseAIResponse(content);

        expect(result.segments).toHaveLength(3);
        expect(result.segments[0]).toEqual({
          type: SegmentType.TEXT,
          content: "This is ",
          metadata: {}
        });
        expect(result.segments[1]).toEqual({
          type: SegmentType.BOLD,
          content: "bold",
          metadata: {}
        });
        expect(result.segments[2]).toEqual({
          type: SegmentType.TEXT,
          content: " text.",
          metadata: {}
        });
      });

      it("should parse multiple bold texts", () => {
        const content = "**First** and **Second** bold texts.";
        const result = service.parseAIResponse(content);

        expect(result.segments).toHaveLength(4);
        expect(result.segments[0].type).toBe(SegmentType.BOLD);
        expect(result.segments[0].content).toBe("First");
        expect(result.segments[1].type).toBe(SegmentType.TEXT);
        expect(result.segments[1].content).toBe(" and ");
        expect(result.segments[2].type).toBe(SegmentType.BOLD);
        expect(result.segments[2].content).toBe("Second");
        expect(result.segments[3].type).toBe(SegmentType.TEXT);
        expect(result.segments[3].content).toBe(" bold texts.");
      });

      it("should parse consecutive bold texts", () => {
        const content = "**First****Second**";
        const result = service.parseAIResponse(content);

        expect(result.segments).toHaveLength(2);
        expect(result.segments[0].type).toBe(SegmentType.BOLD);
        expect(result.segments[0].content).toBe("First");
        expect(result.segments[1].type).toBe(SegmentType.BOLD);
        expect(result.segments[1].content).toBe("Second");
      });

      it("should handle bold at start and end", () => {
        const content = "**Start** middle **End**";
        const result = service.parseAIResponse(content);

        expect(result.segments).toHaveLength(3);
        expect(result.segments[0].type).toBe(SegmentType.BOLD);
        expect(result.segments[0].content).toBe("Start");
        expect(result.segments[1].type).toBe(SegmentType.TEXT);
        expect(result.segments[1].content).toBe(" middle ");
        expect(result.segments[2].type).toBe(SegmentType.BOLD);
        expect(result.segments[2].content).toBe("End");
      });
    });

    describe("Numbered lists", () => {
      it("should parse single numbered item", () => {
        const content = "1. First item";
        const result = service.parseAIResponse(content);

        expect(result.segments).toHaveLength(2);
        expect(result.segments[0].type).toBe(SegmentType.NUMBERED_LIST);
        expect(result.segments[0].content).toBe("");
        expect(result.segments[0].getListNumber()).toBe(1);
        expect(result.segments[1].type).toBe(SegmentType.TEXT);
        expect(result.segments[1].content).toBe("First item");
      });

      it("should parse multiple numbered items", () => {
        const content = "1. First item\n2. Second item\n3. Third item";
        const result = service.parseAIResponse(content);

        expect(result.segments).toHaveLength(6);
        
        // First numbered item: marker + content
        expect(result.segments[0].type).toBe(SegmentType.NUMBERED_LIST);
        expect(result.segments[0].content).toBe("");
        expect(result.segments[0].getListNumber()).toBe(1);
        expect(result.segments[1].type).toBe(SegmentType.TEXT);
        expect(result.segments[1].content).toBe("First item");
        
        // Second numbered item: marker + content  
        expect(result.segments[2].type).toBe(SegmentType.NUMBERED_LIST);
        expect(result.segments[2].content).toBe("");
        expect(result.segments[2].getListNumber()).toBe(2);
        expect(result.segments[3].type).toBe(SegmentType.TEXT);
        expect(result.segments[3].content).toBe("Second item");
        
        // Third numbered item: marker + content
        expect(result.segments[4].type).toBe(SegmentType.NUMBERED_LIST);
        expect(result.segments[4].content).toBe("");
        expect(result.segments[4].getListNumber()).toBe(3);
        expect(result.segments[5].type).toBe(SegmentType.TEXT);
        expect(result.segments[5].content).toBe("Third item");
      });
    });

    describe("Complex real-world API responses", () => {
      it("should parse typical business information response", () => {
        const content = "Here are some top revenue companies:\n\n1. **Beyond The Numbers Accounting**: Revenue of **$12,524,122** with **36 employees**.\n\n2. **King Law**: Located in Matthews, generating **$9,977,919** in revenue.";
        
        const result = service.parseAIResponse(content);

        // Should not be empty
        expect(result.isEmpty()).toBe(false);
        
        // Should have multiple segments for the formatted content
        expect(result.segments.length).toBeGreaterThan(5);
        
        // Should parse numbered lists (markers will be empty, content in separate segments)
        const numberedListSegments = result.getSegmentsByType(SegmentType.NUMBERED_LIST);
        expect(numberedListSegments.length).toBe(2);
        expect(numberedListSegments[0].content).toBe("");
        expect(numberedListSegments[0].getListNumber()).toBe(1);
        expect(numberedListSegments[1].content).toBe("");
        expect(numberedListSegments[1].getListNumber()).toBe(2);
        
        // Should parse bold text
        const boldSegments = result.getSegmentsByType(SegmentType.BOLD);
        expect(boldSegments.length).toBeGreaterThan(0);
        
        // Verify we can convert back to plain text
        const plainText = result.toPlainText();
        expect(plainText).toContain("Beyond The Numbers Accounting");
        expect(plainText).toContain("King Law");
      });

      it("should handle response without any formatting", () => {
        const content = "Charlotte is a rapidly growing economic hub with diverse industries and favorable business environment.";
        
        const result = service.parseAIResponse(content);
        
        expect(result.isEmpty()).toBe(false);
        expect(result.segments).toHaveLength(1);
        expect(result.segments[0].type).toBe(SegmentType.TEXT);
        expect(result.segments[0].content).toBe(content);
      });

      it("should handle mixed content types", () => {
        const content = "Charlotte businesses include:\n\n1. **Financial Services**: Major banks like Bank of America\n- Wells Fargo operations\n- Growing fintech sector\n\n2. **Technology**: Software development companies";
        
        const result = service.parseAIResponse(content);
        
        expect(result.isEmpty()).toBe(false);
        expect(result.segments.length).toBeGreaterThan(3);
        
        // Should have numbered lists
        const numberedLists = result.getSegmentsByType(SegmentType.NUMBERED_LIST);
        expect(numberedLists.length).toBeGreaterThan(0);
        
        // Should have bullet points
        const bullets = result.getSegmentsByType(SegmentType.BULLET);
        expect(bullets.length).toBeGreaterThan(0);
        
        // Should have bold text
        const bold = result.getSegmentsByType(SegmentType.BOLD);
        expect(bold.length).toBeGreaterThan(0);
      });
    });

    describe("Edge cases and error handling", () => {
      it("should handle malformed markdown", () => {
        const content = "**unclosed bold and *unclosed italic";
        const result = service.parseAIResponse(content);
        
        // Should not crash and should return something
        expect(result.isEmpty()).toBe(false);
        expect(result.segments.length).toBeGreaterThan(0);
      });

      it("should handle mixed bold and italic", () => {
        const content = "This has **bold** and *italic* text together.";
        const result = service.parseAIResponse(content);
        
        expect(result.isEmpty()).toBe(false);
        expect(result.segments.length).toBeGreaterThan(3);
        
        const boldSegments = result.getSegmentsByType(SegmentType.BOLD);
        const italicSegments = result.getSegmentsByType(SegmentType.ITALIC);
        expect(boldSegments.length).toBe(1);
        expect(italicSegments.length).toBe(1);
      });

      it("should handle very long text", () => {
        const longText = `${"**Company**: ".repeat(100)  }This is a very long response that tests parsing performance and correctness.`;
        const result = service.parseAIResponse(longText);
        
        expect(result.isEmpty()).toBe(false);
        expect(result.segments.length).toBeGreaterThan(100);
      });
    });
  });

  describe("Database reference handling", () => {
    it("should handle content without database references", () => {
      const content = "This content has no database markers.";
      const result = service.parseAIResponse(content);
      
      expect(result.hasDatabaseReferences()).toBe(false);
      expect(result.getDatabaseBusinessNames()).toHaveLength(0);
    });

    it("should preserve content when no database markers are present", () => {
      const content = "**Bold text** with 1. numbered lists but no database markers.";
      const result = service.parseAIResponse(content);
      
      expect(result.isEmpty()).toBe(false);
      expect(result.hasDatabaseReferences()).toBe(false);
      expect(result.segments.length).toBeGreaterThan(1);
    });
  });

  describe("toPlainText conversion", () => {
    it("should convert formatted text back to readable plain text", () => {
      const content = "1. **Company A**: Revenue **$1M**\n2. **Company B**: Revenue **$2M**";
      const result = service.parseAIResponse(content);
      
      const plainText = result.toPlainText();
      expect(plainText).toContain("1. Company A: Revenue $1M");
      expect(plainText).toContain("2. Company B: Revenue $2M");
    });

    it("should handle bullet points in plain text conversion", () => {
      const content = "- First bullet\n- Second bullet";
      const result = service.parseAIResponse(content);
      
      const plainText = result.toPlainText();
      expect(plainText).toContain("• First bullet");
      expect(plainText).toContain("• Second bullet");
    });
  });
});