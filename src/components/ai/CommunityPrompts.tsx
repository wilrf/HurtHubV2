import { Heart, MapPin, Network, TrendingUp } from "lucide-react";

interface CommunityPromptsProps {
  onPromptSelect: (prompt: string) => void;
  className?: string;
}

const prompts = [
  {
    icon: Heart,
    text: "What's the business sentiment?",
    prompt: "What's the business sentiment in different neighborhoods?",
  },
  {
    icon: Network,
    text: "How are businesses collaborating?",
    prompt: "How are local businesses collaborating?",
  },
  {
    icon: TrendingUp,
    text: "Which communities show growth?",
    prompt: "Which communities show strong economic growth?",
  },
  {
    icon: MapPin,
    text: "Tell me about clustering patterns",
    prompt: "Tell me about business clustering patterns",
  },
];

export function CommunityPrompts({
  onPromptSelect,
  className = "",
}: CommunityPromptsProps) {
  const isDarkMode = true; // Dark mode only

  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-2 ${className}`}>
      {prompts.map((prompt, index) => {
        const Icon = prompt.icon;
        return (
          <button
            key={index}
            onClick={() => onPromptSelect(prompt.prompt)}
            className={`
              flex items-center gap-2 p-2.5 
              ${isDarkMode 
                ? "bg-midnight-800/40 hover:bg-midnight-700/50 border-midnight-700" 
                : "bg-white hover:bg-gray-50 border-gray-200"
              }
              border rounded-lg
              transition-all duration-200 
              hover:scale-[1.02] hover:shadow-sm
              text-left group cursor-pointer
            `}
          >
            <Icon
              className={`h-4 w-4 flex-shrink-0 ${
                isDarkMode ? "text-sapphire-400" : "text-blue-500"
              } group-hover:scale-110 transition-transform`}
            />
            <span
              className={`text-xs ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              {prompt.text}
            </span>
          </button>
        );
      })}
    </div>
  );
}