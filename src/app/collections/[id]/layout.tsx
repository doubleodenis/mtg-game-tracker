import { TabNav, type NavItem } from "@/components/layout";

interface CollectionLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function CollectionLayout({
  children,
  params,
}: CollectionLayoutProps) {
  const { id } = await params;

  const navItems: NavItem[] = [
    { label: "Overview", href: `/collections/${id}` },
    { label: "Matches", href: `/collections/${id}/matches` },
    { label: "Leaderboard", href: `/collections/${id}/leaderboard` },
    { label: "Members", href: `/collections/${id}/members` },
    { label: "Settings", href: `/collections/${id}/settings` },
  ];

  return (
    <div className="space-y-6">
      <TabNav items={navItems} />
      {children}
    </div>
  );
}
