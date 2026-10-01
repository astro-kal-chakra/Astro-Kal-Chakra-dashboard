/**
 * Demo logins, one per role. UI-only stand-in for the real auth API —
 * delete this file when login is connected to the backend.
 * 2FA: any 6-digit code is accepted in the demo.
 */
export const DEMO_PASSWORD = "Admin@123";

export const DEMO_ACCOUNTS = [
  { email: "superadmin@astroadmin.in", name: "Vandana Rao", role: "super_admin" },
  { email: "ops@astroadmin.in", name: "Neha Kapoor", role: "ops_admin" },
  { email: "support@astroadmin.in", name: "Riya Das", role: "support_agent" },
  { email: "finance@astroadmin.in", name: "Manish Gupta", role: "finance" },
  { email: "moderator@astroadmin.in", name: "Siddharth Bose", role: "moderator" },
  { email: "marketing@astroadmin.in", name: "Yash Agarwal", role: "marketing" },
];

export const findDemoAccount = (email, password) =>
  password === DEMO_PASSWORD ? DEMO_ACCOUNTS.find((a) => a.email === email.toLowerCase()) : undefined;
