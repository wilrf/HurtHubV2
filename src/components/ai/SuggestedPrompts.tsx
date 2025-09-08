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
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${className}`}>
      {prompts.map((prompt, index) => {
        const Icon = prompt.icon;
        return (
          <button
            key={index}
            onClick={() => onPromptSelect(prompt.prompt)}
            className={`
              flex items-center gap-3 p-4 
              ${isDarkMode 
                ? "bg-midnight-900/30 hover:bg-midnight-800/40 border-midnight-700" 
                : "bg-white hover:bg-gray-50 border-gray-200"
              }
              border rounded-xl
              transition-all duration-200 
              hover:-translate-y-0.5 hover:shadow-md
              text-left group cursor-pointer
            `}
          >
            <Icon
              className={`h-5 w-5 flex-shrink-0 ${
                isDarkMode ? "text-sapphire-400" : "text-blue-500"
              } group-hover:scale-110 transition-transform`}
            />
            <span
              className={`text-sm ${
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