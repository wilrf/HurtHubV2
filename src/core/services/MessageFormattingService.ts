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
    // First, identify and mark database references with business names
    const { processedContent, businessNameMap } = this.markDatabaseReferences(content);
    
    // Then parse the content into segments
    const segments = this.parseIntoSegments(processedContent, businessNameMap);
    
    return new ParsedMessage(segments);
  }

  /**
   * Identify database references and replace with placeholders
   * Also extracts business names for chain of custody
   */
  private markDatabaseReferences(content: string): { processedContent: string, businessNameMap: Map<number, string> } {
    const businessNameMap = new Map<number, string>();
    let placeholderIndex = 0;
    
    // Pattern to match business name followed by "(from our database)"
    // Captures: [full match, business name]
    const pattern = /([A-Z][^(]*?)\s*\(from our database\)/g;
    
    const processedContent = content.replace(pattern, (match, businessName) => {
      // Clean up the business name
      const cleanName = businessName.trim();
      const currentIndex = placeholderIndex++;
      businessNameMap.set(currentIndex, cleanName);
      
      // Replace with business name + placeholder (placeholder will be parsed out)
      return `${cleanName}${this.DB_PLACEHOLDER}_${currentIndex}`;
    });
    
    return { processedContent, businessNameMap };
  }

  /**
   * Parse content into structured segments with formatting information
   */
  private parseIntoSegments(content: string, businessNameMap: Map<number, string>): MessageSegment[] {
    const segments: MessageSegment[] = [];
    
    // Split by our placeholder pattern (includes index)
    const placeholderPattern = new RegExp(`${this.DB_PLACEHOLDER}_(\\d+)`, 'g');
    let lastIndex = 0;
    let match;
    
    while ((match = placeholderPattern.exec(content)) !== null) {
      const matchStart = match.index;
      const matchEnd = matchStart + match[0].length;
      const placeholderIndex = parseInt(match[1]);
      
      // Add content before the placeholder
      if (matchStart > lastIndex) {
        const beforeContent = content.substring(lastIndex, matchStart);
        if (beforeContent) {
          const formattedSegments = this.parseMarkdown(beforeContent);
          segments.push(...formattedSegments);
        }
      }
      
      // Add database indicator with the business name
      const businessName = businessNameMap.get(placeholderIndex) || "";
      segments.push(new MessageSegment(
        SegmentType.DATABASE_INDICATOR,
        "",
        { businessName }
      ));
      
      lastIndex = matchEnd;
    }
    
    // Add any remaining content after the last placeholder
    if (lastIndex < content.length) {
      const remainingContent = content.substring(lastIndex);
      if (remainingContent) {
        const formattedSegments = this.parseMarkdown(remainingContent);
        segments.push(...formattedSegments);
      }
    }
    
    // If no placeholders were found, just parse the entire content
    if (segments.length === 0 && content) {
      const formattedSegments = this.parseMarkdown(content);
      segments.push(...formattedSegments);
    }
    
    return segments;
  }

  /**
   * Single-pass markdown parser - CORRECT APPROACH
   * Parses all formatting in one pass to maintain proper text order
   */
  private parseMarkdown(text: string): MessageSegment[] {
    const segments: MessageSegment[] = [];
    
    // Process line by line to handle lists first
    const lines = text.split('\n');
    let lineIndex = 0;
    
    while (lineIndex < lines.length) {
      const line = lines[lineIndex];
      
      // Check if this is a numbered list item
      const numberedMatch = line.match(/^(\d+)\.\s+(.+)$/);
      if (numberedMatch) {
        const content = numberedMatch[2];
        
        // Create numbered list marker segment
        segments.push(new MessageSegment(
          SegmentType.NUMBERED_LIST,
          "",  // Empty content - this is just the list marker
          { number: parseInt(numberedMatch[1]) }
        ));
        
        // Parse and add the content with preserved formatting
        const inlineSegments = this.parseInlineFormatting(content);
        segments.push(...inlineSegments);
        lineIndex++;
        continue;
      }
      
      // Check if this is a bullet point
      const bulletMatch = line.match(/^[*-]\s+(.+)$/);
      if (bulletMatch) {
        const content = bulletMatch[1];
        
        // Create bullet marker segment
        segments.push(new MessageSegment(SegmentType.BULLET, ""));
        
        // Parse and add the content with preserved formatting
        const inlineSegments = this.parseInlineFormatting(content);
        segments.push(...inlineSegments);
        lineIndex++;
        continue;
      }
      
      // Regular line - parse inline formatting
      if (line.trim()) {
        const inlineSegments = this.parseInlineFormatting(line);
        segments.push(...inlineSegments);
      }
      
      // Add newline if not the last line
      if (lineIndex < lines.length - 1) {
        segments.push(new MessageSegment(SegmentType.TEXT, '\n'));
      }
      
      lineIndex++;
    }
    
    // If no segments were created, return the original text as plain
    if (segments.length === 0 && text) {
      segments.push(new MessageSegment(SegmentType.TEXT, text));
    }
    
    return segments;
  }
  
  /**
   * Parse inline formatting (bold, italic) in correct order
   */
  private parseInlineFormatting(text: string): MessageSegment[] {
    const segments: MessageSegment[] = [];
    let position = 0;
    
    // Find all formatting matches and sort by position
    const matches: Array<{
      start: number;
      end: number;
      type: SegmentType;
      content: string;
    }> = [];
    
    // Find bold patterns (**text**)
    let match;
    const boldPattern = /\*\*([^*]+)\*\*/g;
    while ((match = boldPattern.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        type: SegmentType.BOLD,
        content: match[1]
      });
    }
    
    // Find bold patterns (__text__)
    const boldUnderscorePattern = /__([^_]+)__/g;
    while ((match = boldUnderscorePattern.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        type: SegmentType.BOLD,
        content: match[1]
      });
    }
    
    // Find italic patterns (*text*) - avoid conflicts with bold
    const italicPattern = /(?<!\*)\*(?!\*)([^*]+?)(?<!\*)\*(?!\*)/g;
    while ((match = italicPattern.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        type: SegmentType.ITALIC,
        content: match[1]
      });
    }
    
    // Sort matches by position
    matches.sort((a, b) => a.start - b.start);
    
    // Process matches in order
    for (const formatMatch of matches) {
      // Add text before the match
      if (formatMatch.start > position) {
        const beforeText = text.substring(position, formatMatch.start);
        if (beforeText) {
          segments.push(new MessageSegment(SegmentType.TEXT, beforeText));
        }
      }
      
      // Add the formatted segment
      segments.push(new MessageSegment(formatMatch.type, formatMatch.content));
      
      // Update position
      position = formatMatch.end;
    }
    
    // Add any remaining text
    if (position < text.length) {
      const remainingText = text.substring(position);
      if (remainingText) {
        segments.push(new MessageSegment(SegmentType.TEXT, remainingText));
      }
    }
    
    // If no formatting found, return the original text
    if (segments.length === 0 && text) {
      segments.push(new MessageSegment(SegmentType.TEXT, text));
    }
    
    return segments;
  }
  
  /**
   * Convert segments back to plain text for list content
   */
  private _segmentsToText(segments: MessageSegment[]): string {
    return segments
      .map(segment => segment.content)
      .join('');
  }

  /**
   * Generic formatting parser
   */
  private _parseFormatting(
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
    // Look for business names that typically come before the database marker
    // Business names often contain "Safe Harbor Kings Point" or similar patterns
    // Try to match the last capitalized phrase before the end
    const lines = text.split('\n');
    const lastLine = lines[lines.length - 1] || text;
    
    // Match patterns like "Safe Harbor Kings Point - Location" or just "Business Name"
    const patterns = [
      // Pattern 1: "Name - Location" format
      /([A-Z][^\n]*?(?:Point|Park|Plaza|Center|Place|Company|Corp|Inc|LLC|Ltd))(?:\s*-[^\n]*)?$/,
      // Pattern 2: Simple business name at end
      /([A-Z][A-Za-z0-9\s&'.-]+?)(?:\s*[-:].*)?$/,
      // Pattern 3: Fallback to any capitalized phrase
      /([A-Z][^,.:;!?\n]*?)(?:\s*$)/
    ];
    
    for (const pattern of patterns) {
      const match = lastLine.match(pattern);
      if (match && match[1]) {
        // Clean up the match - remove trailing spaces and dashes
        let name = match[1].trim();
        // Remove trailing " -" if present
        name = name.replace(/\s*-\s*$/, '');
        return name;
      }
    }
    
    return "";
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