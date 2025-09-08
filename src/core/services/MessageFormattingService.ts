/**
 * Domain Service for parsing and formatting AI chat messages
 * Following Clean Architecture - contains business logic for message processing
 */

import { ParsedMessage, MessageSegment, SegmentType } from "@/core/valueObjects/ParsedMessage";

export class MessageFormattingService {
  private readonly DB_PLACEHOLDER = "{{DB_INDICATOR}}";

  /**
   * Parse AI response content into structured segments
   * This is business logic - how we identify and structure message components
   */
  parseAIResponse(content: string): ParsedMessage {
    // First, identify and mark database references
    const processedContent = this.markDatabaseReferences(content);
    
    // Then parse the content into segments
    const segments = this.parseIntoSegments(processedContent);
    
    return new ParsedMessage(segments);
  }

  /**
   * Identify database references and replace with placeholders
   */
  private markDatabaseReferences(content: string): string {
    return content.replace(/\(from our database\)/g, this.DB_PLACEHOLDER);
  }

  /**
   * Parse content into structured segments with formatting information
   */
  private parseIntoSegments(content: string): MessageSegment[] {
    const segments: MessageSegment[] = [];
    const parts = content.split(this.DB_PLACEHOLDER);

    parts.forEach((part, index) => {
      if (part) {
        // Parse markdown formatting within this part
        const formattedSegments = this.parseMarkdown(part);
        segments.push(...formattedSegments);
      }

      // Add database indicator after each part except the last
      if (index < parts.length - 1) {
        // Extract the business name (text immediately before the indicator)
        const businessName = this.extractBusinessName(part);
        segments.push(new MessageSegment(
          SegmentType.DATABASE_INDICATOR,
          "",
          { businessName }
        ));
      }
    });

    return segments;
  }

  /**
   * Parse markdown formatting into segments
   */
  private parseMarkdown(text: string): MessageSegment[] {
    const segments: MessageSegment[] = [];
    let currentText = text;

    // Handle bold text (**text** or __text__)
    currentText = this.parseFormatting(
      currentText,
      /\*\*([^*]+)\*\*/g,
      SegmentType.BOLD,
      segments
    );
    currentText = this.parseFormatting(
      currentText,
      /__([^_]+)__/g,
      SegmentType.BOLD,
      segments
    );

    // Handle italic text (*text* or _text_) - be careful not to match bold
    currentText = this.parseFormatting(
      currentText,
      /(?<!\*)\*(?!\*)([^*]+)(?<!\*)\*(?!\*)/g,
      SegmentType.ITALIC,
      segments
    );
    currentText = this.parseFormatting(
      currentText,
      /(?<!_)_(?!_)([^_]+)(?<!_)_(?!_)/g,
      SegmentType.ITALIC,
      segments
    );

    // Handle bullet points
    currentText = currentText.replace(/^[*-]\s+(.+)$/gm, (match, content) => {
      segments.push(new MessageSegment(SegmentType.BULLET, content));
      return "";
    });

    // Handle numbered lists
    currentText = currentText.replace(/^(\d+)\.\s+(.+)$/gm, (match, number, content) => {
      segments.push(new MessageSegment(
        SegmentType.NUMBERED_LIST,
        content,
        { number: parseInt(number) }
      ));
      return "";
    });

    // Add any remaining plain text
    if (currentText.trim()) {
      segments.push(new MessageSegment(SegmentType.TEXT, currentText));
    }

    // If no segments were created, return the original text as plain
    if (segments.length === 0 && text) {
      segments.push(new MessageSegment(SegmentType.TEXT, text));
    }

    return segments;
  }

  /**
   * Generic formatting parser
   */
  private parseFormatting(
    text: string,
    pattern: RegExp,
    type: SegmentType,
    segments: MessageSegment[]
  ): string {
    let remainingText = text;
    let match;

    while ((match = pattern.exec(text)) !== null) {
      const beforeMatch = text.substring(0, match.index);
      if (beforeMatch) {
        segments.push(new MessageSegment(SegmentType.TEXT, beforeMatch));
      }

      segments.push(new MessageSegment(type, match[1]));

      remainingText = text.substring(match.index + match[0].length);
      text = remainingText;
      pattern.lastIndex = 0; // Reset regex
    }

    return remainingText;
  }

  /**
   * Extract business name from text (last complete phrase before indicator)
   */
  private extractBusinessName(text: string): string {
    // Match the last complete business name before the indicator
    // This regex captures multi-word business names
    const match = text.match(/([A-Z][^,.:;!?]*?)(?:\s*$)/);
    return match ? match[1].trim() : "";
  }

  /**
   * Check if a segment represents a business from our database
   */
  isBusinessReference(segment: MessageSegment): boolean {
    return segment.type === SegmentType.DATABASE_INDICATOR;
  }
}

// Singleton instance for consistent parsing across the application
export const messageFormattingService = new MessageFormattingService();