import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, Badge, Button } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import {
  createMockCollectionWithMembers,
  resetMockIds,
} from "@/lib/mock";

// Force dynamic rendering to refresh mock data
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CollectionMembersPage({ params }: PageProps) {
  const { id } = await params;

  // Reset mock IDs for fresh data
  resetMockIds();

  // TODO: Fetch real collection data
  const collection = createMockCollectionWithMembers(8, { id });

  // Mock: check if user is the owner
  const currentUserId = "mock-user-123";
  const userMembership = collection.members.find(
    (m) => m.userId === currentUserId
  );
  const isOwner = userMembership?.role === "owner";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Members"
        description={`${collection.members.length} members in this collection`}
        actions={
          isOwner ? (
            <Button size="sm">Invite Member</Button>
          ) : null
        }
      />

      <Card>
        <CardContent className="p-0 divide-y divide-card-border">
          {collection.members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-4 px-4 py-3"
            >
              <Link href={`/player/${member.profile.username}`}>
                <Avatar
                  src={member.profile.avatarUrl}
                  fallback={member.profile.username}
                  size="md"
                />
              </Link>

              <div className="flex-1 min-w-0">
                <Link
                  href={`/player/${member.profile.username}`}
                  className="hover:text-accent transition-colors"
                >
                  <p className="font-medium text-text-1 truncate">
                    {member.profile.username}
                  </p>
                </Link>
                <p className="text-sm text-text-3">
                  Joined {new Date(member.joinedAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={member.role === "owner" ? "gold" : "outline"}>
                  {member.role === "owner" ? "Owner" : "Member"}
                </Badge>

                {isOwner && member.role !== "owner" && (
                  <Button variant="ghost" size="sm" className="text-loss">
                    Remove
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
