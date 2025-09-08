/**
 * Business Hover Card Component
 * Presentation layer - only rendering logic, no business logic
 */

import { useEffect, useState } from "react";
import { Building2, Users, TrendingUp, MapPin, Star } from "lucide-react";

import type { BusinessPreview } from "@/application/services/BusinessPreviewService";

interface BusinessHoverCardProps {
  businessName: string;
  isDarkMode: boolean;
  x: number;
  y: number;
  previewService: {
    getPreviewByName(name: string): Promise<BusinessPreview | null>;
  };
}

export function BusinessHoverCard({
  businessName,
  isDarkMode,
  x,
  y,
  previewService,
}: BusinessHoverCardProps) {
  const [preview, setPreview] = useState<BusinessPreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadPreview = async () => {
      try {
        const data = await previewService.getPreviewByName(businessName);
        if (!cancelled) {
          setPreview(data);
        }
      } catch (error) {
        console.error("Failed to load business preview:", error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadPreview();

    return () => {
      cancelled = true;
    };
  }, [businessName, previewService]);

  // Format currency for display
  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  // Format number for display
  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };

  if (isLoading) {
    return (
      <div
        className={`absolute z-50 p-4 rounded-lg shadow-xl border backdrop-blur-sm min-w-[280px] ${
          isDarkMode
            ? "bg-midnight-800/95 border-midnight-600"
            : "bg-white/95 border-gray-200"
        }`}
        style={{
          left: `${x}px`,
          top: `${y - 150}px`,
        }}
      >
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded"></div>
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!preview) {
    return null; // Business not found in database
  }

  return (
    <>
      <style>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .hover-card-animation {
          animation: fadeInScale 0.2s ease-out;
        }
      `}</style>
      
      <div
        className={`absolute z-50 p-4 rounded-lg shadow-xl border backdrop-blur-sm hover-card-animation min-w-[280px] ${
          isDarkMode
            ? "bg-midnight-800/95 border-midnight-600"
            : "bg-white/95 border-gray-200"
        }`}
        style={{
          left: `${x}px`,
          top: `${y - 150}px`,
        }}
        data-testid="hover-card"
      >
        <div className="space-y-3">
          {/* Header with business name and industry */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-sm flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-sapphire-400 flex-shrink-0" />
                <span className="truncate">{preview.name}</span>
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {preview.industry}
              </p>
            </div>
            {preview.isVerified && (
              <div className="flex-shrink-0" title="Verified in our database">
                <svg
                  className="h-4 w-4 text-sapphire-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground mb-0.5">Revenue</p>
              <p className="font-medium text-foreground">
                {formatCurrency(preview.revenue)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5">Employees</p>
              <p className="font-medium text-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                {formatNumber(preview.employeeCount)}
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="text-xs">
            <p className="text-muted-foreground mb-0.5">Location</p>
            <p className="flex items-center gap-1 text-foreground">
              <MapPin className="h-3 w-3" />
              {preview.neighborhood}
            </p>
          </div>

          {/* Additional metrics if available */}
          <div className="flex items-center gap-3 text-xs">
            {preview.revenueGrowth !== undefined && preview.revenueGrowth > 0 && (
              <div className="flex items-center gap-1 text-sapphire-400">
                <TrendingUp className="h-3 w-3" />
                <span>+{(preview.revenueGrowth * 100).toFixed(1)}% growth</span>
              </div>
            )}
            
            {preview.rating !== undefined && preview.rating > 0 && (
              <div className="flex items-center gap-1 text-sapphire-400">
                <Star className="h-3 w-3" />
                <span>{preview.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}