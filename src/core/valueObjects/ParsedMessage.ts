/**
 * Value Objects for parsed message content
 * Following Domain-Driven Design - immutable value objects
 */

export enum SegmentType {
  TEXT = "TEXT",
  BOLD = "BOLD",
  ITALIC = "ITALIC",
  BULLET = "BULLET",
  NUMBERED_LIST = "NUMBERED_LIST",
  DATABASE_INDICATOR = "DATABASE_INDICATOR",
}

/**
 * Immutable value object representing a segment of a parsed message
 */
export class MessageSegment {
  constructor(
    public readonly type: SegmentType,
    public readonly content: string,
    public readonly metadata: Record<string, any> = {}
  ) {
    Object.freeze(this);
    Object.freeze(this.metadata);
  }

  /**
   * Check if this segment has a specific type
   */
  isType(type: SegmentType): boolean {
    return this.type === type;
  }

  /**
   * Get business name if this is a database indicator
   */
  getBusinessName(): string | undefined {
    if (this.type === SegmentType.DATABASE_INDICATOR) {
      return this.metadata.businessName as string;
    }
    return undefined;
  }

  /**
   * Get list number if this is a numbered list item
   */
  getListNumber(): number | undefined {
    if (this.type === SegmentType.NUMBERED_LIST) {
      return this.metadata.number as number;
    }
    return undefined;
  }
}

/**
 * Immutable value object representing a fully parsed message
 */
export class ParsedMessage {
  constructor(
    public readonly segments: ReadonlyArray<MessageSegment>
  ) {
    Object.freeze(this);
    Object.freeze(this.segments);
  }

  /**
   * Check if message contains any database references
   */
  hasDatabaseReferences(): boolean {
    return this.segments.some(
      segment => segment.type === SegmentType.DATABASE_INDICATOR
    );
  }

  /**
   * Get all business names referenced from database
   */
  getDatabaseBusinessNames(): string[] {
    return this.segments
      .filter(segment => segment.type === SegmentType.DATABASE_INDICATOR)
      .map(segment => segment.getBusinessName())
      .filter((name): name is string => name !== undefined);
  }

  /**
   * Get segments of a specific type
   */
  getSegmentsByType(type: SegmentType): ReadonlyArray<MessageSegment> {
    return this.segments.filter(segment => segment.type === type);
  }

  /**
   * Convert to plain text (strips all formatting)
   */
  toPlainText(): string {
    return this.segments
      .map(segment => {
        switch (segment.type) {
          case SegmentType.DATABASE_INDICATOR:
            return `(from our database)`;
          case SegmentType.BULLET:
            return `• ${segment.content}`;
          case SegmentType.NUMBERED_LIST:
            return `${segment.getListNumber()}. ${segment.content}`;
          default:
            return segment.content;
        }
      })
      .join("");
  }

  /**
   * Check if the message is empty
   */
  isEmpty(): boolean {
    if (this.segments.length === 0) return true;
    
    // New architecture: NUMBERED_LIST and BULLET segments have empty content by design
    // Check if we have ANY segments with actual content or any list markers
    return !this.segments.some(segment => 
      segment.content.trim() || 
      segment.type === SegmentType.NUMBERED_LIST || 
      segment.type === SegmentType.BULLET ||
      segment.type === SegmentType.DATABASE_INDICATOR
    );
  }
}