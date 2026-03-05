import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/features/navbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0a0a12" }}>
      <Navbar />
      
      {/* Dashboard Navigation */}
      <nav style={{ 
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)", 
        backgroundColor: "#0f0f1a" 
      }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "0 1rem" }}>
          <div style={{ display: "flex", gap: "1.5rem", overflowX: "auto" }}>
            <NavLink href="/dashboard">Overview</NavLink>
            <NavLink href="/dashboard/matches/new">New Match</NavLink>
            <NavLink href="/dashboard/commanders">Commanders</NavLink>
            <NavLink href="/dashboard/friends">Friends</NavLink>
            <NavLink href="/dashboard/groups">Groups</NavLink>
            <NavLink href="/dashboard/settings">Settings</NavLink>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: "72rem", margin: "0 auto", padding: "2rem 1rem" }}>
        {children}
      </main>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        padding: "0.75rem 0.25rem",
        fontSize: "0.875rem",
        color: "#a1a1aa",
        borderBottom: "2px solid transparent",
        whiteSpace: "nowrap",
        textDecoration: "none",
      }}
    >
      {children}
    </Link>
  );
}
