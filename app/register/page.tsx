import { RegisterForm } from "@/components/auth/register-form";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <section className="w-full max-w-2xl rounded-apple border border-black/10 bg-white p-8 dark:border-white/15 dark:bg-white/5">
        <h1 className="font-display text-4xl font-semibold tracking-[-0.01em]">Crear cuenta</h1>
        <p className="mt-2 text-[15px] text-black/60 dark:text-white/60">El rol inicial será empleado. Supervisión se concede después por personal autorizado.</p>
        <div className="mt-8">
          <RegisterForm error={params.error} />
        </div>
      </section>
    </main>
  );
}
