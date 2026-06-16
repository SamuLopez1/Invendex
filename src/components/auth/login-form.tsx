"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: String(formData.get("email")),
      password: String(formData.get("password"))
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="Correo"
            className="focus-ring block w-full rounded-xl border border-white/5 bg-black/40 py-3 pl-10 pr-4 text-xs text-white placeholder-zinc-600 transition-colors focus:border-blue-500"
          />
        </div>
      </div>
      <div>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="Contrasena"
            className="focus-ring block w-full rounded-xl border border-white/5 bg-black/40 py-3 pl-10 pr-4 text-xs text-white placeholder-zinc-600 transition-colors focus:border-blue-500"
          />
        </div>
      </div>
      {error ? (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="focus-ring mt-6 h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 text-xs font-black uppercase tracking-widest text-black shadow-lg shadow-blue-900/20 transition-transform active:scale-[0.98] disabled:opacity-60"
      >
        {loading ? "Autenticando..." : "Autenticar"}
      </button>
    </form>
  );
}
