import { redirect } from "next/navigation";
import { Wine } from "lucide-react";
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
    <main className="grid min-h-screen place-items-center bg-paper px-4 py-8">
      <section className="w-full max-w-md rounded-lg border border-line bg-white p-6 shadow-soft">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-md bg-brand-600 text-white">
            <Wine size={22} />
          </div>
          <div>
            <p className="text-sm uppercase tracking-wide text-brand-600">
              Noches de Luna
            </p>
            <h1 className="text-2xl font-bold text-ink">Ingreso privado</h1>
          </div>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
