import { clsx } from "clsx";

export function StatCard({
  label,
  value,
  tone = "default"
}: {
  label: string;
  value: string;
  tone?: "default" | "good" | "warn";
}) {
  return (
    <div
      className={clsx(
        "rounded-lg border p-4 shadow-soft",
        tone === "good" && "border-mint-100 bg-mint-100/70",
        tone === "warn" && "border-brand-100 bg-brand-50",
        tone === "default" && "border-line bg-white"
      )}
    >
      <p className="text-sm text-neutral-600">{label}</p>
      <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-white p-6 text-center text-sm text-neutral-500">
      {children}
    </div>
  );
}

export function Notice({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <div className="mb-4 rounded-md border border-mint-100 bg-mint-100/70 px-4 py-3 text-sm font-medium text-mint-700">
      {message}
    </div>
  );
}
