import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12" id="main-content" tabIndex={-1}>
      <section className="w-full max-w-md rounded-apple border border-black/10 bg-white p-6 sm:p-8 dark:border-white/15 dark:bg-white/5">
        <h1 className="font-display text-4xl font-semibold">Entrar</h1>
        <div className="mt-8">
          <LoginForm error={params.error} message={params.message} />
        </div>
      </section>
    </main>
  );
}
