import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFormatSummaries } from "@/lib/supabase/formats";
import { getActiveDecks } from "@/lib/supabase/decks";
import { getProfileById } from "@/lib/supabase/profiles";
import { getUserCollections } from "@/lib/supabase/collections";
import { PageHeader } from "@/components/layout";
import { MatchForm } from "@/components/match/match-form";

export default async function NewMatchPage() {
  const supabase = await createClient();

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch formats, user's decks, profile, and collections in parallel
  const [formatsResult, decksResult, profileResult, collectionsResult] = await Promise.all([
    getFormatSummaries(supabase),
    getActiveDecks(supabase, user.id),
    getProfileById(supabase, user.id),
    getUserCollections(supabase, user.id),
  ]);

  const formats = formatsResult.success ? formatsResult.data : [];
  const userDecks = decksResult.success ? decksResult.data : [];
  const profile = profileResult.success ? profileResult.data : null;
  const collections = collectionsResult.success ? collectionsResult.data : [];

  // Build current user search result for "Add yourself" option
  // Fallback to auth user data if profile not found
  const currentUser = profile ? {
    id: profile.id,
    username: profile.username,
    displayName: null,
    avatarUrl: profile.avatarUrl,
  } : {
    id: user.id,
    username: user.email?.split('@')[0] || 'You',
    displayName: null,
    avatarUrl: user.user_metadata?.avatar_url || null,
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Log Match"
        description="Record a new Commander match"
      />
      <MatchForm
        formats={formats}
        currentUserId={user.id}
        currentUserDecks={userDecks}
        currentUser={currentUser}
        collections={collections}
      />
    </div>
  );
}
