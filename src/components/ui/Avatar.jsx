import { cn, initials } from "@/lib/utils";

const HUES = [
  "bg-[#efeafd] text-[#4a32a8] dark:bg-[#2a2356] dark:text-[#c4b8fb]",
  "bg-[#fdebe2] text-[#a8461c] dark:bg-[#3d2216] dark:text-[#f5a27e]",
  "bg-[#e1f5ec] text-[#0e6b47] dark:bg-[#11372a] dark:text-[#6fd9ac]",
  "bg-[#fdf1d6] text-[#8a5a00] dark:bg-[#3a2f12] dark:text-[#f0c35c]",
  "bg-[#e3eefc] text-[#1d5aa8] dark:bg-[#172c4a] dark:text-[#8dbcf5]",
];

export function Avatar({ name = "", size = "md", className }) {
  const hue = HUES[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % HUES.length];
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-bold",
        { xs: "size-6 text-[10px]", sm: "size-8 text-xs", md: "size-9 text-xs", lg: "size-12 text-sm", xl: "size-16 text-lg" }[size],
        hue,
        className
      )}
    >
      {initials(name.replace(/^(Acharya|Pandit|Dr\.|Guru|Jyotishi)\s/, ""))}
    </span>
  );
}

/** Avatar + name + secondary line, the standard "person" cell. */
export function PersonCell({ name, sub, size = "sm" }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Avatar name={name} size={size} />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-text">{name}</p>
        {sub && <p className="truncate text-xs text-muted">{sub}</p>}
      </div>
    </div>
  );
}
