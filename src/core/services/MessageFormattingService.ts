/**
 * Domain Service for parsing and formatting AI chat messages
 * Following Clean Architecture - contains business logic for message processing
 */

import { ParsedMessage, MessageSegment, SegmentType } from "@/core/valueObjects/ParsedMessage";

export class MessageFormattingService {
  /**
   * Parse AI response content with XML-like tags into structured segments
   * Much simpler and more reliable than regex-based parsing
   */
  parseAIResponse(content: string): ParsedMessage {
    const segments = this.parseXMLTags(content);
    return new ParsedMessage(segments);
  }

  /**
   * Parse XML-like tags from AI response
   * Handles: <p>, <list>, <item>, <business> tags
   */
  private parseXMLTags(content: string): MessageSegment[] {
    const segments: MessageSegment[] = [];
    let position = 0;
    
    // Handle empty content
    if (!content || content.trim().length === 0) {
      return [new MessageSegment(SegmentType.TEXT, 'No response available')];
    }
    
    // Parse content character by character to handle nested tags
    while (position < content.length) {
      // Look for opening tags
      if (content[position] === '<') {
        const tagEnd = content.indexOf('>', position);
        if (tagEnd === -1) {
          // No closing bracket, treat as text
          segments.push(new MessageSegment(SegmentType.TEXT, content.substring(position)));
          break;
        }
        
        const fullTag = content.substring(position, tagEnd + 1);
        const tagContent = fullTag.substring(1, fullTag.length - 1);
        
        // Handle different tag types
        if (tagContent.startsWith('p')) {
          // Paragraph tag
          const closeTag = '</p>';
          const contentEnd = content.indexOf(closeTag, tagEnd);
          if (contentEnd !== -1) {
            const paragraphContent = content.substring(tagEnd + 1, contentEnd);
            const parsedContent = this.parseInlineContent(paragraphContent);
            segments.push(...parsedContent);
            segments.push(new MessageSegment(SegmentType.TEXT, '\n\n')); // Add paragraph spacing
            position = contentEnd + closeTag.length;
          } else {
            position++;
          }
        } else if (tagContent.startsWith('list')) {
          // List tag - extract type attribute
          const typeMatch = tagContent.match(/type="(numbered|bullet)"/);
          const listType = typeMatch ? typeMatch[1] : 'bullet';
          
          const closeTag = '</list>';
          const contentEnd = content.indexOf(closeTag, tagEnd);
          if (contentEnd !== -1) {
            const listContent = content.substring(tagEnd + 1, contentEnd);
            const listSegments = this.parseListContent(listContent, listType);
            segments.push(...listSegments);
            position = contentEnd + closeTag.length;
          } else {
            position++;
          }
        } else if (tagContent === '/p' || tagContent === '/list' || tagContent === '/item' || tagContent === '/business') {
          // Skip closing tags as they're handled with their opening tags
          position = tagEnd + 1;
        } else {
          // Unknown tag, treat as text
          segments.push(new MessageSegment(SegmentType.TEXT, fullTag));
          position = tagEnd + 1;
        }
      } else {
        // Regular text - find next tag or end of content
        const nextTag = content.indexOf('<', position);
        const textEnd = nextTag === -1 ? content.length : nextTag;
        const text = content.substring(position, textEnd);
        
        if (text.trim()) {
          segments.push(new MessageSegment(SegmentType.TEXT, text));
        }
        position = textEnd;
      }
    }
    
    return segments;
  }

  /**
   * Parse list content with proper item handling
   */
  private parseListContent(content: string, listType: string): MessageSegment[] {
    const segments: MessageSegment[] = [];
    let itemNumber = 1;
    
    // Find all <item> tags
    let position = 0;
    while (position < content.length) {
      const itemStart = content.indexOf('<item>', position);
      if (itemStart === -1) break;
      
      const itemEnd = content.indexOf('</item>', itemStart);
      if (itemEnd === -1) break;
      
      const itemContent = content.substring(itemStart + 6, itemEnd);
      
      // Add list marker
      if (listType === 'numbered') {
        segments.push(new MessageSegment(
          SegmentType.NUMBERED_LIST,
          '',
          { number: itemNumber++ }
        ));
      } else {
        segments.push(new MessageSegment(SegmentType.BULLET, ''));
      }
      
      // Parse item content for business tags
      const itemSegments = this.parseInlineContent(itemContent);
      segments.push(...itemSegments);
      
      // Add line break after item
      segments.push(new MessageSegment(SegmentType.TEXT, '\n'));
      
      position = itemEnd + 7; // Move past </item>
    }
    
    return segments;
  }
  
  /**
   * Parse inline content for business tags
   */
  private parseInlineContent(content: string): MessageSegment[] {
    const segments: MessageSegment[] = [];
    let position = 0;
    
    while (position < content.length) {
      // Look for business tags
      const businessStart = content.indexOf('<business', position);
      
      if (businessStart === -1) {
        // No more business tags, add remaining text
        const remainingText = content.substring(position);
        if (remainingText.trim()) {
          segments.push(new MessageSegment(SegmentType.TEXT, remainingText));
        }
        break;
      }
      
      // Add text before the business tag
      if (businessStart > position) {
        const beforeText = content.substring(position, businessStart);
        if (beforeText.trim()) {
          segments.push(new MessageSegment(SegmentType.TEXT, beforeText));
        }
      }
      
      // Parse the business tag
      const tagEnd = content.indexOf('>', businessStart);
      const businessEnd = content.indexOf('</business>', businessStart);
      
      if (tagEnd !== -1 && businessEnd !== -1) {
        const tagContent = content.substring(businessStart, tagEnd + 1);
        const businessName = content.substring(tagEnd + 1, businessEnd);
        
        // Check if it's from database
        const isFromDatabase = tagContent.includes('db="true"');
        
        if (isFromDatabase) {
          // Add as database indicator
          segments.push(new MessageSegment(
            SegmentType.DATABASE_INDICATOR,
            '',
            { businessName: businessName.trim() }
          ));
        } else {
          // Add as regular text with special styling
          segments.push(new MessageSegment(
            SegmentType.TEXT,
            businessName.trim()
          ));
        }
        
        position = businessEnd + 11; // Move past </business>
      } else {
        // Malformed tag, treat as text
        segments.push(new MessageSegment(SegmentType.TEXT, '<business'));
        position = businessStart + 9;
      }
    }
    
    return segments;
  }
}

// Export singleton instance
export const messageFormattingService = new MessageFormattingService();