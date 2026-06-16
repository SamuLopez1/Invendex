import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#09090b] px-4 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(6,182,212,0.16),transparent_34%),radial-gradient(circle_at_85%_85%,rgba(37,99,235,0.12),transparent_32%)]" />
      <section className="relative z-10 w-full max-w-sm rounded-2xl border border-white/5 bg-[#141417] p-8 shadow-2xl">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-2xl font-black text-black shadow-xl shadow-blue-900/20">
            I
          </div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-zinc-100">
            Invendex
          </h1>
          <p className="mt-1 text-center text-[10px] uppercase tracking-widest text-zinc-500">
            Autorizacion del sistema
          </p>
        </div>
        <LoginForm />
      </section>
      <p className="relative z-10 mt-8 font-mono text-[10px] uppercase tracking-widest text-zinc-600">
        Conexion segura
      </p>
    </main>
  );
}
