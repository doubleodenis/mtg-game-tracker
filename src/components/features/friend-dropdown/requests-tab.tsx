"use client";

import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { RequestsTabProps } from "./types";

export function RequestsTab({
  pendingRequests,
  acceptingId,
  rejectingId,
  onAccept,
  onReject,
  onClose,
}: RequestsTabProps) {
  if (pendingRequests.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-text-3 text-sm">
        No pending friend requests
      </div>
    );
  }

  return (
    <div className="divide-y divide-card-border">
      {pendingRequests.map((request) => (
        <div key={request.id} className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href={`/player/${request.from.username}`} onClick={onClose}>
              <Avatar
                src={request.from.avatarUrl}
                fallback={request.from.username}
                size="sm"
              />
            </Link>
            <div className="flex-1 min-w-0">
              <Link
                href={`/player/${request.from.username}`}
                onClick={onClose}
                className="hover:text-accent transition-colors"
              >
                <p className="text-sm font-medium text-text-1 truncate">
                  {request.from.displayName || request.from.username}
                </p>
              </Link>
              <p className="text-2xs text-text-3">
                {formatRelativeTime(request.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-2 ml-10">
            <Button
              size="sm"
              onClick={() => onAccept(request)}
              disabled={acceptingId === request.id || rejectingId === request.id}
              className="flex-1"
            >
              {acceptingId === request.id ? "..." : "Accept"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReject(request)}
              disabled={acceptingId === request.id || rejectingId === request.id}
              className="flex-1"
            >
              {rejectingId === request.id ? "..." : "Decline"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
