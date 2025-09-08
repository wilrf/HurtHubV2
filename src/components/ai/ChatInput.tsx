import { Send } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  handleSendMessage: () => void;
  isLoading: boolean;
  isDarkMode: boolean;
  module: "business-intelligence" | "community-pulse";
}

export function ChatInput({
  input,
  setInput,
  handleSendMessage,
  isLoading,
  isDarkMode,
  module,
}: ChatInputProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex-1 relative">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={`Ask me about ${module === "business-intelligence" ? "business analytics and market insights" : "community trends and business sentiment"}...`}
          disabled={isLoading}
          variant={isDarkMode ? "midnight" : "default"}
          className="w-full pr-12 py-3 text-base"
        />
        <Button
          onClick={handleSendMessage}
          disabled={!input.trim() || isLoading}
          size="sm"
          variant="ghost"
          className="absolute right-1 top-1/2 -translate-y-1/2 p-2 hover:bg-sapphire-600/20"
        >
          <Send className="h-4 w-4 text-sapphire-400" />
        </Button>
      </div>
    </div>
  );
}
