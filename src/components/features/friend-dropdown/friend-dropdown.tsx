"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { getIncomingFriendRequests } from "@/lib/supabase/profiles";
import { acceptFriendRequest, rejectFriendRequest } from "@/app/actions/friend";
import { useFriendRequestRealtime } from "@/hooks/use-friend-request-realtime";
import type { FriendRequest } from "@/types";
import type { FriendDropdownProps, FriendDropdownTab, SearchResult } from "./types";
import { UsersIcon, XIcon } from "./icons";
import { FriendsTab } from "./friends-tab";
import { RequestsTab } from "./requests-tab";
import { SearchTab } from "./search-tab";

export function FriendDropdown({
  initialFriends,
  initialPendingRequests,
  initialPendingCount,
  userId,
}: FriendDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [friends, setFriends] = React.useState(initialFriends);
  const [pendingRequests, setPendingRequests] = React.useState(initialPendingRequests);
  const [pendingCount, setPendingCount] = React.useState(initialPendingCount);
  const [activeTab, setActiveTab] = React.useState<FriendDropdownTab>(
    initialPendingCount > 0 ? "requests" : "friends"
  );
  const [isMobile, setIsMobile] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Search state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(false);

  // Action loading states
  const [acceptingId, setAcceptingId] = React.useState<string | null>(null);
  const [rejectingId, setRejectingId] = React.useState<string | null>(null);
  const [sendingTo, setSendingTo] = React.useState<string | null>(null);

  // Realtime updates for new friend requests
  useFriendRequestRealtime({
    userId,
    onNewRequest: React.useCallback(async () => {
      const supabase = createClient();
      const result = await getIncomingFriendRequests(supabase, userId);
      if (result.success) {
        setPendingRequests(result.data);
        setPendingCount(result.data.length);
      }
    }, [userId]),
  });

  // Check mobile viewport
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close dropdown when clicking outside (desktop only)
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        !isMobile &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen && !isMobile) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, isMobile]);

  // Close dropdown on escape key
  React.useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  // Prevent body scroll on mobile when open
  React.useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen, isMobile]);

  const handleOpen = () => {
    setIsOpen(true);
    if (pendingCount > 0) {
      setActiveTab("requests");
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
  };

  const handleAccept = async (request: FriendRequest) => {
    setAcceptingId(request.id);
    const result = await acceptFriendRequest(request.id);

    if (result.success) {
      setPendingRequests((prev) => prev.filter((r) => r.id !== request.id));
      setPendingCount((prev) => Math.max(0, prev - 1));
      setFriends((prev) => [
        ...prev,
        {
          ...request.from,
          friendshipId: request.id,
          friendsSince: new Date().toISOString(),
        },
      ]);
      router.refresh();
    }

    setAcceptingId(null);
  };

  const handleReject = async (request: FriendRequest) => {
    setRejectingId(request.id);
    const result = await rejectFriendRequest(request.id);

    if (result.success) {
      setPendingRequests((prev) => prev.filter((r) => r.id !== request.id));
      setPendingCount((prev) => Math.max(0, prev - 1));
      router.refresh();
    }

    setRejectingId(null);
  };

  const tabs = [
    { id: "friends" as const, label: "Friends", count: friends.length },
    { id: "requests" as const, label: "Requests", count: pendingCount },
    { id: "search" as const, label: "Search", count: null },
  ];

  const dropdownContent = (
    <div
      className={cn(
        "rounded-lg border border-card-border bg-card shadow-lg",
        "animate-in fade-in-0 zoom-in-95 duration-100",
        isMobile
          ? cn(
            "fixed left-0 w-full z-50 bg-card flex flex-col",
          )
          : cn(
              "absolute right-0 mt-2 w-80 origin-top-right",
              "max-h-[70vh] overflow-hidden flex flex-col"
            )
      )}
      role="dialog"
      aria-label="Friends"
    >
      {/* Header */}
      <div
        className={cn(
          "px-4 py-3 border-b border-card-border flex items-center justify-between",
          isMobile && "pt-4"
        )}
      >
        <h3 className="text-ui font-semibold text-text-1">Friends</h3>
        {isMobile && (
          <button
            onClick={handleClose}
            className="p-2 -mr-2 rounded-full text-text-2 hover:text-text-1 hover:bg-surface transition-colors"
            aria-label="Close"
          >
            <XIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-card-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 px-3 py-2 text-sm font-medium transition-colors relative",
              activeTab === tab.id
                ? "text-accent border-b-2 border-accent -mb-px"
                : "text-text-2 hover:text-text-1"
            )}
          >
            {tab.label}
            {tab.count !== null && tab.count > 0 && (
              <span
                className={cn(
                  "ml-1.5 px-1.5 py-0.5 text-2xs rounded-full",
                  tab.id === "requests" && pendingCount > 0
                    ? "bg-danger text-white"
                    : "bg-surface text-text-2"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className={cn("flex-1 overflow-y-auto", isMobile && "pb-safe")}>
        {activeTab === "friends" && (
          <FriendsTab friends={friends} onClose={handleClose} />
        )}

        {activeTab === "requests" && (
          <RequestsTab
            pendingRequests={pendingRequests}
            acceptingId={acceptingId}
            rejectingId={rejectingId}
            onAccept={handleAccept}
            onReject={handleReject}
            onClose={handleClose}
          />
        )}

        {activeTab === "search" && (
          <SearchTab
            userId={userId}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchResults={searchResults}
            setSearchResults={setSearchResults}
            isSearching={isSearching}
            setIsSearching={setIsSearching}
            hasSearched={hasSearched}
            setHasSearched={setHasSearched}
            sendingTo={sendingTo}
            setSendingTo={setSendingTo}
            pendingRequests={pendingRequests}
            setPendingRequests={setPendingRequests}
            setPendingCount={setPendingCount}
            onClose={handleClose}
          />
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-card-border">
        <Link
          href="/friends"
          onClick={handleClose}
          className="text-sm text-accent hover:text-accent/80 transition-colors"
        >
          View all friends
        </Link>
      </div>
    </div>
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={isOpen ? handleClose : handleOpen}
        className={cn(
          "cursor-pointer relative p-2 rounded-full transition-colors",
          "text-text-2 hover:text-text-1 hover:bg-surface",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface"
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`Friends${pendingCount > 0 ? ` (${pendingCount} pending)` : ""}`}
      >
        <UsersIcon className="w-5 h-5" />

        {pendingCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-4.5 h-4.5 px-1 text-2xs font-bold text-white bg-danger rounded-full">
            {pendingCount > 99 ? "99+" : pendingCount}
          </span>
        )}
      </button>

      {isOpen && dropdownContent}
    </div>
  );
}
