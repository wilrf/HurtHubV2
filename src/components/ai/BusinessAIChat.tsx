import { Bot } from "lucide-react";

import { useBusinessAIChat } from "@/hooks/useBusinessAIChat";

import { ChatInput } from "./ChatInput";
import { ChatMessage } from "./ChatMessage";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface BusinessAIChatProps {
  module: "business-intelligence" | "community-pulse";
  className?: string;
  isWelcomeState?: boolean;
  onFirstMessage?: () => void;
}

export function BusinessAIChat({
  module,
  className = "",
  isWelcomeState = false,
  onFirstMessage,
}: BusinessAIChatProps) {
  const isDarkMode = true; // Dark mode only
  const {
    messages,
    input,
    isLoading,
    messagesEndRef,
    setInput,
    handleSendMessage: originalHandleSendMessage,
  } = useBusinessAIChat(module);

  const handleSendMessage = () => {
    if (isWelcomeState && onFirstMessage) {
      onFirstMessage();
    }
    originalHandleSendMessage();
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  if (isWelcomeState) {
    // Welcome state - just the input
    return (
      <ChatInput
        input={input}
        setInput={setInput}
        handleSendMessage={handleSendMessage}
        isLoading={isLoading}
        isDarkMode={isDarkMode}
        module={module}
      />
    );
  }

  // Chat state - full interface
  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            isDarkMode={isDarkMode}
            onSuggestionClick={handleSuggestionClick}
          />
        ))}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-full ${isDarkMode ? "bg-midnight-700" : "bg-gray-100"}`}>
              <Bot className="h-4 w-4 text-sapphire-400" />
            </div>
            <div
              className={`p-3 rounded-lg ${
                isDarkMode
                  ? "bg-sapphire-900/20 border border-midnight-700"
                  : "bg-gray-50 border"
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
      
      {/* Input at bottom */}
      <div className="border-t border-midnight-700 bg-midnight-900/95 backdrop-blur-sm p-4">
        <ChatInput
          input={input}
          setInput={setInput}
          handleSendMessage={handleSendMessage}
          isLoading={isLoading}
          isDarkMode={isDarkMode}
          module={module}
        />
      </div>
    </div>
  );
}
