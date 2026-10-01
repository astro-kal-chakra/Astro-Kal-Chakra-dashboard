export default function Loading() {
  return (
    <div className="animate-pulse space-y-5" aria-busy="true" aria-label="Loading">
      <div className="space-y-2">
        <div className="h-7 w-56 rounded-lg bg-surface-3" />
        <div className="h-4 w-80 max-w-full rounded bg-surface-3" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-28 rounded-2xl border border-border bg-surface" />
        ))}
      </div>
      <div className="h-96 rounded-2xl border border-border bg-surface" />
    </div>
  );
}
