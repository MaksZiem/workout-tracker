import { requireUser } from "@/lib/auth/session";
import { Sidebar } from "@/components/nav/sidebar";
import { MobileNav } from "@/components/nav/mobile-nav";

// Shell dla wszystkich ekranów za logowaniem. proxy.ts wpuszcza tu tylko
// użytkowników z tokenem; requireUser() dodatkowo potwierdza go w backendzie.
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();

  return (
    <div className="flex min-h-dvh flex-1">
      <Sidebar user={user} />
      <main className="min-w-0 flex-1 px-4 pt-6 pb-28 sm:px-6 md:px-10 md:pt-10 md:pb-12">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>
      <MobileNav user={user} />
    </div>
  );
}
