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
          placeholder={module === "business-intelligence" ? "Ask about Charlotte businesses..." : "Ask about community trends..."}
          disabled={isLoading}
          variant={isDarkMode ? "midnight" : "default"}
          className="w-full py-3 px-4 text-base bg-midnight-800/60 border-midnight-600/40 rounded-xl focus:bg-midnight-700/80 focus:border-midnight-500/60 transition-all duration-200 text-foreground placeholder:text-muted-foreground/80"
        />
      </div>
    </div>
  );
}
