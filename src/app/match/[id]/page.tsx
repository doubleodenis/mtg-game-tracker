import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/features/navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CommanderCard } from "@/components/ui/commander-card";
import { formatDuration } from "@/lib/utils";
import { buildCommanderImageUrl } from "@/lib/scryfall/api";

// Type definitions
type MatchRow = {
  id: string;
  format: string;
  date_played: string;
  duration_minutes: number | null;
  notes: string | null;
  group_id: string | null;
  created_by: string;
  groups: { name: string; description: string | null } | null;
  created_by_profile: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

type RegisteredParticipantRow = {
  user_id: string;
  commander_name: string | null;
  commander_image_uri: string | null;
  team: number | null;
  placement: number | null;
  is_winner: boolean;
  profiles: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

type GuestParticipantRow = {
  id: string;
  guest_name: string;
  commander_name: string | null;
  commander_image_uri: string | null;
  team: number | null;
  placement: number | null;
  is_winner: boolean;
};

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getMatch(id: string) {
  const supabase = await createClient();

  const { data: match } = await supabase
    .from("matches")
    .select(`
      *,
      groups:group_id (name, description),
      created_by_profile:created_by (username, display_name, avatar_url)
    `)
    .eq("id", id)
    .single();

  return match as MatchRow | null;
}

async function getParticipants(matchId: string) {
  const supabase = await createClient();

  const { data: registered } = await supabase
    .from("match_participants")
    .select(`
      *,
      profiles:user_id (id, username, display_name, avatar_url)
    `)
    .eq("match_id", matchId);

  const { data: guests } = await supabase
    .from("guest_participants")
    .select("*")
    .eq("match_id", matchId);

  const typedRegistered = (registered || []) as unknown as RegisteredParticipantRow[];
  const typedGuests = (guests || []) as unknown as GuestParticipantRow[];

  // Fetch commander images from user_commanders for registered users
  const userIds = typedRegistered.map((p) => p.user_id);
  const { data: userCommanders } = await supabase
    .from("user_commanders")
    .select("user_id, card_name, card_image_uri")
    .in("user_id", userIds);

  // Create a map of user_id + commander_name -> image
  const commanderImageMap = new Map<string, string | null>();
  (userCommanders || []).forEach((uc: { user_id: string; card_name: string; card_image_uri: string | null }) => {
    commanderImageMap.set(`${uc.user_id}:${uc.card_name}`, uc.card_image_uri);
  });

  const participants: Array<{
    id: string;
    name: string;
    username?: string;
    avatar_url: string | null;
    commander_name: string | null;
    commander_image_uri: string | null;
    team: number | null;
    placement: number | null;
    is_winner: boolean;
    is_guest: boolean;
  }> = [];

  typedRegistered.forEach((p) => {
    const profile = p.profiles;
    // Look up commander image from user_commanders
    const commanderImage = p.commander_name 
      ? commanderImageMap.get(`${p.user_id}:${p.commander_name}`) || p.commander_image_uri
      : p.commander_image_uri;

    participants.push({
      id: p.user_id,
      name: profile?.display_name || profile?.username || "Unknown",
      username: profile?.username,
      avatar_url: profile?.avatar_url || null,
      commander_name: p.commander_name,
      commander_image_uri: commanderImage,
      team: p.team,
      placement: p.placement,
      is_winner: p.is_winner,
      is_guest: false,
    });
  });

  typedGuests.forEach((g) => {
    participants.push({
      id: g.id,
      name: g.guest_name,
      avatar_url: null,
      commander_name: g.commander_name,
      commander_image_uri: g.commander_image_uri,
      team: g.team,
      placement: g.placement,
      is_winner: g.is_winner,
      is_guest: true,
    });
  });

  // Sort by placement if available, winners first
  participants.sort((a, b) => {
    if (a.is_winner && !b.is_winner) return -1;
    if (!a.is_winner && b.is_winner) return 1;
    if (a.placement && b.placement) return a.placement - b.placement;
    return 0;
  });

  return participants;
}

export default async function MatchDetailPage({ params }: PageProps) {
  const { id } = await params;
  const match = await getMatch(id);

  if (!match) {
    notFound();
  }

  const participants = await getParticipants(id);
  const winner = participants.find((p) => p.is_winner);
  const group = match.groups as { name: string; description: string | null } | null;
  const createdBy = match.created_by_profile as {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;

  const formatLabel =
    match.format === "1v1"
      ? "1v1 Commander"
      : match.format === "2v2"
      ? "2v2 Commander"
      : `${participants.length}-Player Commander`;

  // Group participants by team for 2v2
  const teams = match.format === "2v2"
    ? [
        participants.filter((p) => p.team === 1),
        participants.filter((p) => p.team === 2),
      ]
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto max-w-4xl py-8 px-4">
        {/* Match Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{formatLabel}</h1>
            {group && (
              <Badge variant="outline">{group.name}</Badge>
            )}
          </div>
          <div className="flex items-center gap-4 text-foreground-muted text-sm">
            <span>{new Date(match.date_played).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}</span>
            {match.duration_minutes && (
              <span>• {formatDuration(match.duration_minutes)}</span>
            )}
            {createdBy && (
              <span>
                • Recorded by{" "}
                <Link href={`/player/${createdBy.username}`} className="text-accent hover:underline">
                  @{createdBy.username}
                </Link>
              </span>
            )}
          </div>
        </div>

        {/* Winner Banner */}
        {winner && (
          <Card className="mb-8 overflow-hidden">
            <div className="h-2 bg-gradient-accent" />
            <CardContent className="py-6">
              <div className="flex items-center justify-center gap-4">
                <span className="text-4xl">👑</span>
                <div className="text-center">
                  <div className="text-sm text-foreground-muted uppercase tracking-wider mb-1">
                    Winner
                  </div>
                  <div className="text-2xl font-bold">
                    {winner.username ? (
                      <Link href={`/player/${winner.username}`} className="hover:text-accent transition-colors">
                        {winner.name}
                      </Link>
                    ) : (
                      winner.name
                    )}
                  </div>
                  {winner.commander_name && (
                    <div className="text-foreground-muted mt-1">
                      playing {winner.commander_name}
                    </div>
                  )}
                </div>
                {winner.commander_name && (
                  <div className="relative h-24 w-18 rounded-lg overflow-hidden hidden sm:block">
                    <Image
                      src={winner.commander_image_uri || buildCommanderImageUrl(winner.commander_name)}
                      alt={winner.commander_name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Participants */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Participants</CardTitle>
          </CardHeader>
          <CardContent>
            {teams ? (
              // 2v2 layout
              <div className="grid md:grid-cols-2 gap-6">
                {teams.map((team, teamIndex) => (
                  <div key={teamIndex}>
                    <div className="text-sm font-medium text-foreground-muted mb-4">
                      Team {teamIndex + 1}
                      {team.some((p) => p.is_winner) && (
                        <Badge variant="win" className="ml-2">Winners</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap justify-center gap-4">
                      {team.map((participant) => (
                        <CommanderCard
                          key={participant.id}
                          commanderName={participant.commander_name}
                          playerName={participant.name}
                          avatarUrl={participant.avatar_url}
                          isWinner={participant.is_winner}
                          isGuest={participant.is_guest}
                          size="md"
                          href={participant.username ? `/player/${participant.username}` : undefined}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // FFA layout - commander cards in a responsive grid
              <div className="flex flex-wrap justify-center gap-6">
                {participants.map((participant) => (
                  <CommanderCard
                    key={participant.id}
                    commanderName={participant.commander_name}
                    playerName={participant.name}
                    avatarUrl={participant.avatar_url}
                    isWinner={participant.is_winner}
                    isGuest={participant.is_guest}
                    size="lg"
                    href={participant.username ? `/player/${participant.username}` : undefined}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        {match.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground-muted whitespace-pre-wrap">{match.notes}</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
