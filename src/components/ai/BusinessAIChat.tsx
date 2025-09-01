import { MessageSquare, Bot, Sparkles, BarChart3 } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
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
}

export function BusinessAIChat({
  module,
  className = "",
}: BusinessAIChatProps) {
  const isDarkMode = true; // Dark mode only
  const {
    messages,
    input,
    isLoading,
    messagesEndRef,
    setInput,
    handleSendMessage,
  } = useBusinessAIChat(module);

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <div className={`flex flex-col ${className}`}>
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

        <div className="flex-shrink-0 mt-auto">
          <ChatInput
            input={input}
            setInput={setInput}
            handleSendMessage={handleSendMessage}
            isLoading={isLoading}
            isDarkMode={isDarkMode}
            module={module}
          />
        </div>
      </CardContent>
    </div>
  );
}
