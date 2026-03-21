import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, FormatBadge, RatingDisplay, WLBadge, ColorIdentity, BracketBadge } from "@/components/ui";
import { PageHeader, Section } from "@/components/layout";
import { cn, formatRelativeTime } from "@/lib/utils";
import {
  createMockLeaderboard,
  createMockMatchCardData,
  createMockDeckWithStats,
} from "@/lib/mock";
import type { LeaderboardEntry, MatchCardData, DeckWithStats } from "@/types";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    return <PersonalDashboard userId={user.id} />;
  }

  return <GlobalDashboard />;
}

// ============================================
// Global Dashboard (Logged Out)
// ============================================

// Generate mock data
const mockLeaderboard = createMockLeaderboard(5);
const mockRecentMatches = Array.from({ length: 5 }, () => createMockMatchCardData(4));
const mockTopCommanders = Array.from({ length: 5 }, (_, i) =>
  createMockDeckWithStats({ id: `deck-${i}` })
);

// Platform stats (mock counts)
const platformStats = {
  totalMatches: 12847,
  activePlayers: 3421,
  commandersPlayed: 892,
  collections: 156,
};

function GlobalDashboard() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Welcome to CommandZone"
        description="Track your Commander matches, compete with friends, and climb the leaderboards"
        actions={
          <Button asChild>
            <Link href="/login">Get Started</Link>
          </Button>
        }
      />

      {/* Platform Stats */}
      <Section title="PLATFORM STATS">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Matches" value={platformStats.totalMatches.toLocaleString()} />
          <StatCard label="Active Players" value={platformStats.activePlayers.toLocaleString()} />
          <StatCard label="Commanders Played" value={platformStats.commandersPlayed.toLocaleString()} />
          <StatCard label="Collections" value={platformStats.collections.toLocaleString()} />
        </div>
      </Section>

      {/* Leaderboards Preview */}
      <Section title="TOP PLAYERS" action={
        <Link href="/leaderboards" className="text-sm text-accent hover:text-accent-fill transition-colors">
          View All
        </Link>
      }>
        <Card>
          <CardContent className="p-0">
            <LeaderboardPreview entries={mockLeaderboard} />
          </CardContent>
        </Card>
      </Section>

      {/* Recent Matches */}
      <Section title="RECENT MATCHES" action={
        <Link href="/matches" className="text-sm text-accent hover:text-accent-fill transition-colors">
          View All
        </Link>
      }>
        <div className="space-y-3">
          {mockRecentMatches.map((match) => (
            <MatchPreviewCard key={match.id} match={match} />
          ))}
        </div>
      </Section>

      {/* Most Played Commanders */}
      <Section title="POPULAR COMMANDERS">
        <Card>
          <CardContent className="p-0">
            <TopCommandersList commanders={mockTopCommanders} />
          </CardContent>
        </Card>
      </Section>

      {/* CTA */}
      <Card className="border-accent-ring bg-accent-dim/50">
        <CardContent className="p-8 text-center">
          <h2 className="font-display text-2xl font-bold text-text-1 mb-2">
            Ready to track your games?
          </h2>
          <p className="text-text-2 mb-6">
            Sign up to record matches, track your rating, and compete with friends.
          </p>
          <Button asChild size="lg">
            <Link href="/login">Create Account</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// Personal Dashboard (Logged In)
// ============================================

async function PersonalDashboard({ userId }: { userId: string }) {
  const supabase = await createClient();
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", userId)
    .single() as { data: { username: string; display_name: string | null } | null };

  const displayName = profile?.display_name ?? profile?.username ?? "Commander";

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${displayName}!`}
        description="Here's what's happening with your matches"
        actions={
          <Button asChild>
            <Link href="/matches/new">New Match</Link>
          </Button>
        }
      />

      {/* Quick Stats */}
      <Section title="YOUR STATS">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Rating" value="1000" sublabel="FFA" />
          <StatCard label="Win Rate" value="—%" />
          <StatCard label="Matches" value="0" />
          <StatCard label="Decks" value="0" />
        </div>
      </Section>

      {/* Pending Confirmations */}
      <Section title="PENDING CONFIRMATIONS">
        <Card>
          <CardContent className="p-6">
            <p className="text-text-2 text-center py-4">
              No pending match confirmations.
            </p>
          </CardContent>
        </Card>
      </Section>

      {/* Recent Matches */}
      <Section title="RECENT MATCHES">
        <Card>
          <CardContent className="p-6">
            <p className="text-text-2 text-center py-4">
              You haven't recorded any matches yet.
            </p>
            <div className="flex justify-center">
              <Button variant="secondary" asChild>
                <Link href="/matches/new">Record Your First Match</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* Collections Activity */}
      <Section title="COLLECTION ACTIVITY">
        <Card>
          <CardContent className="p-6">
            <p className="text-text-2 text-center py-4">
              Join or create a collection to see activity here.
            </p>
            <div className="flex justify-center">
              <Button variant="secondary" asChild>
                <Link href="/collections">Browse Collections</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </Section>
    </div>
  );
}

// ============================================
// Shared Components
// ============================================

function StatCard({ 
  label, 
  value, 
  sublabel 
}: { 
  label: string; 
  value: string; 
  sublabel?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sublabel text-text-2 mb-1">{label}</p>
        <p className="text-stat text-text-1">{value}</p>
        {sublabel && (
          <p className="text-mono-xs text-text-2 mt-1">{sublabel}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// Global Dashboard Components
// ============================================

function LeaderboardPreview({ entries }: { entries: LeaderboardEntry[] }) {
  return (
    <div className="divide-y divide-card-border">
      {entries.map((entry) => (
        <Link
          key={entry.id}
          href={`/player/${entry.username}`}
          className="flex items-center gap-4 px-4 py-3 hover:bg-bg-raised/50 transition-colors"
        >
          {/* Rank */}
          <span className={cn(
            "w-6 text-center font-display font-bold",
            entry.rank === 1 && "text-gold",
            entry.rank === 2 && "text-text-2",
            entry.rank === 3 && "text-[#cd7f32]", // bronze
            entry.rank > 3 && "text-text-3"
          )}>
            {entry.rank}
          </span>

          {/* Avatar */}
          <Avatar src={entry.avatarUrl} fallback={entry.username} size="sm" />

          {/* Name & Stats */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-text-1 truncate">{entry.username}</p>
            <p className="text-mono-xs text-text-2">
              {entry.matchesPlayed} matches • {entry.winRate}% WR
            </p>
          </div>

          {/* Rating */}
          <RatingDisplay rating={entry.rating} />
        </Link>
      ))}
    </div>
  );
}

function MatchPreviewCard({ match }: { match: MatchCardData }) {
  const winner = match.participants.find(p => p.isWinner);

  return (
    <Link
      href={`/match/${match.id}`}
      className="block"
    >
      <Card className="hover:border-card-border-hi transition-colors">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FormatBadge format={match.formatSlug as 'ffa' | '1v1' | '2v2' | '3v3' | 'pentagram'} />
              {winner && (
                <span className="text-sm text-text-2">
                  Winner: <span className="text-text-1">{winner.name}</span>
                </span>
              )}
            </div>
            <span className="text-mono-xs text-text-2">
              {formatRelativeTime(match.playedAt)}
            </span>
          </div>

          {/* Participants */}
          <div className="flex items-center gap-3 overflow-x-auto pb-1">
            {match.participants.map((participant) => (
              <div
                key={participant.id}
                className={cn(
                  "flex items-center gap-2 px-2 py-1 rounded-md shrink-0",
                  participant.isWinner && "bg-win-subtle ring-1 ring-win-ring"
                )}
              >
                <Avatar
                  src={participant.avatarUrl}
                  fallback={participant.name}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-1 truncate max-w-25">
                    {participant.name}
                  </p>
                  {participant.deck && (
                    <div className="flex items-center gap-1">
                      <ColorIdentity colors={participant.deck.colorIdentity} size="sm" />
                      <BracketBadge bracket={participant.deck.bracket} />
                    </div>
                  )}
                </div>
                {participant.isWinner && (
                  <span className="text-gold">👑</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function TopCommandersList({ commanders }: { commanders: DeckWithStats[] }) {
  return (
    <div className="divide-y divide-card-border">
      {commanders.map((deck, i) => (
        <div
          key={deck.id}
          className="flex items-center gap-4 px-4 py-3"
        >
          {/* Rank */}
          <span className={cn(
            "w-6 text-center font-display font-bold",
            i === 0 && "text-gold",
            i === 1 && "text-text-2",
            i === 2 && "text-[#cd7f32]",
            i > 2 && "text-text-3"
          )}>
            {i + 1}
          </span>

          {/* Color Identity */}
          <ColorIdentity colors={deck.colorIdentity} />

          {/* Commander Name */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-text-1 truncate">{deck.commanderName}</p>
            <p className="text-mono-xs text-text-2">
              {deck.stats.gamesPlayed} games • {deck.stats.winRate}% WR
            </p>
          </div>

          {/* Bracket */}
          <BracketBadge bracket={deck.bracket} />
        </div>
      ))}
    </div>
  );
}
