import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout";
import { LeaderboardPreview } from "@/components/features/leaderboard-preview";
import {
  createMockLeaderboard,
  resetMockIds,
} from "@/lib/mock";

// Force dynamic rendering to refresh mock data
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CollectionLeaderboardPage({ params }: PageProps) {
  // Params are unused for now but will be needed for real data fetching
  await params;

  // Reset mock IDs for fresh data
  resetMockIds();

  // TODO: Fetch real leaderboard data scoped to this collection
  const leaderboard = createMockLeaderboard(20);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leaderboard"
        description="Rankings based on matches within this collection"
      />

      <Card>
        <CardContent className="p-0">
          <LeaderboardPreview entries={leaderboard} />
        </CardContent>
      </Card>
    </div>
  );
}
