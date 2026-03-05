"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/utils";

interface Group {
  id: string;
  name: string;
  description: string | null;
  creator_id: string;
  color: string | null;
  cover_image_url: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  match_count: number;
  unique_players: number;
  most_recent_match: string | null;
}

interface GroupRow {
  id: string;
  name: string;
  description: string | null;
  creator_id: string;
  color: string | null;
  cover_image_url: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

interface GroupStats {
  total_matches: number;
  unique_players: number;
  most_recent_match: string | null;
}

interface GroupMatch {
  id: string;
  match_id: string;
  added_at: string;
  notes: string | null;
  match: {
    id: string;
    format: "1v1" | "2v2" | "multiplayer";
    date_played: string;
    participants: Array<{
      user_id: string;
      is_winner: boolean;
      commander_name: string | null;
      profile: {
        username: string;
        display_name: string | null;
        avatar_url: string | null;
      } | null;
    }>;
  };
}

interface GroupParticipant {
  user_id: string;
  username: string;
  avatar_url: string | null;
  matches_in_group: number;
  wins_in_group: number;
}

const COLOR_OPTIONS = [
  { value: "#6366f1", label: "Indigo" },
  { value: "#8b5cf6", label: "Violet" },
  { value: "#ec4899", label: "Pink" },
  { value: "#ef4444", label: "Red" },
  { value: "#f97316", label: "Orange" },
  { value: "#eab308", label: "Yellow" },
  { value: "#22c55e", label: "Green" },
  { value: "#06b6d4", label: "Cyan" },
];

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newGroupColor, setNewGroupColor] = useState("#6366f1");
  const [isCreating, setIsCreating] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [groupMatches, setGroupMatches] = useState<GroupMatch[]>([]);
  const [groupParticipants, setGroupParticipants] = useState<GroupParticipant[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"matches" | "players">("matches");

  const loadGroups = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;
    setUserId(user.id);

    // Get groups created by the user
    const { data: groupsData } = await supabase
      .from("groups")
      .select("*")
      .eq("creator_id", user.id)
      .eq("is_archived", false)
      .order("updated_at", { ascending: false });

    const typedGroups = (groupsData || []) as unknown as GroupRow[];

    if (!typedGroups.length) {
      setGroups([]);
      setIsLoading(false);
      return;
    }

    // Get stats for each group
    const groupsWithStats = await Promise.all(
      typedGroups.map(async (group) => {
        const { data: stats } = await supabase.rpc("get_group_stats", {
          p_group_id: group.id,
        } as never);

        const typedStats = stats as unknown as GroupStats | null;

        return {
          ...group,
          match_count: typedStats?.total_matches ?? 0,
          unique_players: typedStats?.unique_players ?? 0,
          most_recent_match: typedStats?.most_recent_match ?? null,
        };
      })
    );

    setGroups(groupsWithStats);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const loadGroupDetails = async (groupId: string) => {
    const supabase = createClient();
    setSelectedGroup(groupId);
    setViewMode("matches");

    // Load matches in group
    const { data: matchesData } = await supabase
      .from("group_matches")
      .select(`
        id,
        match_id,
        added_at,
        notes,
        match:match_id (
          id,
          format,
          date_played,
          participants:match_participants (
            user_id,
            is_winner,
            commander_name,
            profile:user_id (username, display_name, avatar_url)
          )
        )
      `)
      .eq("group_id", groupId)
      .order("added_at", { ascending: false });

    setGroupMatches((matchesData || []) as unknown as GroupMatch[]);

    // Load participants
    const { data: participantsData } = await supabase.rpc("get_group_participants", {
      p_group_id: groupId,
    } as never);

    setGroupParticipants((participantsData || []) as unknown as GroupParticipant[]);
  };

  const createGroup = async () => {
    if (!newGroupName.trim() || !userId) return;

    setIsCreating(true);
    const supabase = createClient();

    const { error } = await supabase.from("groups").insert({
      name: newGroupName.trim(),
      description: newGroupDescription.trim() || null,
      creator_id: userId,
      color: newGroupColor,
    } as never);

    if (!error) {
      setShowCreateModal(false);
      setNewGroupName("");
      setNewGroupDescription("");
      setNewGroupColor("#6366f1");
      loadGroups();
    }

    setIsCreating(false);
  };

  const deleteGroup = async (groupId: string) => {
    if (!confirm("Delete this group? Matches won't be deleted.")) return;

    const supabase = createClient();
    await supabase.from("groups").delete().eq("id", groupId);
    setSelectedGroup(null);
    loadGroups();
  };

  const removeMatchFromGroup = async (groupMatchId: string) => {
    const supabase = createClient();
    await supabase.from("group_matches").delete().eq("id", groupMatchId);

    if (selectedGroup) {
      loadGroupDetails(selectedGroup);
      loadGroups();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Match Playlists</h1>
          <p className="text-foreground-muted">
            Organize your matches into groups like playlists.
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>Create Playlist</Button>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create Match Playlist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input
                  placeholder="Friday Night Magic"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Description (optional)
                </label>
                <Input
                  placeholder="Weekly commander games at the shop"
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setNewGroupColor(color.value)}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        backgroundColor: color.value,
                        border: newGroupColor === color.value ? "3px solid white" : "none",
                        boxShadow: newGroupColor === color.value ? "0 0 0 2px " + color.value : "none",
                        cursor: "pointer",
                      }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button onClick={createGroup} disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Group Details Modal */}
      {selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {groups.find((g) => g.id === selectedGroup)?.name}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={viewMode === "matches" ? "default" : "outline"}
                    onClick={() => setViewMode("matches")}
                  >
                    Matches
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === "players" ? "default" : "outline"}
                    onClick={() => setViewMode("players")}
                  >
                    Players
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 overflow-y-auto flex-1">
              {viewMode === "matches" ? (
                <div className="space-y-2">
                  {groupMatches.length > 0 ? (
                    groupMatches.map((gm) => (
                      <div
                        key={gm.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-surface"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{gm.match.format}</Badge>
                            <span className="text-sm text-foreground-muted">
                              {formatRelativeTime(gm.match.date_played)}
                            </span>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {gm.match.participants.map((p, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-1 text-sm"
                                style={{
                                  color: p.is_winner ? "#22c55e" : "inherit",
                                  fontWeight: p.is_winner ? 600 : 400,
                                }}
                              >
                                <Avatar
                                  src={p.profile?.avatar_url}
                                  fallback={p.profile?.display_name || p.profile?.username || "?"}
                                  size="sm"
                                />
                                <span>
                                  {p.profile?.display_name || p.profile?.username}
                                </span>
                                {p.is_winner && <span>👑</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeMatchFromGroup(gm.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-foreground-muted">
                      <p>No matches in this playlist yet.</p>
                      <p className="text-sm mt-1">
                        Add matches from the match details page.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {groupParticipants.length > 0 ? (
                    groupParticipants.map((participant) => (
                      <div
                        key={participant.user_id}
                        className="flex items-center justify-between p-3 rounded-lg bg-surface"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={participant.avatar_url}
                            fallback={participant.username}
                            size="md"
                          />
                          <div>
                            <div className="font-medium">
                              {participant.username}
                            </div>
                            <div className="text-sm text-foreground-muted">
                              {participant.matches_in_group} matches
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-accent">
                            {participant.wins_in_group} wins
                          </div>
                          <div className="text-sm text-foreground-muted">
                            {participant.matches_in_group > 0
                              ? Math.round(
                                  (participant.wins_in_group /
                                    participant.matches_in_group) *
                                    100
                                )
                              : 0}
                            % WR
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-foreground-muted">
                      No players yet. Add some matches!
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-2 pt-4 border-t border-border">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setSelectedGroup(null)}
                >
                  Close
                </Button>
                <Button
                  variant="ghost"
                  style={{ color: "#ef4444" }}
                  onClick={() => deleteGroup(selectedGroup)}
                >
                  Delete Playlist
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Groups List */}
      {groups.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <Card
              key={group.id}
              className="overflow-hidden cursor-pointer hover:border-accent transition-colors"
              onClick={() => loadGroupDetails(group.id)}
              style={{
                borderTop: `4px solid ${group.color || "#6366f1"}`,
              }}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{group.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {group.description && (
                  <p className="text-sm text-foreground-muted">
                    {group.description}
                  </p>
                )}
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-foreground-muted">Matches:</span>{" "}
                    <span className="font-medium">{group.match_count}</span>
                  </div>
                  <div>
                    <span className="text-foreground-muted">Players:</span>{" "}
                    <span className="font-medium">{group.unique_players}</span>
                  </div>
                </div>
                {group.most_recent_match && (
                  <div className="text-xs text-foreground-muted">
                    Last match {formatRelativeTime(group.most_recent_match)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="font-semibold mb-2">No playlists yet</h3>
            <p className="text-foreground-muted mb-4">
              Create a playlist to organize your matches.
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              Create Your First Playlist
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
