/**
 * Common utility types used throughout the application
 */

/**
 * UUID string type alias for clarity
 */
export type UUID = string

/**
 * ISO 8601 date string type alias
 */
export type ISODateString = string

/**
 * Result type for application-layer functions
 * Provides a consistent pattern for handling success/error cases
 */
export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Async result type for promise-returning functions
 */
export type AsyncResult<T> = Promise<Result<T>>

/**
 * Pagination parameters for list queries
 */
export type PaginationParams = {
  page?: number
  pageSize?: number
}

/**
 * Paginated response wrapper
 */
export type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * Sort direction for ordered queries
 */
export type SortDirection = 'asc' | 'desc'

/**
 * Generic sort parameters
 */
export type SortParams<T extends string> = {
  sortBy: T
  sortDirection: SortDirection
}

/**
 * Color identity for MTG decks
 */
export type ColorIdentity = ('W' | 'U' | 'B' | 'R' | 'G')[]

/**
 * MTG deck bracket (1-4 power level)
 */
export type Bracket = 1 | 2 | 3 | 4

/**
 * Default bracket used when not specified
 */
export const DEFAULT_BRACKET: Bracket = 2
