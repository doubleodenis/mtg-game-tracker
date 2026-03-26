/**
 * Supabase Query Helpers
 *
 * Central export for all data access layer functions.
 * All queries use mappers to convert DB types to application types.
 * JSONB fields are validated and cast at this boundary.
 *
 * Usage:
 * ```ts
 * import { createClient } from '@/lib/supabase/server'
 * import { getProfileById, getUserDecks } from '@/lib/supabase'
 *
 * export default async function Page() {
 *   const client = await createClient()
 *   const { data: profile } = await getProfileById(client, userId)
 *   const { data: decks } = await getUserDecks(client, userId)
 * }
 * ```
 */

// Client factories
export { createClient as createServerClient } from './server'
export { createClient as createBrowserClient } from './client'

// Profile & Friends
export {
  getProfileById,
  getProfileByUsername,
  searchProfiles,
  updateProfile,
  getFriends,
  getIncomingFriendRequests,
  getOutgoingFriendRequests,
  sendFriendRequest,
  respondToFriendRequest,
  removeFriend,
  getFriendshipStatus,
  getLeaderboard,
} from './profiles'

// Decks
export {
  getDeckById,
  getUserDecks,
  getActiveDecks,
  getDeckWithStats,
  getUserDecksWithStats,
  createDeck,
  updateDeck,
  retireDeck,
  reactivateDeck,
  deleteDeck,
  canEditDeck,
} from './decks'

// Collections
export {
  getCollectionById,
  getUserCollections,
  getCollectionWithMembers,
  getCollectionSummary,
  searchPublicCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  addCollectionMember,
  removeCollectionMember,
  getCollectionMembers,
  isCollectionMember,
  addMatchToCollection,
  updateMatchApprovalStatus,
  removeMatchFromCollection,
  getPendingMatchApprovals,
} from './collections'

// Matches
export {
  getMatchById,
  getMatchWithDetails,
  getUserMatches,
  getRecentMatches,
  getPendingConfirmations,
  createMatch,
  confirmMatchParticipation,
  disputeMatchParticipation,
  claimPlaceholderSlot,
  approveSlotClaim,
  rejectSlotClaim,
  deleteMatch,
} from './matches'

// Ratings
export {
  getRating,
  getUserRatings,
  getUserStats,
  getFormatStats,
  getRatingHistory,
  getRatingTimeline,
  getRatingHistoryEntry,
  updateRating,
  recordRatingHistory,
} from './ratings'

// Formats
export {
  getFormats,
  getFormatSummaries,
  getFormatById,
  getFormatBySlug,
  getDefaultFormat,
} from './formats'
