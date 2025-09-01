import { GitCommit } from "lucide-react";

import { env } from "@/config/env";
import { cn } from "@/utils";

interface VersionDisplayProps {
  className?: string;
  showIcon?: boolean;
}

export function VersionDisplay({
  className,
  showIcon = true,
}: VersionDisplayProps) {
  // Get git commit hash from environment or build time
  const gitHash = import.meta.env.VITE_GIT_HASH || "dev";
  const appVersion = env.appVersion;
  const buildTime = import.meta.env.VITE_BUILD_TIME || new Date().toISOString();

  // Format version display
  const shortHash = gitHash.length > 7 ? gitHash.slice(0, 7) : gitHash;
  const versionText = env.isDevelopment()
    ? `v${appVersion}-${shortHash}`
    : `v${appVersion}.${shortHash}`;

  // Format build time for tooltip
  const buildDate = new Date(buildTime);
  const buildDateString = buildDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg",
        "bg-midnight-900/50 border border-midnight-700/50",
        "text-xs font-mono text-gray-400",
        "hover:text-gray-300 hover:border-midnight-600/50",
        "transition-all duration-200 cursor-help",
        "backdrop-blur-sm",
        className,
      )}
      title={`Build: ${buildDateString}\nCommit: ${gitHash}\nEnvironment: ${env.appEnv}`}
    >
      {showIcon && <GitCommit className="h-3 w-3" />}
      <span className="select-text">{versionText}</span>
      {env.isDevelopment() && (
        <div
          className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse"
          title="Development Mode"
        />
      )}
      {env.isProduction() && (
        <div
          className="h-2 w-2 rounded-full bg-green-400"
          title="Production Mode"
        />
      )}
    </div>
  );
}

export default VersionDisplay;
