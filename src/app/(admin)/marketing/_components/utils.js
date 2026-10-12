/** Small helpers shared by the marketing screens (client-safe). */

/** Timestamp → "YYYY-MM-DD" for <input type="date">. */
export const toDateInput = (ts) => (ts ? new Date(ts).toISOString().slice(0, 10) : "");

/** "YYYY-MM-DD" → timestamp (start of day, IST). */
export const fromDateInput = (v) => (v ? new Date(`${v}T00:00:00+05:30`).getTime() : null);

/** Banner preview gradients, keyed by the banner's `tone`. Preview only, so fixed colours are fine. */
export const BANNER_TONES = {
  violet: "from-violet-600 via-purple-500 to-fuchsia-500",
  amber: "from-amber-500 via-orange-500 to-rose-500",
  rose: "from-rose-500 via-pink-500 to-orange-400",
  teal: "from-teal-500 via-emerald-500 to-cyan-500",
  sky: "from-sky-500 via-blue-500 to-indigo-500",
};

/** Screens in the astrologer app (AstroSide) a push can open. */
export const ASTRO_DEEP_LINKS = [
  { value: "app://notifications", label: "Notifications" },
  { value: "app://earnings", label: "Earnings" },
  { value: "app://live", label: "Go live" },
  { value: "app://reviews", label: "Reviews" },
  { value: "app://profile", label: "Profile" },
  { value: "app://support", label: "Help & support" },
];

export const DEEP_LINKS = [
  { value: "app://recharge", label: "Recharge screen" },
  { value: "app://free-chat", label: "Free chat" },
  { value: "app://astrologers", label: "Astrologer list" },
  { value: "app://astrologers?skill=tarot", label: "Astrologers · Tarot" },
  { value: "app://horoscope", label: "Daily horoscope" },
  { value: "app://kundli", label: "Kundli" },
  { value: "app://matching", label: "Kundli matching" },
  { value: "app://panchang", label: "Daily Panchang" },
  { value: "app://muhurat", label: "Shubh Muhurat finder" },
  { value: "app://tools", label: "Astrology tools" },
  { value: "app://offers", label: "Offers" },
];
