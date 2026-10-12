import { adminUrl, authHeaders } from "@/lib/api";

/** List endpoints that support `?format=csv` on the backend. Anything else is refused. */
const ENDPOINTS = new Set(["users", "astrologers", "sessions", "calls", "payments", "refunds", "wallet-ledger", "payouts", "tickets", "audit-logs"]);
const PASS_PARAMS = ["q", "status", "wallet", "joined", "skill", "mode", "quality", "method", "type", "reason", "priority", "category", "assignee", "admin", "module", "from", "to", "sort"];

/**
 * GET /export/<endpoint>?<filters>&filename=x.csv — streams the backend's CSV
 * export (every matching row, audit-logged) with the admin's session token.
 */
export async function GET(request, { params }) {
  const { endpoint } = await params;
  if (!ENDPOINTS.has(endpoint)) return new Response("Not found", { status: 404 });

  const sp = request.nextUrl.searchParams;
  const query = { format: "csv" };
  for (const k of PASS_PARAMS) if (sp.get(k)) query[k] = sp.get(k);

  let res;
  try {
    res = await fetch(adminUrl(`/${endpoint}`, query), { headers: await authHeaders(), cache: "no-store" });
  } catch {
    return new Response("Can't reach the server. Try again.", { status: 503 });
  }
  if (res.status === 401) {
    const code = (await res.json().catch(() => null))?.error?.code;
    return Response.redirect(new URL(`/signout?reason=${code === "SIGNED_IN_ELSEWHERE" ? "elsewhere" : "expired"}`, request.url), 303);
  }
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    return new Response(json?.error?.message ?? "Export failed", { status: res.status, headers: { "content-type": "text/plain; charset=utf-8" } });
  }

  const filename = (sp.get("filename") || `${endpoint}.csv`).replace(/[^\w.-]/g, "_").slice(0, 80);
  return new Response(res.body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename.endsWith(".csv") ? filename : `${filename}.csv`}"`,
      "cache-control": "no-store",
    },
  });
}
