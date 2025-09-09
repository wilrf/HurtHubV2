import { Bot, User, CheckCircle2 } from "lucide-react";
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
          // Render the business name as hoverable with dotted underline
          // The database indicator now represents the business name itself
          if (businessName) {
            currentLine.push(
              <span
                key={index}
                className="cursor-help text-sapphire-600 dark:text-sapphire-400 font-medium underline decoration-dotted decoration-2 decoration-sapphire-400/50 hover:decoration-sapphire-400 hover:bg-sapphire-50 dark:hover:bg-sapphire-900/20 px-1 rounded transition-all duration-200"
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoveredBusiness({
                    name: businessName,
                    x: rect.left,
                    y: rect.top,
                  });
                }}
                onMouseLeave={() => setHoveredBusiness(null)}
                data-testid="db-business-name"
              >
                {businessName}
              </span>
            );
          }
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
            <span key={index} className="text-muted-foreground mr-2">•</span>
          );
          break;
        case SegmentType.NUMBERED_LIST:
          // Start new line for numbered lists
          if (currentLine.length > 0) {
            lines.push(currentLine);
            currentLine = [];
          }
          currentLine.push(
            <span key={index} className="text-muted-foreground mr-2">
              {segment.getListNumber()}.
            </span>
          );
          break;
        case SegmentType.TEXT:
        default:
          currentLine.push(<span key={index}>{segment.content}</span>);
          break;
      }
    });
    
    // Add the last line if it has content
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }
    
    // Render lines as separate divs with proper spacing
    return lines.map((line, lineIndex) => {
      // Check if this line starts with a list marker (bullet or number)
      const isListItem = line.some(element => {
        const spanProps = element.props;
        return spanProps?.children === '•' || 
               (typeof spanProps?.children === 'string' && /^\d+\.$/.test(spanProps.children));
      });
      
      // Check if this is an empty line (paragraph break)
      const isEmpty = line.length === 0 || (line.length === 1 && line[0].props?.children === '');
      
      return (
        <div 
          key={lineIndex} 
          className={`
            ${isEmpty ? 'h-2' : 'min-h-[1.5rem]'} 
            ${isListItem ? 'mb-3 flex items-start' : 'mb-1'}
          `}
        >
          {line}
        </div>
      );
    });
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
          className={`p-4 rounded-lg ${
            isDarkMode
              ? "bg-sapphire-900/20 border border-midnight-700"
              : "bg-gray-50 border"
          }`}
        >
          <div className="text-sm leading-7 space-y-1">
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
