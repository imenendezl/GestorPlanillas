import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <section className="w-full max-w-md rounded-apple border border-black/10 bg-white p-8 dark:border-white/15 dark:bg-white/5">
        <h1 className="font-display text-4xl font-semibold tracking-[-0.01em]">Entrar</h1>
        <p className="mt-2 text-[15px] text-black/60 dark:text-white/60">Accede a tus planillas y cambios de turno.</p>
        <div className="mt-8">
          <LoginForm error={params.error} />
        </div>
      </section>
    </main>
  );
}
