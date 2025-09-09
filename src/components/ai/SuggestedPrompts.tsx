import { BarChart3, MapPin, TrendingUp, Users } from "lucide-react";

interface SuggestedPromptsProps {
  onPromptSelect: (prompt: string) => void;
  className?: string;
}

const prompts = [
  {
    icon: BarChart3,
    text: "What are the top performing industries?",
    prompt: "What are the top performing industries in Charlotte?",
  },
  {
    icon: MapPin,
    text: "Which neighborhoods have highest revenue?",
    prompt: "Which neighborhoods have the highest business revenue?",
  },
  {
    icon: TrendingUp,
    text: "Show companies with high growth",
    prompt: "Show me companies with high revenue growth",
  },
  {
    icon: Users,
    text: "Compare employees by industry",
    prompt: "Compare average employees by industry",
  },
];

export function SuggestedPrompts({
  onPromptSelect,
  className = "",
}: SuggestedPromptsProps) {
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