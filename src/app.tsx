import type { JSX } from 'preact';

export function App(): JSX.Element {
  return (
    <div class="min-h-screen bg-base-200">
      <header class="navbar bg-base-100 shadow-sm">
        <div class="pl-5 navbar-start">
          <span class="text-xl font-bold tracking-tight">StudyQuiz</span>
        </div>
      </header>

      <main class="mx-auto flex max-w-4xl flex-col gap-6 p-6">
        <section class="hero rounded-box bg-base-100 shadow-sm">
          <div class="hero-content py-16 text-center">
            <div class="max-w-md">
              <h1 class="text-4xl font-bold">StudyQuiz</h1>
              <p class="py-4 text-base-content/70">
                Practica con cuestionarios y revisa tu progreso.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
