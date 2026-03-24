import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button, Badge } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { CollectionActivityCard } from "@/components/features/collection-activity-card";
import {
  createMockCollectionActivities,
  resetMockIds,
} from "@/lib/mock";

// Force dynamic rendering to refresh mock data
export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  // Reset mock IDs for fresh data
  resetMockIds();

  // TODO: Fetch real collections for the current user
  const collections = createMockCollectionActivities(6);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Collections"
        description="Groups of matches you're tracking"
        actions={
          <Button asChild>
            <Link href="/collections/new">Create Collection</Link>
          </Button>
        }
      />

      {collections.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((activity) => (
            <CollectionActivityCard
              key={activity.collection.id}
              activity={activity}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-surface flex items-center justify-center">
                <CollectionIcon className="w-8 h-8 text-text-3" />
              </div>
              <div>
                <h3 className="text-lg font-display font-semibold text-text-1 mb-1">
                  No collections yet
                </h3>
                <p className="text-text-2 max-w-sm mx-auto">
                  Create a collection to organize matches with your playgroup,
                  track standings, and compete on local leaderboards.
                </p>
              </div>
              <Button asChild>
                <Link href="/collections/new">Create Your First Collection</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CollectionIcon({ className }: { className?: string }) {
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
      <path d="M16 2v2" />
      <path d="M7 22v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
      <path d="M8 2v2" />
      <rect x="3" y="4" width="18" height="8" rx="1" />
      <path d="M12 12v2" />
      <circle cx="12" cy="17" r="1" />
    </svg>
  );
}
