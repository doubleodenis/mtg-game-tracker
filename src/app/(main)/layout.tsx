// import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/features/navbar";
import { TabNav, type NavItem } from "@/components/layout";

// Nav items shown when logged in (personal dashboard)
const authenticatedNav: NavItem[] = [
  { label: "Overview", href: "/" },
  { label: "Matches", href: "/matches" },
  { label: "Decks", href: "/decks" },
  { label: "Collections", href: "/collections" },
  { label: "Friends", href: "/friends" },
];

// Nav items shown when logged out (global dashboard)
const publicNav: NavItem[] = [
  { label: "Overview", href: "/" },
  { label: "Leaderboards", href: "/leaderboards" },
];

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: Re-enable Supabase auth when backend is configured
  // const supabase = await createClient();
  // const { data: { user } } = await supabase.auth.getUser();
  const user = null as { id: string } | null;

  const navItems = user ? authenticatedNav : publicNav;

  return (
    <>
      <Navbar />
      <TabNav items={navItems} />
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </>
  );
}
