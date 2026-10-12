/**
 * Service layer — the only place pages get data from. Each function calls the
 * admin API (`/api/v1/admin`, see the backend's docs/ADMIN_API.md) and returns
 * the shape the pages expect: lists are `{ rows, total, page, pageSize, pageCount, ...extras }`,
 * amounts are rupees, dates are epoch milliseconds.
 *
 * Server-only: never import this from a "use client" file.
 */
import { api, seg } from "@/lib/api";

/* ---------------- Overview ---------------- */
export const getAttentionCounts = () => api("/overview/attention");
export const getLiveSnapshot = () => api("/overview/live");

/* ---------------- Users ---------------- */
export const getUsers = ({ q, status, wallet, joined, now, registeredVia, lastLoginVia, sort = "joinedAt:desc", page } = {}) =>
  api("/users", { query: { q, status, wallet, joined, now, registeredVia, lastLoginVia, sort, page } });

export const getUser = (id) => api(`/users/${seg(id)}`, { nullOn404: true });

/* ---------------- Astrologers ---------------- */
export const getAstrologers = ({ q, status = "pending", skill, sort = "appliedAt:desc", page } = {}) =>
  api("/astrologers", { query: { q, status, skill, sort, page }, keep: ["status"] });

export const getAstrologer = (id) => api(`/astrologers/${seg(id)}`, { nullOn404: true });

/* ---------------- Sessions ---------------- */
/** Live sessions: { rows (filtered by mode), summary: { total, chat, voice, video, amount } over all of them }. */
export const getLiveSessions = ({ mode, page } = {}) => api("/sessions/live", { query: { mode, page } });

export const getSessions = ({ q, mode, status, from, to, sort = "startedAt:desc", page } = {}) =>
  api("/sessions", { query: { q, mode, status, from, to, sort, page } });

export const getSession = (id) => api(`/sessions/${seg(id)}`, { nullOn404: true });

/* ---------------- Chats ---------------- */
export const getChatSessions = ({ q, page } = {}) => api("/chats", { query: { q, page } });

/**
 * Transcript summary — never the messages. Messages come from `openChat()` (a
 * logged reason) or, while that 15-minute grant is valid, from `getChatMessages()`.
 */
export const getTranscript = (sessionId) => api(`/chats/${seg(sessionId)}`, { nullOn404: true });

export async function getChatMessages(sessionId) {
  try {
    return await api(`/chats/${seg(sessionId)}/messages`);
  } catch (err) {
    if (err.status === 403) return null; // grant expired: ask for a reason again
    throw err;
  }
}

export const getFlaggedChats = ({ q, type, status = "open", severity, page } = {}) =>
  api("/chats/flagged", { query: { q, type, status, severity, page } });

export async function searchChats({ q, page } = {}) {
  if (!q?.trim()) return { rows: [], total: 0, page: 1, pageCount: 1, pageSize: 10 };
  if (q.trim().length < 3) return { rows: [], total: 0, page: 1, pageCount: 1, pageSize: 10, tooShort: true };
  return api("/chats/search", { query: { q: q.trim(), page } });
}

/* ---------------- Calls ---------------- */
export const getCalls = ({ q, mode, quality, sort = "startedAt:desc", page } = {}) =>
  api("/calls", { query: { q, mode, quality, sort, page } });

/* ---------------- Payments ---------------- */
export const getPayments = ({ q, status, method, sort = "createdAt:desc", page } = {}) =>
  api("/payments", { query: { q, status, method, sort, page } });

export const getPayment = (id) => api(`/payments/${seg(id)}`, { nullOn404: true });

export const getRefunds = ({ q, status = "requested", page } = {}) => api("/refunds", { query: { q, status, page } });

export const getWalletLedger = ({ q, type, reason, page } = {}) => api("/wallet-ledger", { query: { q, type, reason, page } });

export const getReconciliation = ({ only, run, page } = {}) => api("/reconciliation", { query: { only, run, page } });

/* ---------------- Payouts ---------------- */
export const getPayouts = ({ q, status = "requested", page } = {}) => api("/payouts", { query: { q, status, page } });

/* ---------------- Support ---------------- */
export const getTickets = ({ q, status, priority, category, assignee, page } = {}) =>
  api("/tickets", { query: { q, status, priority, category, assignee, page } });

export const getTicket = (id) => api(`/tickets/${seg(id)}`, { nullOn404: true });

export const getCannedReplies = () => api("/canned-replies");

/* ---------------- Marketing & content ---------------- */
export const getMarketing = () => api("/marketing");

/* Each marketing page loads only its own data; coupons and push history are paged. */
export const getBanners = () => api("/banners");
export const getPacks = () => api("/recharge-packs");
export const getReferralRules = () => api("/referral");
/** { rows, total, page, pageSize, pageCount, active } */
export const getCoupons = ({ q, page } = {}) => api("/coupons", { query: { q, page } });
/** { rows, total, page, pageSize, pageCount } */
export const getPushCampaigns = ({ q, page } = {}) => api("/push", { query: { q, page } });

export const getContent = () => api("/content");

/** One page of articles: { rows, total, page, pageSize, pageCount, counts: { draft, review, published } }. */
export const getBlogs = ({ q, status, page } = {}) => api("/blogs", { query: { q, status, page } });

/** Report catalogue shown on the website / apps (rupees), with order counts. */
export const getReports = () => api("/reports");

/* ---------------- Settings, admins, audit ---------------- */
export const getSettings = () => api("/settings");

/** Astrologer registration form: { steps, fields[], options: { skills, languages, categories }, types } */
export const getAstroForm = () => api("/astro-form");

/** Astrologers in free chat mode + the free chat settings: { rows: [{ id, name, status, freeChat }], freeChat } */
export const getFreeChatAstrologers = () => api("/free-chat/astrologers");

export const getAdmins = () => api("/admins");

/** `{ roles (system + custom, with member counts), modules, actions }` */
export const getRoles = () => api("/roles");

export const getAuditLogs = ({ q, admin, module, from, to, page } = {}) =>
  api("/audit-logs", { query: { q, admin, module, from, to, page } });

export const getAuditLog = (id) => api(`/audit-logs/${seg(id)}`, { nullOn404: true });
