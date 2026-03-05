import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime, calculateWinRate } from "@/lib/utils";

// Type definitions
type DashboardProfile = {
  username: string;
  display_name: string | null;
};

type MatchParticipation = {
  is_winner: boolean;
  commander_name: string | null;
  match: {
    id: string;
    format: string;
    date_played: string;
  } | null;
};

type FriendRequest = {
  id: string;
  requester: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  created_at: string;
};

async function getDashboardData(userId: string) {
  const supabase = await createClient();

  // Get user's recent matches
  const { data: participations } = await supabase
    .from("match_participants")
    .select(`
      is_winner,
      commander_name,
      match:match_id (
        id,
        format,
        date_played
      )
    `)
    .eq("user_id", userId)
    .order("match(date_played)", { ascending: false })
    .limit(10);

  // Get pending friend requests
  const { data: pendingRequests } = await supabase
    .from("friendships")
    .select(`
      id,
      requester:requester_id (username, display_name, avatar_url),
      created_at
    `)
    .eq("addressee_id", userId)
    .eq("status", "pending");

  // Get friend count
  const { count: friendCount } = await supabase
    .from("friendships")
    .select("*", { count: "exact", head: true })
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .eq("status", "accepted");

  // Get commander count
  const { count: commanderCount } = await supabase
    .from("user_commanders")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  // Calculate stats
  const matches = (participations || []) as unknown as MatchParticipation[];
  const wins = matches.filter((m) => m.is_winner).length;
  const totalMatches = matches.length;

  return {
    recentMatches: matches,
    pendingRequests: (pendingRequests || []) as unknown as FriendRequest[],
    friendCount: friendCount || 0,
    commanderCount: commanderCount || 0,
    wins,
    totalMatches,
    winRate: calculateWinRate(wins, totalMatches),
  };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", user.id)
    .single();

  const profile = profileData as DashboardProfile | null;
  const data = await getDashboardData(user.id);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Welcome Header */}
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem", color: "#ffffff" }}>
          Welcome back, {profile?.display_name || profile?.username || "Commander"}!
        </h1>
        <p style={{ color: "#a1a1aa" }}>
          Here&apos;s what&apos;s happening with your matches.
        </p>
      </div>

      {/* Quick Actions */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
        <Link href="/dashboard/matches/new">
          <Button>
            <span style={{ marginRight: "0.5rem" }}>⚔️</span>
            Record New Match
          </Button>
        </Link>
        <Link href="/dashboard/commanders">
          <Button variant="secondary">
            <span style={{ marginRight: "0.5rem" }}>👑</span>
            Manage Commanders
          </Button>
        </Link>
        <Link href="/dashboard/friends">
          <Button variant="secondary">
            <span style={{ marginRight: "0.5rem" }}>👥</span>
            Find Friends
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(2, 1fr)", 
        gap: "1rem" 
      }} className="lg:grid-cols-4">
        <Card>
          <CardContent style={{ padding: "1.5rem" }}>
            <div style={{ fontSize: "1.875rem", fontWeight: 700, color: "#a855f7" }}>{data.winRate}%</div>
            <div style={{ fontSize: "0.875rem", color: "#a1a1aa" }}>Win Rate</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent style={{ padding: "1.5rem" }}>
            <div style={{ fontSize: "1.875rem", fontWeight: 700, color: "#ffffff" }}>{data.totalMatches}</div>
            <div style={{ fontSize: "0.875rem", color: "#a1a1aa" }}>Matches Played</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent style={{ padding: "1.5rem" }}>
            <div style={{ fontSize: "1.875rem", fontWeight: 700, color: "#ffffff" }}>{data.friendCount}</div>
            <div style={{ fontSize: "0.875rem", color: "#a1a1aa" }}>Friends</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent style={{ padding: "1.5rem" }}>
            <div style={{ fontSize: "1.875rem", fontWeight: 700, color: "#ffffff" }}>{data.commanderCount}</div>
            <div style={{ fontSize: "0.875rem", color: "#a1a1aa" }}>Commanders</div>
          </CardContent>
        </Card>
      </div>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "1fr", 
        gap: "1.5rem" 
      }} className="lg:grid-cols-2">
        {/* Recent Matches */}
        <Card>
          <CardHeader style={{ padding: "1.25rem", paddingBottom: "0.75rem" }}>
            <CardTitle style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              Recent Matches
              <Link href={`/player/${profile?.username}`}>
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent style={{ padding: "1.25rem", paddingTop: "0", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {data.recentMatches.length > 0 ? (
              data.recentMatches.slice(0, 5).map((m) => {
                const match = m.match as { id: string; format: string; date_played: string };
                return (
                  <Link
                    key={match.id}
                    href={`/match/${match.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.75rem",
                      borderRadius: "0.5rem",
                      backgroundColor: "rgba(255, 255, 255, 0.03)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <Badge variant={m.is_winner ? "win" : "loss"}>
                        {m.is_winner ? "WIN" : "LOSS"}
                      </Badge>
                      <div>
                        <div style={{ fontSize: "0.875rem", fontWeight: 500, color: "#ffffff" }}>{match.format} Commander</div>
                        {m.commander_name && (
                          <div style={{ fontSize: "0.75rem", color: "#a1a1aa" }}>{m.commander_name}</div>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#a1a1aa" }}>
                      {formatRelativeTime(match.date_played)}
                    </div>
                  </Link>
                );
              })
            ) : (
              <div style={{ textAlign: "center", padding: "2rem 0", color: "#a1a1aa" }}>
                <p style={{ marginBottom: "1rem" }}>No matches recorded yet.</p>
                <Link href="/dashboard/matches/new">
                  <Button>Record Your First Match</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Friend Requests */}
        <Card>
          <CardHeader style={{ padding: "1.25rem", paddingBottom: "0.75rem" }}>
            <CardTitle style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              Friend Requests
              {data.pendingRequests.length > 0 && (
                <Badge>{data.pendingRequests.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent style={{ padding: "1.25rem", paddingTop: "0", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {data.pendingRequests.length > 0 ? (
              data.pendingRequests.map((request) => {
                const requester = request.requester as {
                  username: string;
                  display_name: string | null;
                  avatar_url: string | null;
                };
                return (
                  <div
                    key={request.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.75rem",
                      borderRadius: "0.5rem",
                      backgroundColor: "rgba(255, 255, 255, 0.03)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ 
                        height: "2.5rem", 
                        width: "2.5rem", 
                        borderRadius: "50%", 
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#a1a1aa",
                      }}>
                        {requester.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, color: "#ffffff" }}>
                          {requester.display_name || requester.username}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#a1a1aa" }}>
                          @{requester.username}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <Button size="sm">Accept</Button>
                      <Button size="sm" variant="ghost">Decline</Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: "center", padding: "2rem 0", color: "#a1a1aa" }}>
                <p>No pending friend requests.</p>
                <Link href="/dashboard/friends" style={{ color: "#a855f7", fontSize: "0.875rem" }}>
                  Find friends to add
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
