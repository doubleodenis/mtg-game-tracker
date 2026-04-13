import type { Friend, FriendRequest, ProfileSummary, FriendshipStatus } from "@/types";

export type FriendDropdownTab = "friends" | "requests" | "search";

export type SearchResult = ProfileSummary & {
  friendshipStatus: FriendshipStatus | null;
  isOutgoing: boolean;
  isIncoming: boolean;
  friendshipId: string | null;
};

export interface FriendDropdownProps {
  initialFriends: Friend[];
  initialPendingRequests: FriendRequest[];
  initialPendingCount: number;
  userId: string;
}

export interface FriendsTabProps {
  friends: Friend[];
  onClose: () => void;
}

export interface RequestsTabProps {
  pendingRequests: FriendRequest[];
  acceptingId: string | null;
  rejectingId: string | null;
  onAccept: (request: FriendRequest) => void;
  onReject: (request: FriendRequest) => void;
  onClose: () => void;
}

export interface SearchTabProps {
  userId: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: SearchResult[];
  setSearchResults: React.Dispatch<React.SetStateAction<SearchResult[]>>;
  isSearching: boolean;
  setIsSearching: (searching: boolean) => void;
  hasSearched: boolean;
  setHasSearched: (searched: boolean) => void;
  sendingTo: string | null;
  setSendingTo: (id: string | null) => void;
  pendingRequests: FriendRequest[];
  setPendingRequests: React.Dispatch<React.SetStateAction<FriendRequest[]>>;
  setPendingCount: React.Dispatch<React.SetStateAction<number>>;
  onClose: () => void;
}
