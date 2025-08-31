import { Bot, User } from 'lucide-react';

import type { Message } from './BusinessAIChat';

interface ChatMessageProps {
  message: Message;
  isDarkMode: boolean;
  onSuggestionClick: (suggestion: string) => void;
}

function UserMessage({ message, isDarkMode }: Pick<ChatMessageProps, 'message' | 'isDarkMode'>) {
  return (
    <div className="flex items-start gap-3 justify-end">
      <div className="flex items-start gap-3 max-w-[85%] flex-row-reverse">
        <div className={`p-2 rounded-full flex-shrink-0 ${isDarkMode ? 'bg-sapphire-900/20' : 'bg-sapphire-900/20'}`}>
          <User className={`h-4 w-4 ${isDarkMode ? 'text-sapphire-400' : 'text-sapphire-500'}`} />
        </div>
        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-sapphire-600 text-white' : 'bg-sapphire-500 text-white'}`}>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          <p className="text-xs opacity-70 mt-2">
            {message.timestamp.toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
}

function AssistantMessage({ message, isDarkMode, onSuggestionClick }: ChatMessageProps) {
  return (
    <div className="flex items-start gap-3 justify-start">
      <div className="flex items-start gap-3 max-w-[85%] flex-row">
        <div className={`p-2 rounded-full flex-shrink-0 ${isDarkMode ? 'bg-midnight-700' : 'bg-gray-100'}`}>
          <Bot className="h-4 w-4 text-sapphire-400" />
        </div>
        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-sapphire-900/20 border border-midnight-700' : 'bg-gray-50 border'}`}>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
                      ? 'border-midnight-600 hover:bg-midnight-700' 
                      : 'border-gray-200 hover:bg-gray-100'
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
  if (props.message.role === 'user') {
    return <UserMessage {...props} />;
  }
  return <AssistantMessage {...props} />;
}