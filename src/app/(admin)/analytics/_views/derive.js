import { percentChange } from "@/lib/utils";

const ratio = (a, b, mul = 1) => (b ? +((a / b) * mul).toFixed(2) : 0);

/** Ratio metrics computed per bucket (and for the previous period when comparing). */
const DERIVED = {
  avgChatMin: (r) => ratio(r.chatMinutes, r.chats),
  calls: (r) => r.voiceCalls + r.videoCalls,
  avgCallMin: (r) => ratio(r.callMinutes, r.voiceCalls + r.videoCalls),
  dropRate: (r) => ratio(r.callDrops, r.voiceCalls + r.videoCalls, 100),
  avgRecharge: (r) => ratio(r.rechargeAmount, r.recharges),
  firstRechargeRate: (r) => ratio(r.firstRecharges, r.signups, 100),
  freeConversion: (r) => ratio(r.freeConverted, r.freeChats, 100),
  freeDropped: (r) => r.freeChats - r.freeConverted,
  pushOpenRate: (r) => ratio(r.pushOpened, r.pushSent, 100),
  sessions: (r) => r.chats + r.voiceCalls + r.videoCalls,
};

function withDerived(row, prefix = "") {
  const src = prefix ? Object.fromEntries(Object.entries(row).filter(([k]) => k.startsWith(prefix)).map(([k, v]) => [k.slice(prefix.length), v])) : row;
  if (prefix && !Object.keys(src).length) return {};
  return Object.fromEntries(Object.entries(DERIVED).map(([k, fn]) => [`${prefix}${k}`, fn(src)]));
}

export function derive(a) {
  const totals = { ...a.totals, ...withDerived(a.totals) };
  const previous = { ...a.previous, ...withDerived(a.previous) };
  const change = { ...a.change };
  for (const k of Object.keys(DERIVED)) change[k] = percentChange(totals[k], previous[k]);

  const series = a.series.map((r) => ({ ...r, ...withDerived(r), ...(a.range.compare ? withDerived(r, "prev_") : {}) }));
  return { ...a, totals, previous, change, series };
}
