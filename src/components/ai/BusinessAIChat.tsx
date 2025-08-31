import { MessageSquare, Bot, Sparkles, BarChart3 } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useBusinessAIChat } from '@/hooks/useBusinessAIChat';

import { ChatInput } from './ChatInput';
import { ChatMessage } from './ChatMessage';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface BusinessAIChatProps {
  module: 'business-intelligence' | 'community-pulse';
  className?: string;
}

export function BusinessAIChat({ module, className = '' }: BusinessAIChatProps) {
  const isDarkMode = true; // Dark mode only
  const {
    messages,
    input,
    isLoading,
    messagesEndRef,
    setInput,
    handleSendMessage
  } = useBusinessAIChat(module);

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <Card variant={isDarkMode ? 'glass' : 'elevated'} className={`h-[600px] flex flex-col ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg">
          {module === 'business-intelligence' ? (
            <>
              <BarChart3 className="h-5 w-5 mr-2" />
              Business Intelligence AI
            </>
          ) : (
            <>
              <MessageSquare className="h-5 w-5 mr-2" />
              Community Pulse AI
            </>
          )}
          <Badge variant="secondary" className="ml-2 text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            Powered by GPT-4
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-4">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
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
              <div className={`p-2 rounded-full ${isDarkMode ? 'bg-midnight-700' : 'bg-gray-100'}`}>
                <Bot className="h-4 w-4 text-sapphire-400" />
              </div>
              <div className={`p-3 rounded-lg ${
                isDarkMode ? 'bg-sapphire-900/20 border border-midnight-700' : 'bg-gray-50 border'
              }`}>
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

        <ChatInput
          input={input}
          setInput={setInput}
          handleSendMessage={handleSendMessage}
          isLoading={isLoading}
          isDarkMode={isDarkMode}
          module={module}
        />
      </CardContent>
    </Card>
  );
}
