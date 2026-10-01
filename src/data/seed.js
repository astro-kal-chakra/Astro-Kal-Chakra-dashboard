import { NOW } from "@/lib/clock";

/** Deterministic PRNG so mock data is identical on every render/build. */
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRng(seed) {
  const r = mulberry32(seed);
  const int = (min, max) => Math.floor(r() * (max - min + 1)) + min;
  const pick = (arr) => arr[Math.floor(r() * arr.length)];
  const weighted = (pairs) => {
    const total = pairs.reduce((s, [, w]) => s + w, 0);
    let x = r() * total;
    for (const [v, w] of pairs) if ((x -= w) <= 0) return v;
    return pairs[0][0];
  };
  const some = (arr, min = 1, max = 3) => {
    const n = int(min, Math.min(max, arr.length));
    return [...arr].sort(() => r() - 0.5).slice(0, n);
  };
  const daysAgo = (maxDays, minDays = 0) => NOW - int(minDays * 1440, maxDays * 1440) * 60000;
  const phone = () => `91${int(6, 9)}${String(int(0, 999999999)).padStart(9, "0")}`;
  return { r, int, pick, weighted, some, daysAgo, phone };
}

export const FIRST_NAMES = ["Aarav", "Vivaan", "Aditya", "Ananya", "Diya", "Isha", "Kabir", "Meera", "Rohan", "Saanvi", "Arjun", "Priya", "Neha", "Rahul", "Kavya", "Ishaan", "Tanvi", "Siddharth", "Pooja", "Nikhil", "Riya", "Varun", "Sneha", "Karan", "Aditi", "Manish", "Shreya", "Yash", "Lakshmi", "Harsh", "Divya", "Gaurav"];
export const LAST_NAMES = ["Sharma", "Verma", "Iyer", "Reddy", "Patel", "Gupta", "Nair", "Joshi", "Mehta", "Rao", "Singh", "Kapoor", "Bose", "Das", "Kulkarni", "Menon", "Chopra", "Agarwal", "Pillai", "Mishra"];
export const ASTRO_TITLES = ["Acharya", "Pandit", "Dr.", "Guru", "Jyotishi", ""];
export const CITIES = [
  ["Mumbai", "Maharashtra"], ["Delhi", "Delhi"], ["Bengaluru", "Karnataka"], ["Hyderabad", "Telangana"],
  ["Chennai", "Tamil Nadu"], ["Kolkata", "West Bengal"], ["Pune", "Maharashtra"], ["Jaipur", "Rajasthan"],
  ["Lucknow", "Uttar Pradesh"], ["Ahmedabad", "Gujarat"], ["Indore", "Madhya Pradesh"], ["Patna", "Bihar"],
];
export const LANGUAGES = ["Hindi", "English", "Tamil", "Telugu", "Marathi", "Bengali", "Gujarati", "Kannada"];
export const SKILLS = ["Vedic", "Tarot", "Numerology", "KP System", "Vastu", "Palmistry", "Nadi", "Face reading", "Lal Kitab", "Prashna"];

export const fullName = (rng) => `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`;
