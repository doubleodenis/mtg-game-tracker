import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, Avatar, Button } from "@/components/ui";
import { PageHeader, Section } from "@/components/layout";
import { MatchLog } from "@/components/match";
import { LeaderboardPreview } from "@/components/features/leaderboard-preview";
import { TopCommandersList } from "@/components/features/top-commanders-list";
import { DashboardStatCard } from "@/components/features/dashboard-stat-card";
import {
  createMockCollectionWithMembers,
  createMockCollectionMatches,
  createMockLeaderboard,
  createMockDeckWithStats,
  resetMockIds,
} from "@/lib/mock";
import type { CollectionMemberWithProfile } from "@/types";

// Force dynamic rendering to refresh mock data
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CollectionPage({ params }: PageProps) {
  const { id } = await params;

  // Reset mock IDs for fresh data
  resetMockIds();

  // TODO: Fetch real collection data
  // For now, use mock data
  const collection = createMockCollectionWithMembers(6, { id });
  const recentMatches = createMockCollectionMatches(8);
  const leaderboard = createMockLeaderboard(5);
  const topCommanders = Array.from({ length: 5 }, (_, i) =>
    createMockDeckWithStats({ id: `commander-${i}` })
  );

  // Mock: check if user is a member (for showing member-only features)
  const currentUserId = "mock-user-123";
  const userMembership = collection.members.find(
    (m) => m.userId === currentUserId
  );
  const isOwner = userMembership?.role === "owner";
  const isMember = Boolean(userMembership);

  // If collection is private and user is not a member, return 404
  if (!collection.isPublic && !isMember) {
    notFound();
  }

  return (
    <div className="space-y-8">
      {/* Collection Header */}
      <CollectionHeader
        collection={collection}
        matchCount={recentMatches.length}
        isMember={isMember}
        isOwner={isOwner}
      />

      {/* Quick Stats */}
      <Section title="COLLECTION STATS">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <DashboardStatCard
            label="Total Matches"
            value={recentMatches.length.toString()}
          />
          <DashboardStatCard
            label="Members"
            value={collection.members.length.toString()}
          />
          <DashboardStatCard
            label="Active Players"
            value={collection.members.length.toString()}
          />
          <DashboardStatCard
            label="This Week"
            value={recentMatches.filter((m) => {
              const playedAt = new Date(m.playedAt);
              const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
              return playedAt >= weekAgo;
            }).length.toString()}
          />
        </div>
      </Section>

      {/* Leaderboard Preview */}
      <Section
        title="LEADERBOARD"
        action={
          <Link
            href={`/collections/${id}/leaderboard`}
            className="text-sm text-accent hover:text-accent-fill transition-colors"
          >
            View Full
          </Link>
        }
      >
        <Card>
          <CardContent className="p-0">
            <LeaderboardPreview entries={leaderboard} />
          </CardContent>
        </Card>
      </Section>

      {/* Recent Matches */}
      <Section
        title="RECENT MATCHES"
        action={
          <Link
            href={`/collections/${id}/matches`}
            className="text-sm text-accent hover:text-accent-fill transition-colors"
          >
            View All
          </Link>
        }
      >
        <MatchLog
          matches={recentMatches.slice(0, 5)}
          groupByDate
        />
      </Section>

      {/* Top Commanders */}
      <Section title="TOP COMMANDERS">
        <Card>
          <CardContent className="p-0">
            <TopCommandersList commanders={topCommanders} />
          </CardContent>
        </Card>
      </Section>

      {/* Members */}
      <Section
        title="MEMBERS"
        action={
          isOwner ? (
            <Link
              href={`/collections/${id}/members`}
              className="text-sm text-accent hover:text-accent-fill transition-colors"
            >
              Manage
            </Link>
          ) : null
        }
      >
        <MembersList members={collection.members} />
      </Section>
    </div>
  );
}

// ============================================
// Sub-components
// ============================================

type CollectionHeaderProps = {
  collection: {
    id: string;
    name: string;
    description: string | null;
    isPublic: boolean;
    matchAddPermission: string;
  };
  matchCount: number;
  isMember: boolean;
  isOwner: boolean;
};

function CollectionHeader({
  collection,
  matchCount,
  isMember,
  isOwner,
}: CollectionHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-display font-bold text-text-1">
            {collection.name}
          </h1>
          <Badge variant={collection.isPublic ? "outline" : "default"}>
            {collection.isPublic ? "Public" : "Private"}
          </Badge>
        </div>
        {collection.description && (
          <p className="text-text-2 max-w-2xl">{collection.description}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isOwner && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/collections/${collection.id}/settings`}>Settings</Link>
          </Button>
        )}
        {isMember ? (
          <Button size="sm" asChild>
            <Link href="/matches/new">Log Match</Link>
          </Button>
        ) : (
          <Button size="sm">Request to Join</Button>
        )}
      </div>
    </div>
  );
}

function MembersList({ members }: { members: CollectionMemberWithProfile[] }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {members.map((member) => (
            <Link
              key={member.id}
              href={`/player/${member.profile.username}`}
              className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-surface transition-colors"
            >
              <Avatar
                src={member.profile.avatarUrl}
                fallback={member.profile.username}
                size="lg"
              />
              <div className="text-center">
                <p className="text-sm font-medium text-text-1 truncate max-w-full">
                  {member.profile.username}
                </p>
                {member.role === "owner" && (
                  <Badge variant="gold" className="mt-1 text-xs">
                    Owner
                  </Badge>
                )}
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
