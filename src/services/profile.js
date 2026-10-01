/**
 * Mock data for the signed-in admin's own profile (security settings and
 * active sign-in sessions). Server-only, like the rest of `@/services`.
 */
import { NOW } from "@/lib/clock";
import { delay } from "./query";

const MIN = 60000;

export async function getMySecurity() {
  await delay();
  return {
    twoFactor: { enabled: true, method: "Authenticator app", enabledAt: NOW - 120 * 86400000, recoveryCodesLeft: 8 },
    passwordChangedAt: NOW - 41 * 86400000,
    sessions: [
      { id: "SES1", device: "Windows laptop", type: "desktop", browser: "Chrome 131", ip: "49.36.112.18", location: "Bengaluru, IN", lastActiveAt: NOW, current: true },
      { id: "SES2", device: "iPhone 15", type: "mobile", browser: "Safari 18", ip: "106.51.74.203", location: "Bengaluru, IN", lastActiveAt: NOW - 3 * 60 * MIN },
      { id: "SES3", device: "MacBook Air", type: "desktop", browser: "Safari 18", ip: "122.171.20.94", location: "Mysuru, IN", lastActiveAt: NOW - 2 * 1440 * MIN },
    ],
  };
}
