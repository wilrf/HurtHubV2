import { Send } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  handleSendMessage: () => void;
  isLoading: boolean;
  isDarkMode: boolean;
  module: 'business-intelligence' | 'community-pulse';
}

export function ChatInput({ input, setInput, handleSendMessage, isLoading, isDarkMode, module }: ChatInputProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={`Ask me about ${module === 'business-intelligence' ? 'business analytics and market insights' : 'community trends and business sentiment'}...`}
        disabled={isLoading}
        className="flex-1"
      />
      <Button
        onClick={handleSendMessage}
        disabled={!input.trim() || isLoading}
        size="sm"
        variant={isDarkMode ? 'glass' : 'default'}
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
