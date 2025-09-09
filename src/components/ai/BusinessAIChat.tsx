import { Bot } from "lucide-react";
import type { RefObject } from "react";

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
  // Optional: when provided, use these instead of internal hook
  externalMessages?: Message[];
  externalInput?: string;
  externalIsLoading?: boolean;
  externalSetInput?: (value: string) => void;
  externalHandleSendMessage?: () => void;
  externalMessagesEndRef?: RefObject<HTMLDivElement>;
}

export function BusinessAIChat({
  module,
  className = "",
  isWelcomeState = false,
  onFirstMessage,
  externalMessages,
  externalInput,
  externalIsLoading,
  externalSetInput,
  externalHandleSendMessage,
  externalMessagesEndRef,
}: BusinessAIChatProps) {
  const isDarkMode = true; // Dark mode only
  
  // Check if we should use external props (they're provided) or internal hook
  const hasExternalProps = externalMessages !== undefined;
  
  // Always call the hook to satisfy React's rules of hooks
  // But skip data loading if we're using external props (prevents duplicate loading)
  const internalHook = useBusinessAIChat(module, hasExternalProps);
  
  // Use external props when provided, otherwise use internal hook
  const messages = hasExternalProps ? (externalMessages ?? []) : internalHook.messages;
  const input = hasExternalProps ? (externalInput ?? "") : internalHook.input;
  const isLoading = hasExternalProps ? (externalIsLoading ?? false) : internalHook.isLoading;
  const setInput = hasExternalProps ? (externalSetInput ?? (() => {})) : internalHook.setInput;
  const messagesEndRef = hasExternalProps ? (externalMessagesEndRef ?? null) : internalHook.messagesEndRef;
  const originalHandleSendMessage = hasExternalProps ? (externalHandleSendMessage ?? (() => {})) : internalHook.handleSendMessage;

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
    // Welcome state - show messages if they exist, otherwise just input
    if (messages.length > 0) {
      // Messages exist, show them with input below
      return (
        <div className={`relative flex flex-col ${className}`}>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
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
          
          {/* Floating input at bottom */}
          <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
            <div className="bg-gradient-to-t from-midnight-900/80 via-midnight-900/40 to-transparent h-16 pointer-events-none" />
            <div className="bg-midnight-900/90 backdrop-blur-md p-4 pt-2 pb-6 pointer-events-auto shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.15)]">
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
        </div>
      );
    }
    
    // No messages yet, just show input
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
    <div className={`relative flex flex-col ${className}`}>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
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
      
      {/* Floating input at bottom */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <div className="bg-gradient-to-t from-midnight-900/80 via-midnight-900/40 to-transparent h-16 pointer-events-none" />
        <div className="bg-midnight-900/90 backdrop-blur-md p-4 pt-2 pb-6 pointer-events-auto shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.15)]">
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
    </div>
  );
}
