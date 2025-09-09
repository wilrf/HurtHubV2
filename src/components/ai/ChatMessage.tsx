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

  // Render parsed segments
  const renderSegments = () => {
    // NO FALLBACKS - Let it fail if parsing fails (architectural principle)
    if (!parsedMessage.segments || parsedMessage.segments.length === 0) {
      throw new Error(`Message parsing failed: No segments found for content "${message.content.substring(0, 100)}"`);
    }
    
    return parsedMessage.segments.map((segment, index) => {
      switch (segment.type) {
        case SegmentType.DATABASE_INDICATOR: {
          const businessName = segment.getBusinessName();
          return (
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
        }
        case SegmentType.BOLD:
          return (
            <strong key={index} className="font-semibold text-foreground">
              {segment.content}
            </strong>
          );
        case SegmentType.ITALIC:
          return (
            <em key={index} className="italic">
              {segment.content}
            </em>
          );
        case SegmentType.BULLET:
          // New architecture: bullet markers have empty content
          // Content follows in subsequent segments
          return (
            <span key={index} className="text-muted-foreground">• </span>
          );
        case SegmentType.NUMBERED_LIST:
          // New architecture: numbered list markers have empty content
          // Content follows in subsequent segments
          return (
            <span key={index} className="text-muted-foreground">
              {segment.getListNumber()}. 
            </span>
          );
        case SegmentType.TEXT:
        default:
          return <span key={index}>{segment.content}</span>;
      }
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
          className={`p-3 rounded-lg ${
            isDarkMode
              ? "bg-sapphire-900/20 border border-midnight-700"
              : "bg-gray-50 border"
          }`}
        >
          <div className="text-sm leading-relaxed space-y-1">
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
