import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button, Input, Badge } from "@/components/ui";
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

export default async function CollectionSettingsPage({ params }: PageProps) {
  const { id } = await params;

  // Reset mock IDs for fresh data
  resetMockIds();

  // TODO: Fetch real collection data
  const collection = createMockCollectionWithMembers(6, { id });

  // Mock: check if user is the owner
  const currentUserId = "mock-user-123";
  const userMembership = collection.members.find(
    (m) => m.userId === currentUserId
  );
  const isOwner = userMembership?.role === "owner";

  // Only owners can access settings
  if (!isOwner) {
    redirect(`/collections/${id}`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Collection Settings"
        description="Manage your collection's name, privacy, and permissions"
      />

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Basic collection information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-1">
              Collection Name
            </label>
            <Input
              defaultValue={collection.name}
              placeholder="Enter collection name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-1">
              Description
            </label>
            <Input
              defaultValue={collection.description ?? ""}
              placeholder="Enter a description (optional)"
            />
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy</CardTitle>
          <CardDescription>Control who can see this collection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-card-border rounded-lg">
            <div>
              <p className="font-medium text-text-1">Public Collection</p>
              <p className="text-sm text-text-2">
                Anyone can view this collection and its matches
              </p>
            </div>
            <Badge variant={collection.isPublic ? "win" : "outline"}>
              {collection.isPublic ? "On" : "Off"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Match Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Match Permissions</CardTitle>
          <CardDescription>Control who can add matches</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <PermissionOption
            label="Owner Only"
            description="Only you can add matches to this collection"
            isSelected={collection.matchAddPermission === "owner_only"}
          />
          <PermissionOption
            label="Any Member"
            description="Any member can add matches freely"
            isSelected={collection.matchAddPermission === "any_member"}
          />
          <PermissionOption
            label="Approval Required"
            description="Members can submit matches for your approval"
            isSelected={collection.matchAddPermission === "any_member_approval_required"}
          />
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-loss/30">
        <CardHeader>
          <CardTitle className="text-loss">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions that affect the entire collection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-loss/30 rounded-lg">
            <div>
              <p className="font-medium text-text-1">Delete Collection</p>
              <p className="text-sm text-text-2">
                Permanently remove this collection and all its data
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PermissionOption({
  label,
  description,
  isSelected,
}: {
  label: string;
  description: string;
  isSelected: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
        isSelected
          ? "border-accent bg-accent-dim/30"
          : "border-card-border hover:border-card-border-hi"
      }`}
    >
      <div>
        <p className="font-medium text-text-1">{label}</p>
        <p className="text-sm text-text-2">{description}</p>
      </div>
      {isSelected && (
        <Badge variant="accent">Selected</Badge>
      )}
    </div>
  );
}
