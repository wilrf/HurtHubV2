import { Heart, MapPin, Network, TrendingUp } from "lucide-react";

interface CommunityPromptsProps {
  onPromptSelect: (prompt: string) => void;
  className?: string;
}

const prompts = [
  {
    icon: Heart,
    text: "Business sentiment",
    prompt: "What's the business sentiment in different neighborhoods?",
  },
  {
    icon: Network,
    text: "Business collaborations",
    prompt: "How are local businesses collaborating?",
  },
  {
    icon: TrendingUp,
    text: "Growing communities",
    prompt: "Which communities show strong economic growth?",
  },
  {
    icon: MapPin,
    text: "Business clusters",
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
              flex items-center gap-2 py-1.5 px-3
              min-h-[32px] max-h-[32px]
              ${isDarkMode 
                ? "bg-midnight-800/20 hover:bg-midnight-800/30 border-midnight-600/20 text-gray-500 hover:text-gray-400" 
                : "bg-white hover:bg-gray-50 border-gray-200"
              }
              border rounded-lg
              transition-all duration-200 
              text-left group cursor-pointer text-sm
            `}
          >
            <Icon
              className={`h-3.5 w-3.5 flex-shrink-0 ${
                isDarkMode ? "text-sapphire-500/70" : "text-blue-500"
              } group-hover:scale-110 transition-transform`}
            />
            <span
              className={`text-xs line-clamp-2 ${
                isDarkMode ? "text-gray-500" : "text-gray-700"
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