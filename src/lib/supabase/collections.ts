/**
 * Collection Supabase Query Helpers
 *
 * All queries for collection CRUD, membership, and match management.
 * Uses mappers at the boundary to convert DB types to application types.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import type { Result } from '@/types'
import type {
  Collection,
  CollectionSummary,
  CollectionMember,
  CollectionMemberWithProfile,
  CollectionWithMembers,
  CollectionWithMembership,
  CollectionMatch,
  CreateCollectionPayload,
  UpdateCollectionPayload,
  ApprovalStatus,
} from '@/types/collection'
import {
  mapCollectionRow,
  mapCollectionSummary,
  mapCollectionMemberRow,
  mapCollectionMemberWithProfile,
  mapProfileSummary,
} from '@/types/database-mappers'

// ============================================
// Collection Queries
// ============================================

/**
 * Get a collection by ID
 */
export async function getCollectionById(
  client: SupabaseClient<Database>,
  collectionId: string
): Promise<Result<Collection>> {
  const { data, error } = await client
    .from('collections')
    .select('*')
    .eq('id', collectionId)
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: mapCollectionRow(data) }
}

/**
 * Get collections the user is a member of
 */
export async function getUserCollections(
  client: SupabaseClient<Database>,
  userId: string
): Promise<Result<CollectionWithMembership[]>> {
  // Get collection IDs where user is a member
  const { data: memberships, error: membershipError } = await client
    .from('collection_members')
    .select('collection_id, role')
    .eq('user_id', userId)

  if (membershipError) {
    return { success: false, error: membershipError.message }
  }

  if (memberships.length === 0) {
    return { success: true, data: [] }
  }

  const collectionIds = memberships.map((m) => m.collection_id)

  // Get collections with counts
  const { data: collections, error: collectionsError } = await client
    .from('collections')
    .select('*')
    .in('id', collectionIds)

  if (collectionsError) {
    return { success: false, error: collectionsError.message }
  }

  // Get member and match counts for each collection
  const countsPromises = collections.map(async (c) => {
    const [memberCount, matchCount] = await Promise.all([
      client.from('collection_members').select('*', { count: 'exact', head: true }).eq('collection_id', c.id),
      client.from('collection_matches').select('*', { count: 'exact', head: true }).eq('collection_id', c.id).eq('approval_status', 'approved'),
    ])
    return {
      collectionId: c.id,
      memberCount: memberCount.count ?? 0,
      matchCount: matchCount.count ?? 0,
    }
  })

  const counts = await Promise.all(countsPromises)
  const countsMap = new Map(counts.map((c) => [c.collectionId, c]))

  // Build membership map
  const membershipMap = new Map(memberships.map((m) => [m.collection_id, m.role]))

  // Map to CollectionWithMembership
  const result: CollectionWithMembership[] = collections.map((c) => {
    const countData = countsMap.get(c.id) ?? { memberCount: 0, matchCount: 0 }
    return {
      ...mapCollectionRow(c),
      isMember: true,
      userRole: membershipMap.get(c.id) as 'owner' | 'member',
      memberCount: countData.memberCount,
      matchCount: countData.matchCount,
    }
  })

  return { success: true, data: result }
}

/**
 * Get a collection with all members
 */
export async function getCollectionWithMembers(
  client: SupabaseClient<Database>,
  collectionId: string
): Promise<Result<CollectionWithMembers>> {
  const { data: collection, error: collectionError } = await client
    .from('collections')
    .select(`
      *,
      owner:profiles!collections_owner_id_fkey(*)
    `)
    .eq('id', collectionId)
    .single()

  if (collectionError) {
    return { success: false, error: collectionError.message }
  }

  const { data: members, error: membersError } = await client
    .from('collection_members')
    .select(`
      *,
      profile:profiles!collection_members_user_id_fkey(*)
    `)
    .eq('collection_id', collectionId)

  if (membersError) {
    return { success: false, error: membersError.message }
  }

  return {
    success: true,
    data: {
      ...mapCollectionRow(collection),
      owner: mapProfileSummary(collection.owner),
      members: members.map((m) => mapCollectionMemberWithProfile(m, m.profile)),
    },
  }
}

/**
 * Get collection summary with counts
 */
export async function getCollectionSummary(
  client: SupabaseClient<Database>,
  collectionId: string
): Promise<Result<CollectionSummary>> {
  const [collectionResult, memberCountResult, matchCountResult] = await Promise.all([
    client.from('collections').select('*').eq('id', collectionId).single(),
    client.from('collection_members').select('*', { count: 'exact', head: true }).eq('collection_id', collectionId),
    client.from('collection_matches').select('*', { count: 'exact', head: true }).eq('collection_id', collectionId).eq('approval_status', 'approved'),
  ])

  if (collectionResult.error) {
    return { success: false, error: collectionResult.error.message }
  }

  return {
    success: true,
    data: mapCollectionSummary(
      collectionResult.data,
      memberCountResult.count ?? 0,
      matchCountResult.count ?? 0
    ),
  }
}

/**
 * Search public collections
 */
export async function searchPublicCollections(
  client: SupabaseClient<Database>,
  query: string,
  limit = 10
): Promise<Result<CollectionSummary[]>> {
  const { data, error } = await client
    .from('collections')
    .select('*')
    .eq('is_public', true)
    .ilike('name', `%${query}%`)
    .limit(limit)

  if (error) {
    return { success: false, error: error.message }
  }

  // Get counts for each collection
  const countsPromises = data.map(async (c) => {
    const [memberCount, matchCount] = await Promise.all([
      client.from('collection_members').select('*', { count: 'exact', head: true }).eq('collection_id', c.id),
      client.from('collection_matches').select('*', { count: 'exact', head: true }).eq('collection_id', c.id).eq('approval_status', 'approved'),
    ])
    return {
      collection: c,
      memberCount: memberCount.count ?? 0,
      matchCount: matchCount.count ?? 0,
    }
  })

  const withCounts = await Promise.all(countsPromises)

  return {
    success: true,
    data: withCounts.map((c) => mapCollectionSummary(c.collection, c.memberCount, c.matchCount)),
  }
}

// ============================================
// Collection Mutations
// ============================================

/**
 * Create a new collection
 */
export async function createCollection(
  client: SupabaseClient<Database>,
  userId: string,
  payload: CreateCollectionPayload
): Promise<Result<Collection>> {
  // Create the collection
  const { data: collection, error: collectionError } = await client
    .from('collections')
    .insert({
      owner_id: userId,
      name: payload.name,
      description: payload.description ?? null,
      is_public: payload.isPublic ?? false,
      match_add_permission: payload.matchAddPermission ?? 'owner_only',
    })
    .select()
    .single()

  if (collectionError) {
    return { success: false, error: collectionError.message }
  }

  // Add owner as a member with 'owner' role
  const { error: memberError } = await client
    .from('collection_members')
    .insert({
      collection_id: collection.id,
      user_id: userId,
      role: 'owner',
    })

  if (memberError) {
    // Rollback: delete the collection if member creation fails
    await client.from('collections').delete().eq('id', collection.id)
    return { success: false, error: memberError.message }
  }

  return { success: true, data: mapCollectionRow(collection) }
}

/**
 * Update a collection
 */
export async function updateCollection(
  client: SupabaseClient<Database>,
  collectionId: string,
  payload: UpdateCollectionPayload
): Promise<Result<Collection>> {
  const updates: Record<string, unknown> = {}

  if (payload.name !== undefined) updates.name = payload.name
  if (payload.description !== undefined) updates.description = payload.description
  if (payload.isPublic !== undefined) updates.is_public = payload.isPublic
  if (payload.matchAddPermission !== undefined) updates.match_add_permission = payload.matchAddPermission

  const { data, error } = await client
    .from('collections')
    .update(updates)
    .eq('id', collectionId)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: mapCollectionRow(data) }
}

/**
 * Delete a collection (owner only)
 */
export async function deleteCollection(
  client: SupabaseClient<Database>,
  collectionId: string
): Promise<Result<null>> {
  const { error } = await client
    .from('collections')
    .delete()
    .eq('id', collectionId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: null }
}

// ============================================
// Collection Membership
// ============================================

/**
 * Add a member to a collection
 */
export async function addCollectionMember(
  client: SupabaseClient<Database>,
  collectionId: string,
  userId: string
): Promise<Result<CollectionMember>> {
  const { data, error } = await client
    .from('collection_members')
    .insert({
      collection_id: collectionId,
      user_id: userId,
      role: 'member',
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: mapCollectionMemberRow(data) }
}

/**
 * Remove a member from a collection
 */
export async function removeCollectionMember(
  client: SupabaseClient<Database>,
  collectionId: string,
  userId: string
): Promise<Result<null>> {
  const { error } = await client
    .from('collection_members')
    .delete()
    .eq('collection_id', collectionId)
    .eq('user_id', userId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: null }
}

/**
 * Get collection members
 */
export async function getCollectionMembers(
  client: SupabaseClient<Database>,
  collectionId: string
): Promise<Result<CollectionMemberWithProfile[]>> {
  const { data, error } = await client
    .from('collection_members')
    .select(`
      *,
      profile:profiles!collection_members_user_id_fkey(*)
    `)
    .eq('collection_id', collectionId)

  if (error) {
    return { success: false, error: error.message }
  }

  return {
    success: true,
    data: data.map((m) => mapCollectionMemberWithProfile(m, m.profile)),
  }
}

/**
 * Check if a user is a member of a collection
 */
export async function isCollectionMember(
  client: SupabaseClient<Database>,
  collectionId: string,
  userId: string
): Promise<Result<boolean>> {
  const { count, error } = await client
    .from('collection_members')
    .select('*', { count: 'exact', head: true })
    .eq('collection_id', collectionId)
    .eq('user_id', userId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: (count ?? 0) > 0 }
}

// ============================================
// Collection Matches
// ============================================

/**
 * Add a match to a collection
 */
export async function addMatchToCollection(
  client: SupabaseClient<Database>,
  collectionId: string,
  matchId: string,
  addedBy: string,
  approvalStatus: ApprovalStatus = 'approved'
): Promise<Result<CollectionMatch>> {
  const { data, error } = await client
    .from('collection_matches')
    .insert({
      collection_id: collectionId,
      match_id: matchId,
      added_by: addedBy,
      approval_status: approvalStatus,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return {
    success: true,
    data: {
      id: data.id,
      collectionId: data.collection_id,
      matchId: data.match_id,
      addedBy: data.added_by,
      approvalStatus: data.approval_status as ApprovalStatus,
      addedAt: data.added_at ?? new Date().toISOString(),
    },
  }
}

/**
 * Update match approval status in a collection
 */
export async function updateMatchApprovalStatus(
  client: SupabaseClient<Database>,
  collectionMatchId: string,
  status: ApprovalStatus
): Promise<Result<null>> {
  const { error } = await client
    .from('collection_matches')
    .update({ approval_status: status })
    .eq('id', collectionMatchId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: null }
}

/**
 * Remove a match from a collection
 */
export async function removeMatchFromCollection(
  client: SupabaseClient<Database>,
  collectionId: string,
  matchId: string
): Promise<Result<null>> {
  const { error } = await client
    .from('collection_matches')
    .delete()
    .eq('collection_id', collectionId)
    .eq('match_id', matchId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: null }
}

/**
 * Get pending match approvals for a collection
 */
export async function getPendingMatchApprovals(
  client: SupabaseClient<Database>,
  collectionId: string
): Promise<Result<CollectionMatch[]>> {
  const { data, error } = await client
    .from('collection_matches')
    .select('*')
    .eq('collection_id', collectionId)
    .eq('approval_status', 'pending')

  if (error) {
    return { success: false, error: error.message }
  }

  return {
    success: true,
    data: data.map((m) => ({
      id: m.id,
      collectionId: m.collection_id,
      matchId: m.match_id,
      addedBy: m.added_by,
      approvalStatus: m.approval_status as ApprovalStatus,
      addedAt: m.added_at ?? new Date().toISOString(),
    })),
  }
}
