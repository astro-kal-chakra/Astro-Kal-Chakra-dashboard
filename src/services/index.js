/**
 * Service layer — the only place pages get data from.
 * Every function is async and accepts the same params a REST endpoint would
 * (q, filters, sort, page). To go live, replace each body with a `fetch` to
 * the backend; pages and components stay unchanged.
 *
 * Server-only: never import this from a "use client" file.
 */
import * as db from "@/data/db";
import { NOW } from "@/lib/clock";
import { queryList, eq, countBy, delay } from "./query";

const DAY = 86400000;

/* ---------------- Overview ---------------- */
export async function getAttentionCounts() {
  await delay();
  return {
    pendingApprovals: db.astrologers.filter((a) => a.status === "pending").length,
    payoutRequests: db.payouts.filter((p) => p.status === "requested").length,
    openTickets: db.tickets.filter((t) => t.status === "open").length,
    flaggedChats: db.flaggedChats.filter((f) => f.status === "open").length,
    failedPayments: db.payments.filter((p) => p.status === "failed" && p.createdAt > NOW - DAY * 7).length,
    pendingRefunds: db.refunds.filter((r) => r.status === "requested").length,
  };
}

export async function getLiveSnapshot() {
  await delay();
  const approved = db.astrologers.filter((a) => a.status === "approved");
  return {
    liveSessions: db.liveSessions.length,
    onlineAstrologers: approved.filter((a) => a.online).length,
    inQueue: approved.reduce((s, a) => s + a.queueLength, 0),
  };
}

/* ---------------- Users ---------------- */
const WALLET_FILTERS = {
  zero: (u) => u.wallet === 0,
  low: (u) => u.wallet > 0 && u.wallet < 100,
  mid: (u) => u.wallet >= 100 && u.wallet < 1000,
  high: (u) => u.wallet >= 1000,
};
const JOINED_FILTERS = {
  "7d": (u) => u.joinedAt > NOW - 7 * DAY,
  "30d": (u) => u.joinedAt > NOW - 30 * DAY,
  "90d": (u) => u.joinedAt > NOW - 90 * DAY,
};

export async function getUsers({ q, status, wallet, joined, sort = "joinedAt:desc", page } = {}) {
  await delay();
  return queryList(db.users, {
    q,
    searchKeys: ["name", "phone", "id", "email"],
    predicates: [eq("status", status), WALLET_FILTERS[wallet], JOINED_FILTERS[joined]],
    sort,
    page,
  });
}

export async function getUser(id) {
  await delay();
  const user = db.users.find((u) => u.id === id);
  if (!user) return null;
  return {
    ...user,
    sessions: db.sessions.filter((s) => s.userId === id).slice(0, 8),
    payments: db.payments.filter((p) => p.userId === id).slice(0, 8),
    ledger: db.walletLedger.filter((l) => l.userId === id).slice(0, 10),
    tickets: db.tickets.filter((t) => t.userId === id).slice(0, 5),
  };
}

/* ---------------- Astrologers ---------------- */
export async function getAstrologers({ q, status = "pending", skill, sort = "appliedAt:desc", page } = {}) {
  await delay();
  const result = queryList(db.astrologers, {
    q,
    searchKeys: ["name", "phone", "id", "city"],
    predicates: [eq("status", status), skill && skill !== "all" ? (a) => a.skills.includes(skill) : null],
    sort,
    page,
  });
  return { ...result, counts: countBy(db.astrologers, "status") };
}

export async function getAstrologer(id) {
  await delay();
  const a = db.astrologers.find((x) => x.id === id);
  if (!a) return null;
  const sessions = db.sessions.filter((s) => s.astrologerId === id);
  return {
    ...a,
    recentSessions: sessions.slice(0, 6),
    reviews: sessions
      .filter((s) => s.rating)
      .slice(0, 5)
      .map((s, i) => ({
        id: `${s.id}-r`,
        userName: s.userName,
        rating: s.rating,
        text: ["Very accurate and kind.", "Helpful remedies, will consult again.", "Took too long to reply.", "Good guidance on career.", "Average experience."][i % 5],
        at: s.endedAt,
        hidden: i === 4,
      })),
    complaintsList: db.tickets.filter((t) => t.category === "astrologer").slice(0, 3),
    payouts: db.payouts.filter((p) => p.astrologerId === id).slice(0, 5),
  };
}

/* ---------------- Sessions ---------------- */
export async function getLiveSessions({ mode } = {}) {
  await delay();
  return db.liveSessions.filter((s) => !mode || mode === "all" || s.mode === mode);
}

export async function getSessions({ q, mode, status, from, to, sort = "startedAt:desc", page } = {}) {
  await delay();
  const fromTs = from ? new Date(from).getTime() : null;
  const toTs = to ? new Date(to).getTime() + DAY : null;
  return queryList(db.sessions, {
    q,
    searchKeys: ["id", "userName", "astrologerName", "userId", "astrologerId"],
    predicates: [
      eq("mode", mode),
      eq("status", status),
      fromTs ? (s) => s.startedAt >= fromTs : null,
      toTs ? (s) => s.startedAt < toTs : null,
    ],
    sort,
    page,
  });
}

export async function getSession(id) {
  await delay();
  const s = db.sessions.find((x) => x.id === id) ?? db.liveSessions.find((x) => x.id === id);
  if (!s) return null;
  const minutes = Math.ceil((s.duration ?? 0) / 60);
  return {
    ...s,
    billing: Array.from({ length: Math.min(minutes, 60) }, (_, i) => ({
      minute: i + 1,
      rate: s.free && i < 5 ? 0 : s.ratePerMin,
      balanceAfter: Math.max(0, 1200 - (i + 1) * s.ratePerMin),
    })),
    timeline: [
      { label: "Request sent", at: s.startedAt - (s.waitTime ?? 30) * 1000 },
      { label: "Astrologer accepted", at: s.startedAt },
      ...(s.duration ? [{ label: `Session ended · ${s.endReason ?? "In progress"}`, at: s.endedAt }] : []),
      ...(s.rating ? [{ label: `Rated ${s.rating}★ by user`, at: (s.endedAt ?? s.startedAt) + 60000 }] : []),
    ],
    flags: db.flaggedChats.filter((f) => f.sessionId === id),
  };
}

/* ---------------- Chats ---------------- */
export async function getChatSessions({ q, page } = {}) {
  await delay();
  return queryList(
    db.sessions.filter((s) => s.mode === "chat" && s.duration),
    { q, searchKeys: ["id", "userName", "astrologerName"], page }
  );
}

export async function getTranscript(sessionId) {
  await delay();
  const session = db.sessions.find((s) => s.id === sessionId);
  if (!session) return null;
  return { session, messages: db.transcriptFor(sessionId) };
}

export async function getFlaggedChats({ q, type, status = "open", severity, page } = {}) {
  await delay();
  const result = queryList(db.flaggedChats, {
    q,
    searchKeys: ["userName", "astrologerName", "sessionId", "message"],
    predicates: [eq("type", type), eq("status", status === "resolved" ? null : status), status === "resolved" ? (f) => f.status !== "open" : null, eq("severity", severity)],
    sort: "flaggedAt:desc",
    page,
  });
  return { ...result, typeLabels: db.FLAG_TYPE_LABELS, counts: countBy(db.flaggedChats, "type") };
}

export async function searchChats({ q, page } = {}) {
  await delay();
  if (!q?.trim()) return { rows: [], total: 0, page: 1, pageCount: 1, pageSize: 10 };
  const term = q.toLowerCase();
  const hits = [];
  for (const s of db.sessions.filter((x) => x.mode === "chat" && x.duration).slice(0, 200)) {
    for (const m of db.transcriptFor(s.id)) {
      if (m.text.toLowerCase().includes(term)) hits.push({ ...m, sessionId: s.id, userName: s.userName, astrologerName: s.astrologerName });
    }
  }
  return queryList(hits, { page });
}

/* ---------------- Calls ---------------- */
export async function getCalls({ q, mode, quality, sort = "startedAt:desc", page } = {}) {
  await delay();
  const result = queryList(db.calls, {
    q,
    searchKeys: ["id", "sessionId", "userName", "astrologerName"],
    predicates: [eq("mode", mode), eq("quality", quality)],
    sort,
    page,
  });
  const total = db.calls.length;
  const drops = db.calls.filter((c) => c.disconnectReason !== "Normal hangup").length;
  return {
    ...result,
    summary: {
      total,
      minutes: Math.round(db.calls.reduce((s, c) => s + c.duration, 0) / 60),
      avgDuration: db.calls.reduce((s, c) => s + c.duration, 0) / total,
      dropRate: (drops / total) * 100,
    },
  };
}

/* ---------------- Payments ---------------- */
export async function getPayments({ q, status, method, sort = "createdAt:desc", page } = {}) {
  await delay();
  const result = queryList(db.payments, {
    q,
    searchKeys: ["id", "userName", "userId", "gatewayPaymentId", "gatewayOrderId"],
    predicates: [eq("status", status), eq("method", method)],
    sort,
    page,
  });
  return { ...result, counts: countBy(db.payments, "status") };
}

export async function getPayment(id) {
  await delay();
  const p = db.payments.find((x) => x.id === id);
  if (!p) return null;
  return { ...p, refund: db.refunds.find((r) => r.paymentId === id) ?? null, ledger: db.walletLedger.filter((l) => l.reference === id) };
}

export async function getRefunds({ q, status = "requested", page } = {}) {
  await delay();
  const result = queryList(db.refunds, {
    q,
    searchKeys: ["id", "userName", "paymentId", "sessionId"],
    predicates: [eq("status", status)],
    sort: "requestedAt:desc",
    page,
  });
  return { ...result, counts: countBy(db.refunds, "status") };
}

export async function getWalletLedger({ q, type, reason, page } = {}) {
  await delay();
  return queryList(db.walletLedger, {
    q,
    searchKeys: ["id", "userName", "userId", "reference"],
    predicates: [eq("type", type), eq("reason", reason)],
    sort: "createdAt:desc",
    page,
  });
}

export async function getReconciliation({ only, page } = {}) {
  await delay();
  const rows = db.reconciliation;
  const mismatches = rows.filter((r) => r.mismatch);
  return {
    ...queryList(rows, { predicates: [only === "mismatch" ? (r) => r.mismatch : null], page }),
    summary: {
      checked: rows.length,
      matched: rows.length - mismatches.length,
      mismatched: mismatches.length,
      gatewayTotal: rows.reduce((s, r) => s + r.gatewayAmount, 0),
      dbTotal: rows.reduce((s, r) => s + (r.dbAmount ?? 0), 0),
    },
  };
}

/* ---------------- Payouts ---------------- */
export async function getPayouts({ q, status = "requested", page } = {}) {
  await delay();
  const result = queryList(db.payouts, {
    q,
    searchKeys: ["id", "astrologerName", "astrologerId", "utr"],
    predicates: [eq("status", status)],
    sort: "requestedAt:desc",
    page,
  });
  const pending = db.payouts.filter((p) => p.status === "requested");
  const paid = db.payouts.filter((p) => p.status === "paid");
  return {
    ...result,
    counts: countBy(db.payouts, "status"),
    summary: {
      pendingAmount: pending.reduce((s, p) => s + p.net, 0),
      paidAmount: paid.reduce((s, p) => s + p.net, 0),
      commission: db.payouts.reduce((s, p) => s + p.commission, 0),
      gross: db.payouts.reduce((s, p) => s + p.gross, 0),
    },
  };
}

/* ---------------- Support ---------------- */
export async function getTickets({ q, status, priority, category, assignee, page } = {}) {
  await delay();
  const result = queryList(db.tickets, {
    q,
    searchKeys: ["id", "subject", "userName", "userId"],
    predicates: [
      eq("status", status),
      eq("priority", priority),
      eq("category", category),
      assignee === "unassigned" ? (t) => !t.assignee : eq("assignee", assignee),
    ],
    sort: "createdAt:desc",
    page,
  });
  return { ...result, counts: countBy(db.tickets, "status"), agents: db.SUPPORT_AGENTS };
}

export async function getTicket(id) {
  await delay();
  const t = db.tickets.find((x) => x.id === id);
  if (!t) return null;
  return {
    ...t,
    session: t.linkedSessionId ? db.sessions.find((s) => s.id === t.linkedSessionId) : null,
    payment: t.linkedPaymentId ? db.payments.find((p) => p.id === t.linkedPaymentId) : null,
    agents: db.SUPPORT_AGENTS,
    cannedReplies: db.cannedReplies,
  };
}

export async function getCannedReplies() {
  await delay();
  return db.cannedReplies;
}

/* ---------------- Marketing & content ---------------- */
export async function getMarketing() {
  await delay();
  return {
    banners: db.banners,
    coupons: db.coupons,
    packs: db.rechargePacks,
    referral: db.referralRules,
    push: db.pushCampaigns,
  };
}

export async function getContent() {
  await delay();
  return { horoscopes: db.horoscopes, blogs: db.blogs, faqs: db.faqs, policies: db.policies };
}

/* ---------------- Settings, admins, audit ---------------- */
export async function getSettings() {
  await delay();
  return db.settings;
}

export async function getAdmins() {
  await delay();
  return db.admins;
}

export async function getAuditLogs({ q, admin, module, from, to, page } = {}) {
  await delay();
  const fromTs = from ? new Date(from).getTime() : null;
  const toTs = to ? new Date(to).getTime() + DAY : null;
  const result = queryList(db.auditLogs, {
    q,
    searchKeys: ["action", "label", "target", "adminName", "ip"],
    predicates: [eq("adminId", admin), eq("module", module), fromTs ? (l) => l.createdAt >= fromTs : null, toTs ? (l) => l.createdAt < toTs : null],
    sort: "createdAt:desc",
    page,
    pageSize: 15,
  });
  return { ...result, admins: db.admins.map(({ id, name }) => ({ id, name })) };
}
