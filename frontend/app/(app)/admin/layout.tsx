import { requireAdmin } from "@/lib/auth/session";

// Druga linia obrony po proxy.ts: rola sprawdzona w backendzie (GET /auth/context),
// a nie tylko w JWT, który mógł zostać wystawiony przed zmianą roli.
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  return children;
}
