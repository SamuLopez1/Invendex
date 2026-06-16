import { clsx } from "clsx";

export function StatCard({
  label,
  value,
  subtitle,
  tone = "default"
}: {
  label: string;
  value: string;
  subtitle?: string;
  tone?: "default" | "good" | "warn";
}) {
  return (
    <div
      className={clsx(
        "rounded-2xl border p-4",
        tone === "good" && "border-blue-500/20 bg-blue-900/10",
        tone === "warn" && "border-red-500/20 bg-red-500/10",
        tone === "default" && "border-white/5 bg-[#141417]"
      )}
    >
      <p className="mb-1 text-xs uppercase tracking-widest text-zinc-500">
        {label}
      </p>
      <p
        className={clsx(
          "font-mono text-2xl font-bold italic",
          tone === "good" && "text-cyan-500",
          tone === "warn" && "text-red-400",
          tone === "default" && "text-zinc-100"
        )}
      >
        {value}
      </p>
      {subtitle ? <p className="mt-1 text-[10px] text-zinc-500">{subtitle}</p> : null}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-center text-sm text-zinc-500">
      {children}
    </div>
  );
}

export function Notice({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <div className="mb-4 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-200">
      {message}
    </div>
  );
}
