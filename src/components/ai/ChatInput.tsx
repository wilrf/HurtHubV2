import { Input } from "@/components/ui/Input";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  handleSendMessage: () => void;
  isLoading: boolean;
  isDarkMode: boolean;
  module: "business-intelligence" | "community-pulse";
  isWelcomeState?: boolean;
}

export function ChatInput({
  input,
  setInput,
  handleSendMessage,
  isLoading,
  isDarkMode,
  module,
  isWelcomeState = false,
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
          className={`w-full py-4 px-5 text-base rounded-xl transition-all duration-200 text-foreground placeholder:text-muted-foreground/60 ${
            isWelcomeState 
              ? "bg-midnight-900/90 border-2 border-sapphire-500/50 shadow-md focus:border-sapphire-500 focus:bg-midnight-900" 
              : "bg-midnight-900 border border-midnight-500/70 focus:border-sapphire-500 focus:ring-2 focus:ring-sapphire-500/30 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_-20px_50px_-5px_rgba(59,130,246,0.25),0_-15px_35px_-5px_rgba(17,24,39,0.9),0_10px_40px_-5px_rgba(0,0,0,0.5),0_0_80px_15px_rgba(0,0,0,0.4)] backdrop-blur-xl"
          }`}
        />
      </div>
    </div>
  );
}
