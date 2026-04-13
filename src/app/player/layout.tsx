import { Navbar } from "@/components/features/navbar";

export default function PlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="max-w-6xl md:mx-auto px-4 py-8">
        {children}
      </main>
    </>
  );
}
