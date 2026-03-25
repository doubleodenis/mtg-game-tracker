import { PageHeader } from "@/components/layout";
import { DeckForm } from "@/components/deck";
import { createMockDeckWithStats, resetMockIds } from "@/lib/mock";

// Force dynamic rendering
export const dynamic = "force-dynamic";

interface EditDeckPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditDeckPage({ params }: EditDeckPageProps) {
  const { id } = await params;

  // Reset mock IDs for fresh data
  resetMockIds();

  // TODO: Fetch real deck by ID
  const deck = createMockDeckWithStats({
    id,
    deckName: "Vampire Tribal",
  });

  // Determine if deck has been used in matches (locks editing)
  const hasMatches = deck.stats.gamesPlayed > 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title="Edit Deck"
        description={`Editing "${deck.deckName || deck.commanderName}"`}
      />
      <DeckForm
        deck={deck}
        hasMatches={hasMatches}
        isActive={deck.isActive}
      />
    </div>
  );
}
