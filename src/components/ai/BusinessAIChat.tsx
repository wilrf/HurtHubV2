import { Bot } from "lucide-react";

import { CardContent } from "@/components/ui/Card";
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

  // Only show messages area if we have messages or are not in welcome state
  const showMessages = messages.length > 0 || !isWelcomeState;

  return (
    <div className={`flex flex-col ${className}`}>
      {isWelcomeState ? (
        /* Welcome state - clean input with subtle background */
        <div className="bg-midnight-800/30 backdrop-blur-sm rounded-2xl p-1">
          <ChatInput
            input={input}
            setInput={setInput}
            handleSendMessage={handleSendMessage}
            isLoading={isLoading}
            isDarkMode={isDarkMode}
            module={module}
          />
        </div>
      ) : (
        /* Chat state - full interface with fixed input */
        <>
          <CardContent className="flex-1 flex flex-col p-4 min-h-0">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 min-h-0 scrollbar-thin scrollbar-thumb-midnight-700 scrollbar-track-transparent">
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
                  <div
                    className={`p-2 rounded-full ${isDarkMode ? "bg-midnight-700" : "bg-gray-100"}`}
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
          </CardContent>
          
          {/* Fixed input at bottom of chat */}
          <div className="sticky bottom-0 left-0 right-0 bg-midnight-900/95 backdrop-blur-md border-t border-midnight-700 p-4 z-50">
            <ChatInput
              input={input}
              setInput={setInput}
              handleSendMessage={handleSendMessage}
              isLoading={isLoading}
              isDarkMode={isDarkMode}
              module={module}
            />
          </div>
        </>
      )}
    </div>
  );
}
