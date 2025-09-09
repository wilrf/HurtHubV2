import { Bot, User, CheckCircle2 } from "lucide-react";
import { useState, useMemo, useEffect } from "react";

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
          className={`p-3 rounded-lg ${isDarkMode ? "bg-sapphire-600 text-white" : "bg-sapphire-500 text-white"}`}
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
  const [hoveredBusiness, setHoveredBusiness] = useState<{
    name: string;
    x: number;
    y: number;
  } | null>(null);
  
  // Track business names found in the message for hover functionality
  const [businessNamesInMessage, setBusinessNamesInMessage] = useState<Set<string>>(new Set());

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
  
  // Extract business names from the message for hover detection
  useEffect(() => {
    const businessNames = new Set<string>();
    // Look for common business name patterns in the message
    const patterns = [
      /Safe Harbor Kings Point(?:\s*-\s*[^\n:,]+)?/g,
      /([A-Z][A-Za-z0-9\s&'.-]*(?:Point|Park|Plaza|Center|Place|Company|Corp|Inc|LLC|Ltd))(?=\s*[-:]|\s*\(|$)/g
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(message.content)) !== null) {
        if (match[0] || match[1]) {
          const name = (match[0] || match[1]).trim().replace(/\s*[-:]\s*$/, '');
          businessNames.add(name);
        }
      }
    });
    
    setBusinessNamesInMessage(businessNames);
  }, [message.content]);

  // Render parsed segments with proper line breaks
  const renderSegments = () => {
    // NO FALLBACKS - Let it fail if parsing fails (architectural principle)
    if (!parsedMessage.segments || parsedMessage.segments.length === 0) {
      throw new Error(`Message parsing failed: No segments found for content "${message.content.substring(0, 100)}"`);
    }
    
    // Group segments by lines for proper rendering
    const lines: JSX.Element[][] = [];
    let currentLine: JSX.Element[] = [];
    
    parsedMessage.segments.forEach((segment, index) => {
      // Check if this segment contains a newline
      if (segment.type === SegmentType.TEXT && segment.content.includes('\n')) {
        const parts = segment.content.split('\n');
        parts.forEach((part, partIndex) => {
          if (partIndex > 0) {
            // Start a new line
            if (currentLine.length > 0) {
              lines.push(currentLine);
              currentLine = [];
            }
          }
          if (part) {
            currentLine.push(<span key={`${index}-${partIndex}`}>{part}</span>);
          }
        });
        return;
      }
      
      switch (segment.type) {
        case SegmentType.DATABASE_INDICATOR: {
          const businessName = segment.getBusinessName();
          currentLine.push(
            <span
              key={index}
              className="inline-flex items-center ml-1 cursor-help relative group"
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setHoveredBusiness({
                  name: businessName || "",
                  x: rect.left,
                  y: rect.top,
                });
              }}
              onMouseLeave={() => setHoveredBusiness(null)}
              data-testid="db-indicator"
            >
              <span title="Verified in our database">
                <CheckCircle2
                  className="h-3.5 w-3.5 text-sapphire-400 hover:text-sapphire-300 transition-colors"
                />
              </span>
            </span>
          );
          break;
        }
        case SegmentType.BOLD:
          currentLine.push(
            <strong key={index} className="font-semibold text-foreground">
              {segment.content}
            </strong>
          );
          break;
        case SegmentType.ITALIC:
          currentLine.push(
            <em key={index} className="italic">
              {segment.content}
            </em>
          );
          break;
        case SegmentType.BULLET:
          // Start new line for bullet points
          if (currentLine.length > 0) {
            lines.push(currentLine);
            currentLine = [];
          }
          currentLine.push(
            <span key={index} className="text-muted-foreground">• </span>
          );
          break;
        case SegmentType.NUMBERED_LIST:
          // Start new line for numbered lists
          if (currentLine.length > 0) {
            lines.push(currentLine);
            currentLine = [];
          }
          currentLine.push(
            <span key={index} className="text-muted-foreground">
              {segment.getListNumber()}. 
            </span>
          );
          break;
        case SegmentType.TEXT:
        default: {
          // Check if this text contains any business names we should make hoverable
          let content = segment.content;
          let hasBusinessName = false;
          let businessNameFound = "";
          
          // Check if any known business name is in this segment
          businessNamesInMessage.forEach(businessName => {
            if (content.includes(businessName)) {
              hasBusinessName = true;
              businessNameFound = businessName;
            }
          });
          
          if (hasBusinessName && businessNameFound) {
            // Split the content around the business name and make it hoverable
            const parts = content.split(businessNameFound);
            const elements: JSX.Element[] = [];
            
            parts.forEach((part, partIndex) => {
              if (partIndex > 0) {
                // Add the business name as a hoverable element
                elements.push(
                  <span
                    key={`${index}-business-${partIndex}`}
                    className="cursor-help underline decoration-dotted decoration-sapphire-400/50 hover:decoration-sapphire-400 transition-colors"
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoveredBusiness({
                        name: businessNameFound,
                        x: rect.left,
                        y: rect.top,
                      });
                    }}
                    onMouseLeave={() => setHoveredBusiness(null)}
                  >
                    {businessNameFound}
                  </span>
                );
              }
              if (part) {
                elements.push(<span key={`${index}-text-${partIndex}`}>{part}</span>);
              }
            });
            
            currentLine.push(...elements);
          } else {
            currentLine.push(<span key={index}>{segment.content}</span>);
          }
          break;
        }
      }
    });
    
    // Add the last line if it has content
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }
    
    // Render lines as separate divs
    return lines.map((line, lineIndex) => (
      <div key={lineIndex} className="min-h-[1.5rem]">
        {line}
      </div>
    ));
  };

  return (
    <div className="flex items-start gap-3 justify-start relative">
      <div className="flex items-start gap-3 max-w-[85%] flex-row">
        <div
          className={`p-2 rounded-full flex-shrink-0 ${
            isDarkMode ? "bg-midnight-700" : "bg-gray-100"
          }`}
        >
          <Bot className="h-4 w-4 text-sapphire-400" />
        </div>
        <div
          className={`p-3 rounded-lg ${
            isDarkMode
              ? "bg-sapphire-900/20 border border-midnight-700"
              : "bg-gray-50 border"
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
      {hoveredBusiness && (
        <BusinessHoverCard
          businessName={hoveredBusiness.name}
          isDarkMode={isDarkMode}
          x={hoveredBusiness.x}
          y={hoveredBusiness.y}
          previewService={previewService}
        />
      )}
    </div>
  );
}

export function ChatMessage(props: ChatMessageProps) {
  if (props.message.role === "user") {
    return <UserMessage {...props} />;
  }
  return <AssistantMessage {...props} />;
}
