import type { JSX } from 'preact';
import { useState } from 'preact/hooks';

import { HomeView } from './components/home-view.tsx';
import { QuizRunner, type QuizResult } from './components/quiz-runner.tsx';
import { StatsView } from './components/stats-view.tsx';
import { TopicView } from './components/topic-view.tsx';
import { type Subject, loadSubjects } from './content.ts';
import { type BuildQuizOptions, buildQuiz, type QuizItem } from './quiz.ts';

type View = 'home' | 'topics' | 'quiz' | 'summary' | 'stats';

export interface AppProps {
  subjects?: Array<Subject>;
}

function AppHeader(): JSX.Element {
  return (
    <header class="navbar bg-base-100 shadow-sm">
      <div class="navbar-start pl-5">
        <h1 class="text-xl font-bold tracking-tight">StudyQuiz</h1>
      </div>
    </header>
  );
}

export function App({ subjects: providedSubjects }: AppProps = {}): JSX.Element {
  const [subjects] = useState(() => providedSubjects ?? loadSubjects());
  const [view, setView] = useState<View>('home');
  const [subject, setSubject] = useState<Subject | null>(null);
  const [quiz, setQuiz] = useState<Array<QuizItem>>([]);
  const [, setResults] = useState<Array<QuizResult>>([]);
  function goHome(): void {
    setSubject(null);
    setQuiz([]);
    setResults([]);
    setView('home');
  }
  function openSubject(selected: Subject): void {
    setSubject(selected);
    setView('topics');
  }
  function startQuiz(options: BuildQuizOptions): void {
    setQuiz(buildQuiz(subjects, options));
    setView('quiz');
  }

  function recordResult(result: QuizResult): void {
    setResults(current => [...current, result]);
  }

  return (
    <div class="min-h-screen bg-base-200">
      <AppHeader />

      <main class="mx-auto flex max-w-4xl flex-col gap-6 p-6">
        {view === 'home' ? (
          <HomeView
            subjects={subjects}
            onSelectSubject={openSubject}
            onOpenStats={() => {
              setView('stats');
            }}
          />
        ) : null}
        {view === 'topics' && subject !== null ? (
          <TopicView subject={subject} onBack={goHome} onStart={startQuiz} />
        ) : null}
        {view === 'quiz' ? (
          <QuizRunner quiz={quiz} onResult={recordResult} onFinished={goHome} />
        ) : null}
        {view === 'stats' ? <StatsView onBack={goHome} /> : null}
      </main>
    </div>
  );
}
