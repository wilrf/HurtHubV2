import { Bot, User } from "lucide-react";
import { useState, useMemo } from "react";

import type { Message } from "./BusinessAIChat";
import { messageFormattingService } from "@/core/services/MessageFormattingService";
import { BusinessPreviewService } from "@/application/services/BusinessPreviewService";
import { businessRepositoryAdapter } from "@/infrastructure/adapters/BusinessRepositoryAdapter";
import { BusinessHoverCard } from "./BusinessHoverCard";
import { SegmentType } from "@/core/valueObjects/ParsedMessage";

interface ChatMessageProps {
  message: Message;
  isDarkMode: boolean;
  onSuggestionClick: (suggestion: string) => void;
}

function UserMessage({
  message,
  isDarkMode,
}: Pick<ChatMessageProps, "message" | "isDarkMode">) {
  return (
    <div className="flex items-start gap-3 justify-end">
      <div className="flex items-start gap-3 max-w-[85%] flex-row-reverse">
        <div
          className={`p-2 rounded-full flex-shrink-0 ${isDarkMode ? "bg-sapphire-900/20" : "bg-sapphire-900/20"}`}
        >
          <User
            className={`h-4 w-4 ${isDarkMode ? "text-sapphire-400" : "text-sapphire-500"}`}
          />
        </div>
        <div
          className={`p-3 rounded-lg shadow-md ${isDarkMode ? "bg-sapphire-600/90 text-white" : "bg-sapphire-500 text-white"}`}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          <p className="text-xs opacity-70 mt-2">
            {message.timestamp.toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
}

function AssistantMessage({
  message,
  isDarkMode,
  onSuggestionClick,
}: ChatMessageProps) {
  const [hoveredBusinessName, setHoveredBusinessName] = useState<string | null>(null);

  // Create service instance (in production, this would be injected)
  const previewService = useMemo(
    () => new BusinessPreviewService(businessRepositoryAdapter),
    []
  );

  // Parse the message content using the domain service
  const parsedMessage = useMemo(
    () => messageFormattingService.parseAIResponse(message.content),
    [message.content]
  );

  // Render parsed segments with proper formatting
  const renderSegments = () => {
    // NO FALLBACKS - Let it fail if parsing fails (architectural principle)
    if (!parsedMessage.segments || parsedMessage.segments.length === 0) {
      throw new Error(`Message parsing failed: No segments found for content "${message.content.substring(0, 100)}"`);
    }
    
    const elements: JSX.Element[] = [];
    let currentListItems: JSX.Element[] = [];
    let listType: 'numbered' | 'bullet' | null = null;
    let listItemNumber = 1;
    
    // Helper to flush any pending list
    const flushList = () => {
      if (currentListItems.length > 0) {
        elements.push(
          <div key={`list-${elements.length}`} className="space-y-3 my-4">
            {currentListItems}
          </div>
        );
        currentListItems = [];
        listType = null;
        listItemNumber = 1;
      }
    };
    
    parsedMessage.segments.forEach((segment, index) => {
      switch (segment.type) {
        case SegmentType.NUMBERED_LIST:
        case SegmentType.BULLET: {
          // Starting a new list item
          if (listType && listType !== (segment.type === SegmentType.NUMBERED_LIST ? 'numbered' : 'bullet')) {
            flushList(); // Different list type, flush previous
          }
          
          listType = segment.type === SegmentType.NUMBERED_LIST ? 'numbered' : 'bullet';
          
          // Collect all segments until the next list marker or end
          const itemContent: JSX.Element[] = [];
          let nextIndex = index + 1;
          
          while (
            nextIndex < parsedMessage.segments.length &&
            parsedMessage.segments[nextIndex].type !== SegmentType.NUMBERED_LIST &&
            parsedMessage.segments[nextIndex].type !== SegmentType.BULLET
          ) {
            const nextSegment = parsedMessage.segments[nextIndex];
            
            if (nextSegment.type === SegmentType.DATABASE_INDICATOR) {
              const businessName = nextSegment.getBusinessName();
              if (businessName) {
                itemContent.push(
                  <span
                    key={`business-${nextIndex}`}
                    className="relative inline-block"
                  >
                    <span 
                      className="cursor-pointer text-sapphire-600 dark:text-sapphire-400 font-medium underline decoration-dotted decoration-2 decoration-sapphire-400/50 hover:decoration-sapphire-400 hover:bg-sapphire-50 dark:hover:bg-sapphire-900/20 px-0.5 rounded transition-all duration-200"
                      onMouseEnter={() => setHoveredBusinessName(businessName)}
                      onMouseLeave={() => setHoveredBusinessName(null)}
                    >
                      {businessName}
                    </span>
                    {hoveredBusinessName === businessName && (
                      <div className="absolute z-50 top-full left-1/2 transform -translate-x-1/2 mt-2">
                        <BusinessHoverCard
                          businessName={businessName}
                          isDarkMode={isDarkMode}
                          x={0}
                          y={0}
                          previewService={previewService}
                        />
                      </div>
                    )}
                  </span>
                );
              }
            } else if (nextSegment.type === SegmentType.TEXT) {
              // Skip pure newline segments in list context
              if (nextSegment.content.trim() || !nextSegment.content.includes('\n')) {
                itemContent.push(
                  <span key={`text-${nextIndex}`}>{nextSegment.content}</span>
                );
              }
            }
            
            nextIndex++;
          }
          
          // Create list item with grid layout
          currentListItems.push(
            <div key={`item-${index}`} className="grid grid-cols-[auto,1fr] gap-3">
              <span className="text-muted-foreground mt-0.5 select-none">
                {listType === 'numbered' ? `${listItemNumber++}.` : '•'}
              </span>
              <div className="space-y-1">
                {itemContent}
              </div>
            </div>
          );
          break;
        }
        
        case SegmentType.DATABASE_INDICATOR: {
          // If we're not in a list, flush any pending list
          if (!listType) {
            flushList();
            const businessName = segment.getBusinessName();
            if (businessName) {
              elements.push(
                <span
                  key={index}
                  className="relative inline-block"
                >
                  <span
                    className="cursor-pointer text-sapphire-600 dark:text-sapphire-400 font-medium underline decoration-dotted decoration-2 decoration-sapphire-400/50 hover:decoration-sapphire-400 hover:bg-sapphire-50 dark:hover:bg-sapphire-900/20 px-0.5 rounded transition-all duration-200"
                    onMouseEnter={() => setHoveredBusinessName(businessName)}
                    onMouseLeave={() => setHoveredBusinessName(null)}
                  >
                    {businessName}
                  </span>
                  {hoveredBusinessName === businessName && (
                    <div className="absolute z-50 top-full left-1/2 transform -translate-x-1/2 mt-2">
                      <BusinessHoverCard
                        businessName={businessName}
                        isDarkMode={isDarkMode}
                        x={0}
                        y={0}
                        previewService={previewService}
                      />
                    </div>
                  )}
                </span>
              );
            }
          }
          break;
        }
        
        case SegmentType.TEXT: {
          // Only process if not handled by list logic
          if (!listType || index === 0) {
            flushList();
            
            // Handle paragraph breaks
            if (segment.content === '\n\n') {
              elements.push(<div key={index} className="h-4" />);
            } else if (segment.content.trim()) {
              elements.push(
                <span key={index}>{segment.content}</span>
              );
            }
          }
          break;
        }
        
        default:
          if (!listType) {
            elements.push(
              <span key={index}>{segment.content}</span>
            );
          }
          break;
      }
    });
    
    // Flush any remaining list
    flushList();
    
    return <div className="space-y-2">{elements}</div>;
  };

  return (
    <div className="flex items-start gap-3 justify-start relative">
      <div className="flex items-start gap-3 max-w-[85%] flex-row">
        <div
          className={`p-2 rounded-full flex-shrink-0 mt-0.5 ${
            isDarkMode ? "bg-slate-700/80 ring-1 ring-slate-600/30" : "bg-gray-100"
          }`}
        >
          <Bot className="h-4 w-4 text-sapphire-400" />
        </div>
        <div
          className={`p-4 rounded-lg ${
            isDarkMode
              ? "bg-slate-800/60 border border-slate-700/50 shadow-lg"
              : "bg-white border border-gray-200 shadow-sm"
          }`}
        >
          <div className="text-sm leading-relaxed">
            {renderSegments()}
          </div>
          <p className="text-xs opacity-70 mt-2">
            {message.timestamp.toLocaleTimeString()}
          </p>
          {message.suggestions && (
            <div className="mt-3 space-y-2">
              <p className="text-xs opacity-80">Suggested questions:</p>
              {message.suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => onSuggestionClick(suggestion)}
                  className={`block w-full text-left text-xs p-2 rounded border ${
                    isDarkMode
                      ? "border-midnight-600 hover:bg-midnight-700"
                      : "border-gray-200 hover:bg-gray-100"
                  } transition-colors`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ChatMessage(props: ChatMessageProps) {
  if (props.message.role === "user") {
    return <UserMessage {...props} />;
  }
  return <AssistantMessage {...props} />;
}
