import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FormatBadge, ConfirmationStatus } from '@/components/ui'
import { formatRelativeTime } from '@/lib/utils'
import type { PendingConfirmation } from '@/types'

type PendingConfirmationCardProps = {
  confirmation: PendingConfirmation
}

/**
 * Displays a pending match confirmation with actions to view/confirm.
 * Used on the personal dashboard.
 */
export function PendingConfirmationCard({ confirmation }: PendingConfirmationCardProps) {
  const { match } = confirmation
  const confirmationStatus = match.isFullyConfirmed 
    ? 'confirmed' 
    : match.confirmedCount > 0 
      ? 'pending' 
      : 'unconfirmed'
  
  return (
    <Card className="border-warning/30 bg-warning/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Match info */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <FormatBadge format={match.formatSlug} />
                <span className="text-text-2 text-sm">•</span>
                <span className="text-text-2 text-sm">{match.participantCount} players</span>
              </div>
              <p className="text-text-2 text-sm mt-1">
                {formatRelativeTime(match.playedAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Confirmation status */}
            <div className="flex items-center gap-1.5 text-sm text-text-2">
              <ConfirmationStatus status={confirmationStatus} />
              <span>{match.confirmedCount}/{match.participantCount}</span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button size="sm" variant="secondary">
                View
              </Button>
              <Button size="sm">
                Confirm
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
