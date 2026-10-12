import { Sparkles } from "lucide-react";

/** Split-screen frame shared by the sign-in and invite pages. */
export function AuthShell({ children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden bg-[#15112e] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Stars />
        <div className="relative flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#8b74ef] to-[#e0a100]">
            <Sparkles className="size-5" />
          </span>
          <span className="text-lg font-extrabold">
            Astro<span className="text-[#f0b429]">Admin</span>
          </span>
        </div>
        <div className="relative max-w-md">
          <h1 className="text-4xl leading-tight font-extrabold tracking-tight">Run the platform. Protect every conversation.</h1>
          <p className="mt-4 text-[15px] leading-relaxed text-[#c9c4e6]">
            Approvals, sessions, payments and support in one place. Every sensitive action needs a reason and is written to the audit log.
          </p>
        </div>
        <p className="relative text-xs text-[#8a84ad]">Restricted system · Authorised staff only · Activity is monitored</p>
      </div>

      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#8b74ef] to-[#e0a100] text-white">
              <Sparkles className="size-5" />
            </span>
            <span className="text-lg font-extrabold text-text">
              Astro<span className="text-accent">Admin</span>
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function Stars() {
  // Fixed positions so server and client markup match.
  const stars = [
    [8, 12, 2], [22, 30, 1], [35, 8, 1.5], [48, 22, 1], [62, 14, 2], [78, 6, 1], [90, 26, 1.5], [14, 52, 1], [30, 66, 2],
    [52, 48, 1], [70, 58, 1.5], [86, 44, 1], [6, 82, 1.5], [40, 88, 1], [64, 80, 2], [92, 90, 1],
  ];
  return (
    <svg className="absolute inset-0 size-full" aria-hidden>
      <defs>
        <radialGradient id="glow" cx="80%" cy="20%" r="70%">
          <stop offset="0" stopColor="#6d4fd8" stopOpacity="0.45" />
          <stop offset="1" stopColor="#15112e" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#glow)" />
      {stars.map(([x, y, r], i) => (
        <circle key={i} cx={`${x}%`} cy={`${y}%`} r={r} fill="#fff" opacity={0.25 + (i % 4) * 0.15} />
      ))}
    </svg>
  );
}
