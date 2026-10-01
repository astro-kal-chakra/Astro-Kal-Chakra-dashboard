import { getCurrentAdmin } from "@/lib/session";
import { getAttentionCounts } from "@/services";
import { AdminShell } from "@/components/layout/AdminShell";

export default async function AdminLayout({ children }) {
  const [admin, counts] = await Promise.all([getCurrentAdmin(), getAttentionCounts()]);
  return (
    <AdminShell admin={admin} counts={counts}>
      {children}
    </AdminShell>
  );
}
