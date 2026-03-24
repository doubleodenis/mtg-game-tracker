import * as React from "react";
import { cn } from "@/lib/utils";
import { MatchPreviewCard } from "./match-preview-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonMatchCard } from "@/components/ui/skeleton";
import type { MatchCardData } from "@/types";

// ============================================
// Date Grouping Utilities
// ============================================

type DateGroup = "today" | "yesterday" | "this-week" | "this-month" | "older";

const DATE_GROUP_LABELS: Record<DateGroup, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "this-week": "This Week",
  "this-month": "This Month",
  older: "Older",
};

function getDateGroup(dateString: string): DateGroup {
  const date = new Date(dateString);
  const now = new Date();
  
  // Reset time parts for accurate day comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const matchDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const diffDays = Math.floor((today.getTime() - matchDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return "this-week";
  if (diffDays < 30) return "this-month";
  return "older";
}

function groupMatchesByDate(matches: MatchCardData[]): Map<DateGroup, MatchCardData[]> {
  const groups = new Map<DateGroup, MatchCardData[]>();
  
  for (const match of matches) {
    const group = getDateGroup(match.playedAt);
    const existing = groups.get(group) || [];
    groups.set(group, [...existing, match]);
  }
  
  return groups;
}

// ============================================
// Icons
// ============================================

function MatchIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <path d="m9 16 2 2 4-4" />
    </svg>
  );
}

// ============================================
// Component Types
// ============================================

type MatchLogProps = {
  /** Array of matches to display */
  matches: MatchCardData[];
  /** Whether to show ELO deltas on match cards */
  showElo?: boolean;
  /** Whether data is loading */
  isLoading?: boolean;
  /** Number of skeleton cards to show when loading */
  skeletonCount?: number;
  /** Whether to group matches by date */
  groupByDate?: boolean;
  /** Custom empty state title */
  emptyTitle?: string;
  /** Custom empty state description */
  emptyDescription?: string;
  /** Custom empty state action */
  emptyAction?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Header title (optional) */
  title?: string;
  /** Header action (optional) */
  headerAction?: React.ReactNode;
};

// ============================================
// Sub-components
// ============================================

function MatchLogHeader({
  title,
  matchCount,
  action,
}: {
  title: string;
  matchCount: number;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-display font-semibold text-text-1">
          {title}
        </h2>
        <span className="text-sm text-text-3 bg-surface px-2 py-0.5 rounded-full">
          {matchCount}
        </span>
      </div>
      {action}
    </div>
  );
}

function DateGroupHeader({ group }: { group: DateGroup }) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-6 first:mt-0">
      <span className="text-sm font-medium text-text-2">
        {DATE_GROUP_LABELS[group]}
      </span>
      <div className="flex-1 h-px bg-card-border" />
    </div>
  );
}

function MatchLogSkeleton({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonMatchCard key={i} />
      ))}
    </div>
  );
}

function MatchLogEmpty({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <EmptyState
      icon={<MatchIcon className="w-full h-full" />}
      title={title}
      description={description}
      action={action}
      size="md"
      className="border border-card-border rounded-lg bg-card"
    />
  );
}

// ============================================
// Main Component
// ============================================

/**
 * Reusable match history log component.
 * 
 * Displays a list of matches using MatchPreviewCard, with support for:
 * - Date grouping (today, yesterday, this week, etc.)
 * - Loading skeleton state
 * - Empty state with customizable messaging
 * - Optional ELO display for personal history views
 * 
 * @example
 * ```tsx
 * // Player match history
 * <MatchLog
 *   matches={playerMatches}
 *   showElo
 *   groupByDate
 *   title="Match History"
 * />
 * 
 * // Collection match history
 * <MatchLog
 *   matches={collectionMatches}
 *   emptyTitle="No matches in this collection"
 *   emptyDescription="Matches added to this collection will appear here"
 * />
 * ```
 */
export function MatchLog({
  matches,
  showElo = false,
  isLoading = false,
  skeletonCount = 5,
  groupByDate = true,
  emptyTitle = "No matches yet",
  emptyDescription = "Your match history will appear here",
  emptyAction,
  className,
  title,
  headerAction,
}: MatchLogProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className={className}>
        {title && (
          <MatchLogHeader title={title} matchCount={0} action={headerAction} />
        )}
        <MatchLogSkeleton count={skeletonCount} />
      </div>
    );
  }

  // Empty state
  if (matches.length === 0) {
    return (
      <div className={className}>
        {title && (
          <MatchLogHeader title={title} matchCount={0} action={headerAction} />
        )}
        <MatchLogEmpty
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      </div>
    );
  }

  // Group matches by date if enabled
  const groupedMatches = groupByDate
    ? groupMatchesByDate(matches)
    : null;

  // Define the order of date groups
  const groupOrder: DateGroup[] = ["today", "yesterday", "this-week", "this-month", "older"];

  return (
    <div className={cn("", className)}>
      {title && (
        <MatchLogHeader
          title={title}
          matchCount={matches.length}
          action={headerAction}
        />
      )}

      {groupByDate && groupedMatches ? (
        // Grouped display
        <div className="flex flex-col gap-3">
          {groupOrder.map((group) => {
            const groupMatches = groupedMatches.get(group);
            if (!groupMatches || groupMatches.length === 0) return null;

            return (
              <div key={group}>
                <DateGroupHeader group={group} />
                <div className="flex flex-col gap-3">
                  {groupMatches.map((match) => (
                    <MatchPreviewCard
                      key={match.id}
                      match={match}
                      showElo={showElo}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Flat list display
        <div className="flex flex-col gap-3">
          {matches.map((match) => (
            <MatchPreviewCard
              key={match.id}
              match={match}
              showElo={showElo}
            />
          ))}
        </div>
      )}
    </div>
  );
}
