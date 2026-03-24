import Link from "next/link";
import { Button } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { MatchLog } from "@/components/match";
import {
  createMockCollectionMatches,
  resetMockIds,
} from "@/lib/mock";

// Force dynamic rendering to refresh mock data
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CollectionMatchesPage({ params }: PageProps) {
  const { id } = await params;

  // Reset mock IDs for fresh data
  resetMockIds();

  // TODO: Fetch real match data
  const matches = createMockCollectionMatches(15);

  // Mock membership check
  const isMember = true;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Match History"
        description="All matches logged in this collection"
        actions={
          isMember ? (
            <Button asChild>
              <Link href="/matches/new">Log Match</Link>
            </Button>
          ) : null
        }
      />

      <MatchLog
        matches={matches}
        groupByDate
        emptyTitle="No matches yet"
        emptyDescription="Be the first to log a match in this collection"
        emptyAction={
          isMember ? (
            <Button size="sm" asChild>
              <Link href="/matches/new">Log Match</Link>
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}
