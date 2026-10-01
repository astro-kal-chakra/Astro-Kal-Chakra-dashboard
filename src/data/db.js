/**
 * In-memory mock database. Server-only: imported by `src/services/*`, never
 * by client components, so none of this ships to the browser.
 * Replace the services with real API calls and delete this folder.
 */
import { NOW } from "@/lib/clock";
import { createRng, fullName, CITIES, LANGUAGES, SKILLS, ASTRO_TITLES } from "./seed";

const DAY = 86400000;
const rng = createRng(20261001);
const { r, int, pick, weighted, some, daysAgo, phone } = rng;

/* ---------------- Astrologers ---------------- */
const KYC_DOCS = ["Aadhaar card", "PAN card", "Certification", "Address proof", "Selfie with ID"];
export const astrologers = Array.from({ length: 84 }, (_, i) => {
  const status = i < 12 ? "pending" : weighted([["approved", 80], ["rejected", 8], ["blocked", 5]]);
  const approved = status === "approved";
  const title = pick(ASTRO_TITLES);
  const sessions = approved ? int(40, 3200) : 0;
  const chatPrice = int(10, 60);
  const [city, state] = pick(CITIES);
  return {
    id: `A${201 + i}`,
    name: `${title ? title + " " : ""}${fullName(rng)}`,
    phone: phone(),
    email: `astro${201 + i}@mail.com`,
    city,
    state,
    gender: pick(["Male", "Female"]),
    status,
    appliedAt: daysAgo(status === "pending" ? 6 : 400, status === "pending" ? 0 : 20),
    experience: int(2, 28),
    skills: some(SKILLS, 1, 4),
    languages: some(LANGUAGES, 1, 3),
    rating: approved ? +(3.4 + r() * 1.6).toFixed(1) : 0,
    reviewsCount: approved ? int(10, 1800) : 0,
    sessions,
    earnings: sessions * int(90, 260),
    online: approved && r() > 0.45,
    inSession: approved && r() > 0.7,
    queueLength: approved ? int(0, 6) : 0,
    chatPrice,
    voicePrice: chatPrice + int(5, 20),
    videoPrice: chatPrice + int(15, 40),
    commission: pick([30, 35, 40]),
    badges: approved ? some(["Verified", "Top Rated", "Celebrity", "Rising Star"], 0, 2) : [],
    responseTime: int(8, 95),
    missedRequests: approved ? int(0, 60) : 0,
    onlineHours: approved ? int(20, 260) : 0,
    complaints: approved ? int(0, 14) : 0,
    rejectionReason: status === "rejected" ? pick(["Blurry KYC document", "Certification not verifiable", "Failed interview"]) : null,
    bio: "Practising astrologer specialising in career, marriage and health consultations with a compassionate, practical approach.",
    kyc: KYC_DOCS.map((name, d) => ({
      id: `DOC-${201 + i}-${d}`,
      name,
      status:
        status === "pending"
          ? weighted([["pending", 6], ["verified", 3], ["rejected", 1]])
          : status === "rejected" && d === 2
            ? "rejected"
            : "verified",
      uploadedAt: daysAgo(10, 1),
    })),
    bank: {
      bank: pick(["HDFC Bank", "ICICI Bank", "SBI", "Axis Bank", "Kotak"]),
      account: `XXXXXX${int(1000, 9999)}`,
      ifsc: `${pick(["HDFC", "ICIC", "SBIN", "UTIB", "KKBK"])}000${int(1000, 9999)}`,
    },
  };
});
const approvedAstros = astrologers.filter((a) => a.status === "approved");

/* ---------------- Users ---------------- */
export const users = Array.from({ length: 260 }, (_, i) => {
  const [city, state] = pick(CITIES);
  const joinedAt = daysAgo(420);
  const status = weighted([["active", 78], ["new", 14], ["blocked", 8]]);
  const name = fullName(rng);
  return {
    id: `U${10001 + i}`,
    name,
    phone: phone(),
    email: `${name.split(" ")[0].toLowerCase()}${i}@mail.com`,
    gender: pick(["Male", "Female", "Other"]),
    city,
    state,
    language: pick(LANGUAGES),
    joinedAt: status === "new" ? daysAgo(6) : joinedAt,
    lastActiveAt: daysAgo(30),
    status,
    wallet: weighted([[0, 20], [int(1, 99), 30], [int(100, 999), 35], [int(1000, 6000), 15]]),
    totalSpend: int(0, 42000),
    sessionsCount: int(0, 90),
    birth: {
      date: `${int(1965, 2005)}-${String(int(1, 12)).padStart(2, "0")}-${String(int(1, 28)).padStart(2, "0")}`,
      time: `${String(int(0, 23)).padStart(2, "0")}:${String(int(0, 59)).padStart(2, "0")}`,
      place: `${pick(CITIES)[0]}, India`,
    },
    devices: Array.from({ length: int(1, 3) }, (_, d) => ({
      id: `DEV-${i}-${d}`,
      model: pick(["Pixel 8", "Galaxy S23", "iPhone 14", "Redmi Note 13", "OnePlus 12", "Vivo V29"]),
      os: pick(["Android 14", "Android 15", "iOS 18"]),
      appVersion: pick(["4.2.0", "4.2.1", "4.3.0"]),
      lastSeen: daysAgo(20),
    })),
    referralCode: `ASTRO${int(1000, 9999)}`,
    referredBy: r() > 0.7 ? `U${int(10001, 10260)}` : null,
    referrals: int(0, 8),
  };
});

/* ---------------- Sessions ---------------- */
const END_REASONS = ["User ended", "Astrologer ended", "Low balance", "Network drop", "Force ended by admin", "Timeout"];
export const sessions = Array.from({ length: 420 }, (_, i) => {
  const user = pick(users);
  const astro = pick(approvedAstros);
  const mode = weighted([["chat", 65], ["voice", 22], ["video", 13]]);
  const status = weighted([["completed", 82], ["cancelled", 6], ["missed", 7], ["force_ended", 2], ["refunded", 3]]);
  const duration = ["completed", "force_ended", "refunded"].includes(status) ? int(120, 3600) : 0;
  const rate = astro[`${mode}Price`];
  const free = mode === "chat" && r() > 0.86;
  const startedAt = daysAgo(60);
  return {
    id: `S${700001 + i}`,
    userId: user.id,
    userName: user.name,
    astrologerId: astro.id,
    astrologerName: astro.name,
    mode,
    status,
    free,
    startedAt,
    endedAt: startedAt + duration * 1000,
    duration,
    ratePerMin: rate,
    amount: free ? 0 : Math.round((duration / 60) * rate),
    endReason: duration ? pick(END_REASONS) : status === "missed" ? "Astrologer did not accept" : "User cancelled",
    rating: duration && r() > 0.3 ? int(2, 5) : null,
    flagged: r() > 0.93,
    waitTime: int(5, 240),
  };
}).sort((a, b) => b.startedAt - a.startedAt);

export const liveSessions = approvedAstros
  .filter((a) => a.inSession)
  .slice(0, 16)
  .map((astro, i) => {
    const user = users[(i * 7) % users.length];
    const mode = weighted([["chat", 60], ["voice", 25], ["video", 15]]);
    const duration = int(30, 2400);
    return {
      id: `S${800001 + i}`,
      userId: user.id,
      userName: user.name,
      astrologerId: astro.id,
      astrologerName: astro.name,
      mode,
      startedAt: NOW - duration * 1000,
      duration,
      ratePerMin: astro[`${mode}Price`],
      amount: Math.round((duration / 60) * astro[`${mode}Price`]),
      userBalance: int(20, 1500),
      queue: astro.queueLength,
    };
  });

/* ---------------- Chat transcripts & flags ---------------- */
const USER_LINES = [
  "Namaste ji, I want to ask about my career.",
  "Will I get a job change this year?",
  "My date of birth is in my profile.",
  "What about marriage prospects?",
  "Is there any remedy you suggest?",
  "Thank you so much!",
];
const ASTRO_LINES = [
  "Namaste! Let me look at your chart.",
  "Saturn is transiting your 10th house right now.",
  "A positive change is indicated after March.",
  "Venus is strong in your chart — good signs for marriage.",
  "Chant the Hanuman Chalisa on Tuesdays.",
  "You're welcome, blessings to you.",
];
const FLAG_TYPES = {
  phone: { label: "Phone number", text: "Call me directly on 98XXXXXX21, cheaper rates" },
  upi: { label: "UPI ID", text: "Send ₹500 to astro.guru@okaxis for full report" },
  link: { label: "External link", text: "Join my channel t.me/astro_xyz for daily tips" },
  abuse: { label: "Abuse", text: "[Abusive language detected]" },
  off_platform: { label: "Off-platform request", text: "Let's continue on WhatsApp, the app charges too much" },
};
export const FLAG_TYPE_LABELS = Object.fromEntries(Object.entries(FLAG_TYPES).map(([k, v]) => [k, v.label]));

export function transcriptFor(sessionId) {
  const local = createRng([...sessionId].reduce((s, c) => s + c.charCodeAt(0), 0));
  const s = sessions.find((x) => x.id === sessionId) ?? sessions[0];
  let at = s.startedAt;
  return Array.from({ length: 12 }, (_, i) => {
    const fromUser = i % 2 === 0;
    const flaggedLine = s.flagged && i === 7;
    at += local.int(20, 90) * 1000;
    return {
      id: `${sessionId}-m${i}`,
      from: fromUser ? "user" : "astrologer",
      text: flaggedLine ? FLAG_TYPES.off_platform.text : (fromUser ? USER_LINES : ASTRO_LINES)[Math.floor(i / 2) % 6],
      at,
      flagged: flaggedLine,
    };
  });
}

export const flaggedChats = Array.from({ length: 38 }, (_, i) => {
  const s = sessions[i * 9];
  const type = pick(Object.keys(FLAG_TYPES));
  return {
    id: `F${5001 + i}`,
    sessionId: s.id,
    userName: s.userName,
    astrologerId: s.astrologerId,
    astrologerName: s.astrologerName,
    sender: type === "abuse" ? pick(["user", "astrologer"]) : "astrologer",
    type,
    message: FLAG_TYPES[type].text,
    severity: type === "abuse" || type === "upi" ? "high" : weighted([["medium", 6], ["low", 4]]),
    flaggedAt: daysAgo(i < 14 ? 2 : 30),
    status: i < 14 ? "open" : pick(["warned", "dismissed", "blocked", "commission_reduced"]),
  };
});

/* ---------------- Calls ---------------- */
export const calls = sessions
  .filter((s) => s.mode !== "chat" && s.duration)
  .map((s) => ({
    id: `C${s.id.slice(1)}`,
    sessionId: s.id,
    mode: s.mode,
    userName: s.userName,
    astrologerName: s.astrologerName,
    startedAt: s.startedAt,
    endedAt: s.endedAt,
    duration: s.duration,
    disconnectReason: weighted([["Normal hangup", 75], ["Network drop", 12], ["Low balance", 8], ["App crash", 5]]),
    quality: weighted([["good", 72], ["fair", 18], ["poor", 10]]),
    issues: r() > 0.75 ? some(["High latency", "Packet loss", "Echo", "Video freeze", "One-way audio"], 1, 2) : [],
  }));

/* ---------------- Payments, wallet, refunds ---------------- */
export const rechargePacks = [
  { id: "P1", amount: 50, bonus: 0, label: "Starter", active: true, sold: 1820 },
  { id: "P2", amount: 100, bonus: 20, label: "Popular", active: true, sold: 5240, highlight: true },
  { id: "P3", amount: 200, bonus: 50, label: "Value", active: true, sold: 3110 },
  { id: "P4", amount: 500, bonus: 150, label: "Saver", active: true, sold: 1460 },
  { id: "P5", amount: 1000, bonus: 350, label: "Premium", active: true, sold: 640 },
  { id: "P6", amount: 2000, bonus: 800, label: "Elite", active: false, sold: 210 },
];

export const payments = Array.from({ length: 320 }, (_, i) => {
  const user = pick(users);
  const pack = weighted(rechargePacks.map((p) => [p, p.sold]));
  const status = weighted([["success", 84], ["failed", 9], ["pending", 3], ["refunded", 4]]);
  const createdAt = daysAgo(60);
  return {
    id: `ORD${9800001 + i}`,
    userId: user.id,
    userName: user.name,
    amount: pack.amount,
    bonus: pack.bonus,
    pack: `₹${pack.amount} pack`,
    status,
    method: weighted([["UPI", 64], ["Card", 20], ["Netbanking", 10], ["Wallet", 6]]),
    gateway: "Razorpay",
    gatewayOrderId: `order_${(1e12 + i * 7919).toString(36)}`,
    gatewayPaymentId: status === "failed" ? null : `pay_${(2e12 + i * 104729).toString(36)}`,
    failureReason: status === "failed" ? pick(["Bank declined", "UPI timeout", "Insufficient funds", "User cancelled"]) : null,
    createdAt,
    coupon: r() > 0.85 ? pick(["FIRST50", "NAVRATRI25", "WELCOME"]) : null,
    webhooks: [
      { event: "order.created", at: createdAt, status: 200 },
      ...(status === "failed"
        ? [{ event: "payment.failed", at: createdAt + 42000, status: 200 }]
        : [
            { event: "payment.authorized", at: createdAt + 15000, status: 200 },
            { event: "payment.captured", at: createdAt + 21000, status: r() > 0.9 ? 500 : 200 },
          ]),
      ...(status === "refunded" ? [{ event: "refund.processed", at: createdAt + 3 * DAY, status: 200 }] : []),
    ],
  };
}).sort((a, b) => b.createdAt - a.createdAt);

export const refunds = Array.from({ length: 42 }, (_, i) => {
  const p = payments[i * 5];
  return {
    id: `RF${3001 + i}`,
    paymentId: p.id,
    sessionId: sessions[i * 3].id,
    userId: p.userId,
    userName: p.userName,
    amount: weighted([[p.amount, 5], [Math.round(p.amount / 2), 5]]),
    reason: pick(["Astrologer disconnected early", "Poor call quality", "Wrong charge", "Duplicate payment", "Astrologer unresponsive"]),
    status: i < 9 ? "requested" : weighted([["approved", 3], ["processed", 6], ["rejected", 2]]),
    requestedBy: pick(["Riya (Support)", "Arjun (Support)", "Auto-rule"]),
    requestedAt: daysAgo(i < 9 ? 2 : 40),
    destination: pick(["wallet", "source"]),
  };
});

export const walletLedger = Array.from({ length: 360 }, (_, i) => {
  const user = pick(users);
  const type = weighted([["credit", 45], ["debit", 55]]);
  const reason =
    type === "credit"
      ? weighted([["Recharge", 70], ["Recharge bonus", 12], ["Refund", 8], ["Referral reward", 5], ["Admin adjustment", 5]])
      : weighted([["Chat session", 60], ["Voice session", 22], ["Video session", 14], ["Admin adjustment", 4]]);
  return {
    id: `L${600001 + i}`,
    userId: user.id,
    userName: user.name,
    type,
    amount: int(10, 900),
    reason,
    reference: reason.includes("session")
      ? sessions[i % sessions.length].id
      : reason.startsWith("Recharge")
        ? payments[i % payments.length].id
        : `ADM-${int(100, 999)}`,
    balanceAfter: int(0, 3000),
    createdAt: daysAgo(45),
    by: reason === "Admin adjustment" ? "Neha Kapoor" : "System",
  };
}).sort((a, b) => b.createdAt - a.createdAt);

export const reconciliation = payments.slice(0, 80).map((p, i) => {
  const mismatch = i % 11 === 3 ? "amount" : i % 13 === 5 ? "status" : i % 17 === 8 ? "missing_in_db" : null;
  const gwStatus = p.status === "success" ? "captured" : p.status;
  return {
    orderId: p.id,
    gatewayPaymentId: p.gatewayPaymentId ?? "—",
    date: p.createdAt,
    gatewayAmount: p.amount,
    dbAmount: mismatch === "amount" ? p.amount - pick([20, 50, 100]) : mismatch === "missing_in_db" ? null : p.amount,
    gatewayStatus: mismatch === "status" ? "captured" : gwStatus,
    dbStatus: mismatch === "status" ? "pending" : mismatch === "missing_in_db" ? "—" : gwStatus,
    mismatch,
  };
});

/* ---------------- Payouts ---------------- */
export const payouts = Array.from({ length: 56 }, (_, i) => {
  const a = approvedAstros[i % approvedAstros.length];
  const gross = int(4000, 90000);
  const commission = Math.round((gross * a.commission) / 100);
  const tds = Math.round((gross - commission) * 0.01);
  const status = i < 10 ? "requested" : weighted([["paid", 70], ["processing", 10], ["rejected", 8], ["approved", 12]]);
  return {
    id: `PO${4001 + i}`,
    astrologerId: a.id,
    astrologerName: a.name,
    period: pick(["16–30 Sep 2026", "1–15 Sep 2026", "16–31 Aug 2026"]),
    gross,
    commissionRate: a.commission,
    commission,
    tds,
    net: gross - commission - tds,
    status,
    requestedAt: daysAgo(i < 10 ? 3 : 60),
    utr: status === "paid" ? `UTR${int(100000000, 999999999)}` : null,
    bank: `${a.bank.bank} ${a.bank.account}`,
  };
});

/* ---------------- Admins & audit ---------------- */
export const admins = [
  ["Vandana Rao", "super_admin"], ["Neha Kapoor", "ops_admin"], ["Rahul Menon", "ops_admin"], ["Riya Das", "support_agent"],
  ["Arjun Pillai", "support_agent"], ["Kavya Iyer", "support_agent"], ["Manish Gupta", "finance"], ["Pooja Joshi", "finance"],
  ["Siddharth Bose", "moderator"], ["Tanvi Mehta", "moderator"], ["Yash Agarwal", "marketing"], ["Harsh Verma", "ops_admin"],
].map(([name, role], i) => ({
  id: `ADM${101 + i}`,
  name,
  email: `${name.split(" ")[0].toLowerCase()}@astroadmin.in`,
  role,
  status: i === 11 ? "deactivated" : "active",
  twoFactor: i !== 11,
  lastLoginAt: daysAgo(5),
  createdAt: daysAgo(500, 60),
}));

const AUDIT_ACTIONS = [
  ["user.block", "users", "Blocked user"],
  ["user.wallet_adjust", "users", "Adjusted wallet"],
  ["user.reveal", "users", "Revealed birth details"],
  ["astrologer.approve", "astrologers", "Approved astrologer"],
  ["astrologer.reject", "astrologers", "Rejected astrologer"],
  ["session.force_end", "sessions", "Force-ended session"],
  ["chat.open", "chats", "Opened chat transcript"],
  ["refund.approve", "refunds", "Approved refund"],
  ["payout.approve", "payouts", "Approved payout"],
  ["settings.update", "settings", "Updated settings"],
  ["coupon.create", "marketing", "Created coupon"],
  ["admin.login", "auth", "Signed in"],
];
const REASONED = ["user.block", "user.wallet_adjust", "user.reveal", "session.force_end", "chat.open", "refund.approve"];
const BEFORE_AFTER = {
  "settings.update": [{ freeChatMinutes: 3 }, { freeChatMinutes: 5 }],
  "user.block": [{ status: "active" }, { status: "blocked" }],
  "user.wallet_adjust": [{ wallet: 120 }, { wallet: 220 }],
  "astrologer.approve": [{ status: "pending" }, { status: "approved" }],
  "refund.approve": [{ status: "requested" }, { status: "approved" }],
};
export const auditLogs = Array.from({ length: 180 }, (_, i) => {
  const [action, module, label] = pick(AUDIT_ACTIONS);
  const admin = pick(admins.slice(0, 11));
  const target =
    module === "astrologers" ? pick(astrologers).id
    : module === "sessions" || module === "chats" ? pick(sessions).id
    : module === "refunds" ? pick(refunds).id
    : module === "payouts" ? pick(payouts).id
    : module === "users" ? pick(users).id
    : "—";
  const [before, after] = BEFORE_AFTER[action] ?? [null, null];
  return {
    id: `AL${900001 + i}`,
    adminId: admin.id,
    adminName: admin.name,
    action,
    module,
    label,
    target,
    reason: REASONED.includes(action) ? pick(["User requested via support ticket", "Fraud / abuse investigation", "Payment dispute", "Quality review"]) : null,
    ip: `${int(49, 223)}.${int(0, 255)}.${int(0, 255)}.${int(1, 254)}`,
    userAgent: pick(["Chrome 131 · Windows", "Safari 18 · macOS", "Chrome 131 · Android"]),
    before,
    after,
    createdAt: daysAgo(30),
  };
}).sort((a, b) => b.createdAt - a.createdAt);

/* ---------------- Support ---------------- */
const TICKET_SUBJECTS = {
  payment: ["Money deducted but wallet not credited", "Recharge failed twice", "Coupon not applied"],
  session: ["Chat disconnected midway", "Charged for full minutes", "Astrologer didn't reply"],
  astrologer: ["Astrologer was rude", "Asked to pay outside the app", "Wrong prediction complaint"],
  account: ["Cannot log in with OTP", "Delete my account", "Change registered number"],
  technical: ["App crashes on video call", "Notifications not coming", "Kundli page not loading"],
};
export const SUPPORT_AGENTS = ["Riya Das", "Arjun Pillai", "Kavya Iyer"];
export const tickets = Array.from({ length: 86 }, (_, i) => {
  const category = pick(Object.keys(TICKET_SUBJECTS));
  const user = pick(users);
  const createdAt = daysAgo(i < 20 ? 3 : 40);
  const status = i < 20 ? weighted([["open", 6], ["pending", 3]]) : weighted([["resolved", 6], ["closed", 3], ["open", 1]]);
  const agent = pick(SUPPORT_AGENTS);
  return {
    id: `T${2001 + i}`,
    subject: pick(TICKET_SUBJECTS[category]),
    category,
    priority: weighted([["low", 3], ["medium", 5], ["high", 3], ["urgent", 1]]),
    status,
    userId: user.id,
    userName: user.name,
    assignee: status === "open" && r() > 0.5 ? null : agent,
    createdAt,
    updatedAt: createdAt + int(1, 48) * 3600000,
    linkedSessionId: category === "session" || category === "astrologer" ? pick(sessions).id : null,
    linkedPaymentId: category === "payment" ? pick(payments).id : null,
    messages: [
      { id: 1, from: "user", author: user.name, text: "Hi, I'm facing an issue. Please help me resolve this quickly.", at: createdAt },
      { id: 2, from: "agent", author: agent, text: "Sorry for the trouble! I'm checking your account details now.", at: createdAt + 1800000 },
      { id: 3, from: "note", author: agent, text: "Checked gateway logs — payment captured, webhook returned 500. Needs wallet credit.", at: createdAt + 2400000 },
      { id: 4, from: "user", author: user.name, text: "Okay, waiting for your update.", at: createdAt + 3600000 },
    ],
  };
}).sort((a, b) => b.createdAt - a.createdAt);

export const cannedReplies = [
  { id: "CR1", title: "Wallet credit delayed", category: "payment", body: "Hi {{name}}, your payment was successful and the amount has now been credited to your wallet. Sorry for the delay!", uses: 412 },
  { id: "CR2", title: "Refund initiated", category: "payment", body: "Hi {{name}}, we've initiated a refund of {{amount}}. It will reflect in 5–7 working days.", uses: 288 },
  { id: "CR3", title: "Session disconnected", category: "session", body: "Hi {{name}}, we noticed the session dropped. We've credited the unused minutes back to your wallet.", uses: 196 },
  { id: "CR4", title: "Off-platform warning", category: "astrologer", body: "Thanks for reporting. Sharing contact details is against our policy and we've taken action on the astrologer.", uses: 74 },
  { id: "CR5", title: "OTP troubleshooting", category: "account", body: "Please make sure DND is off and try again after 60 seconds. If the issue continues, reply with your device model.", uses: 133 },
  { id: "CR6", title: "Account deletion", category: "account", body: "We've received your request. Your data will be anonymised within 7 days as per our privacy policy.", uses: 51 },
];

/* ---------------- Marketing & content ---------------- */
export const banners = [
  { id: "B1", title: "Navratri special — 50% extra", placement: "Home · top", status: "live", startsAt: NOW - 3 * DAY, endsAt: NOW + 9 * DAY, clicks: 18240, impressions: 412000, target: "app://recharge", tone: "violet" },
  { id: "B2", title: "Talk to Tarot experts", placement: "Home · middle", status: "live", startsAt: NOW - 12 * DAY, endsAt: NOW + 20 * DAY, clicks: 6420, impressions: 210400, target: "app://astrologers?skill=tarot", tone: "amber" },
  { id: "B3", title: "Diwali mega offer", placement: "Home · top", status: "scheduled", startsAt: NOW + 18 * DAY, endsAt: NOW + 28 * DAY, clicks: 0, impressions: 0, target: "app://recharge", tone: "rose" },
  { id: "B4", title: "First chat free", placement: "Wallet", status: "paused", startsAt: NOW - 40 * DAY, endsAt: NOW + 60 * DAY, clicks: 31120, impressions: 902000, target: "app://free-chat", tone: "teal" },
  { id: "B5", title: "Monsoon Kundli match", placement: "Home · middle", status: "ended", startsAt: NOW - 90 * DAY, endsAt: NOW - 30 * DAY, clicks: 9870, impressions: 340000, target: "app://kundli", tone: "sky" },
];
export const coupons = [
  { id: "CP1", code: "FIRST50", type: "percent", value: 50, maxDiscount: 100, minRecharge: 100, usage: 8420, limit: 20000, perUser: 1, status: "active", expiresAt: NOW + 60 * DAY },
  { id: "CP2", code: "NAVRATRI25", type: "percent", value: 25, maxDiscount: 250, minRecharge: 200, usage: 2140, limit: 5000, perUser: 2, status: "active", expiresAt: NOW + 9 * DAY },
  { id: "CP3", code: "FLAT100", type: "flat", value: 100, maxDiscount: 100, minRecharge: 500, usage: 960, limit: 1000, perUser: 1, status: "active", expiresAt: NOW + 4 * DAY },
  { id: "CP4", code: "WELCOME", type: "flat", value: 30, maxDiscount: 30, minRecharge: 50, usage: 15200, limit: null, perUser: 1, status: "paused", expiresAt: NOW + 120 * DAY },
  { id: "CP5", code: "DIWALI20", type: "percent", value: 20, maxDiscount: 400, minRecharge: 300, usage: 0, limit: 10000, perUser: 1, status: "scheduled", expiresAt: NOW + 40 * DAY },
  { id: "CP6", code: "MONSOON", type: "percent", value: 15, maxDiscount: 150, minRecharge: 100, usage: 4210, limit: 5000, perUser: 3, status: "expired", expiresAt: NOW - 20 * DAY },
];
export const referralRules = {
  enabled: true,
  referrerReward: 50,
  refereeReward: 30,
  trigger: "first_recharge",
  minRecharge: 100,
  maxRewardsPerUser: 20,
  rewardExpiryDays: 30,
  stats: { signups: 3840, rewardsPaid: 182400, conversion: 41.2 },
};
export const pushCampaigns = [
  { id: "PN1", title: "Your daily horoscope is here ✨", audience: "All users", sent: 182000, opened: 23660, status: "sent", at: NOW - 6 * 3600000, deepLink: "app://horoscope" },
  { id: "PN2", title: "Navratri: 50% extra on recharge", audience: "Segment · Recharged in 30d", sent: 64000, opened: 11520, status: "sent", at: NOW - 2 * DAY, deepLink: "app://recharge" },
  { id: "PN3", title: "Your favourite astrologer is online", audience: "Segment · Followers", sent: 12400, opened: 3720, status: "sent", at: NOW - 3 * DAY, deepLink: "app://astrologer/A214" },
  { id: "PN4", title: "Diwali offers coming soon 🪔", audience: "All users", sent: 0, opened: 0, status: "scheduled", at: NOW + 17 * DAY, deepLink: "app://offers" },
  { id: "PN5", title: "Wallet low — recharge now", audience: "Segment · Balance < ₹50", sent: 0, opened: 0, status: "draft", at: null, deepLink: "app://recharge" },
];

const SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
export const horoscopes = SIGNS.map((sign, i) => ({
  id: `H${i + 1}`,
  sign,
  date: "2026-10-01",
  status: i < 9 ? "published" : i < 11 ? "draft" : "missing",
  text: i < 11 ? "A productive day for planning. Communication flows easily — use it to resolve pending matters at work and home." : "",
  luckyColor: pick(["Red", "Green", "Yellow", "White", "Blue", "Orange"]),
  luckyNumber: int(1, 9),
}));
export const blogs = [
  { id: "BL1", title: "Saturn transit 2026: what it means for you", author: "Yash Agarwal", status: "published", views: 48210, updatedAt: NOW - 2 * DAY, category: "Transits" },
  { id: "BL2", title: "A beginner's guide to reading your Kundli", author: "Yash Agarwal", status: "published", views: 92140, updatedAt: NOW - 18 * DAY, category: "Basics" },
  { id: "BL3", title: "Navratri rituals by zodiac sign", author: "Content team", status: "published", views: 21400, updatedAt: NOW - 1 * DAY, category: "Festivals" },
  { id: "BL4", title: "Vastu tips for a new home", author: "Content team", status: "draft", views: 0, updatedAt: NOW - 3600000, category: "Vastu" },
  { id: "BL5", title: "Tarot vs Vedic astrology", author: "Yash Agarwal", status: "review", views: 0, updatedAt: NOW - 5 * 3600000, category: "Basics" },
];
export const faqs = [
  { id: "FQ1", question: "How is the per-minute charge calculated?", answer: "You are billed per minute based on the astrologer's rate, deducted from your wallet in real time.", category: "Billing", published: true },
  { id: "FQ2", question: "Is my first chat free?", answer: "New users get a free chat of up to 5 minutes with selected astrologers.", category: "Billing", published: true },
  { id: "FQ3", question: "How do refunds work?", answer: "Eligible refunds are credited back to your wallet or original payment method within 5–7 days.", category: "Payments", published: true },
  { id: "FQ4", question: "Are my chats private?", answer: "Chats are encrypted and only accessed by our team for support or safety reviews, and every access is logged.", category: "Privacy", published: true },
  { id: "FQ5", question: "How do I become an astrologer on the platform?", answer: "Apply through the astrologer app with your KYC and certifications. Our team reviews in 48 hours.", category: "Astrologers", published: false },
];
export const policies = [
  { id: "PL1", title: "Terms of service", slug: "terms", updatedAt: NOW - 45 * DAY, version: "3.2" },
  { id: "PL2", title: "Privacy policy", slug: "privacy", updatedAt: NOW - 30 * DAY, version: "4.0" },
  { id: "PL3", title: "Refund policy", slug: "refunds", updatedAt: NOW - 60 * DAY, version: "2.1" },
  { id: "PL4", title: "Astrologer code of conduct", slug: "code-of-conduct", updatedAt: NOW - 90 * DAY, version: "1.4" },
];

export const settings = {
  defaultCommission: 35,
  freeChatEnabled: true,
  freeChatMinutes: 5,
  minBalanceMinutes: 2,
  minWalletBalance: 50,
  queueMaxLength: 8,
  queueOfferTimeoutSec: 45,
  refundAutoApproveLimit: 200,
  maintenanceMode: false,
  maintenanceMessage: "We'll be back shortly. Thank you for your patience.",
  androidMinVersion: "4.1.0",
  androidLatestVersion: "4.3.0",
  iosMinVersion: "4.1.0",
  iosLatestVersion: "4.3.0",
  features: {
    videoCalls: true,
    voiceCalls: true,
    kundliMatching: true,
    liveStreams: false,
    referrals: true,
    giftsInChat: false,
  },
};

/* ---------------- Daily stats (pre-computed by a background job) ---------------- */
export const dailyStats = Array.from({ length: 400 }, (_, i) => {
  const day = 399 - i;
  const date = new Date(NOW - day * DAY);
  const growth = 1 + (400 - day) / 600;
  const weekend = [0, 6].includes(date.getDay()) ? 1.18 : 1;
  const wave = 1 + Math.sin(i / 9) * 0.08;
  const k = growth * weekend * wave;
  const chats = Math.round(int(1500, 1800) * k);
  const voice = Math.round(int(420, 520) * k);
  const video = Math.round(int(210, 280) * k);
  const revenue = Math.round(int(380000, 440000) * k);
  const commission = Math.round(revenue * 0.35);
  const freeChats = Math.round(int(260, 340) * k);
  return {
    date: date.toISOString().slice(0, 10),
    ts: date.getTime(),
    signups: Math.round(int(700, 900) * k),
    activeUsers: Math.round(int(16000, 18500) * k),
    astroApplications: int(4, 18),
    astroApproved: int(2, 10),
    astroRejected: int(0, 5),
    activeAstrologers: Math.round(int(280, 330) * growth),
    astroOnlineHours: Math.round(int(1900, 2300) * growth),
    chats,
    chatMinutes: Math.round(chats * (r() * 3 + 9)),
    voiceCalls: voice,
    videoCalls: video,
    callMinutes: Math.round((voice + video) * (r() * 3 + 11)),
    callDrops: Math.round((voice + video) * (0.03 + r() * 0.03)),
    revenue,
    payoutShare: revenue - commission,
    commission,
    recharges: Math.round(int(2400, 2800) * k),
    rechargeAmount: Math.round(revenue * 1.08),
    firstRecharges: Math.round(int(170, 230) * k),
    failedPayments: Math.round(int(110, 190) * k),
    freeChats,
    freeConverted: Math.round(freeChats * (0.32 + r() * 0.1)),
    avgWaitSec: int(28, 75),
    queueAbandoned: Math.round(int(90, 160) * k),
    missedRequests: Math.round(int(60, 120) * k),
    ticketsOpened: int(80, 140),
    ticketsResolved: int(75, 140),
    avgResolutionHrs: +(4 + r() * 6).toFixed(1),
    refundAmount: int(6000, 18000),
    avgRating: +(4.2 + r() * 0.5).toFixed(2),
    complaints: int(8, 30),
    flaggedChats: int(10, 40),
    pushSent: int(80000, 200000),
    pushOpened: int(9000, 26000),
    referralSignups: int(20, 60),
    referralRewards: int(1500, 4800),
  };
});

export const hourlyLoad = Array.from({ length: 24 }, (_, h) => {
  const peak = Math.exp(-((h - 21) ** 2) / 10) + 0.6 * Math.exp(-((h - 13) ** 2) / 8) + 0.08;
  return { hour: h, chats: Math.round(peak * 220 + int(0, 20)), calls: Math.round(peak * 70 + int(0, 8)) };
});

export const usersByCity = CITIES.map(([city, state]) => ({ city, state, users: int(4000, 62000) })).sort((a, b) => b.users - a.users);
export const usersByLanguage = LANGUAGES.map((language) => ({ language, users: int(3000, 90000) })).sort((a, b) => b.users - a.users);
export const retention = ["Jun", "Jul", "Aug", "Sep"].map((m, ci) => ({
  cohort: `${m} 2026`,
  size: int(18000, 26000),
  weeks: [100, ...Array.from({ length: 6 - ci }, (_, w) => Math.round(62 / (1 + w * 0.42) - r() * 4))],
}));
