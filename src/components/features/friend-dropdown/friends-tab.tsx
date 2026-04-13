"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import type { FriendsTabProps } from "./types";

export function FriendsTab({ friends, onClose }: FriendsTabProps) {
  if (friends.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-text-3 text-sm">
        No friends yet. Search to add friends!
      </div>
    );
  }

  return (
    <div className="divide-y divide-card-border">
      {friends.map((friend) => (
        <Link
          key={friend.id}
          href={`/player/${friend.username}`}
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-3 hover:bg-surface transition-colors"
        >
          <Avatar
            src={friend.avatarUrl}
            fallback={friend.username}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-1 truncate">
              {friend.displayName || friend.username}
            </p>
            {friend.displayName && (
              <p className="text-2xs text-text-3 truncate">@{friend.username}</p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
