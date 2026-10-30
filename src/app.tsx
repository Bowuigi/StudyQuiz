import type { JSX } from 'preact';
import { useState } from 'preact/hooks';

import { HomeView } from './components/home-view.tsx';
import { QuizRunner, type QuizResult } from './components/quiz-runner.tsx';
import { StatsView } from './components/stats-view.tsx';
import { SummaryView } from './components/summary-view.tsx';
import { TopicView } from './components/topic-view.tsx';
import { type Subject, loadSubjects } from './content.ts';
import type { BuildQuizOptions } from './quiz.ts';
import { type QuizSession, useQuizSession } from './use-quiz-session.ts';

type View = 'home' | 'topics' | 'quiz' | 'summary' | 'stats';

export interface AppProps {
  subjects?: Array<Subject>;
  now?: () => number;
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

interface AppContentProps {
  subjects: Array<Subject>;
  view: View;
  subject: Subject | null;
  session: QuizSession;
  onHome: () => void;
  onOpenSubject: (subject: Subject) => void;
  onStart: (options: BuildQuizOptions) => void;
  onResult: (result: QuizResult) => void;
  onFinished: (results: Array<QuizResult>) => void;
  onOpenStats: () => void;
}

function AppContent(props: AppContentProps): JSX.Element {
  const { session, subject, subjects, view } = props;

  return (
    <div class="min-h-screen bg-base-200">
      <AppHeader />
      <main class="mx-auto flex max-w-4xl flex-col gap-6 p-6">
        {session.storageError === null ? null : (
          <div class="alert alert-error" role="alert">
            <span>{session.storageError}</span>
          </div>
        )}
        {view === 'home' ? (
          <HomeView
            subjects={subjects}
            onSelectSubject={props.onOpenSubject}
            onOpenStats={props.onOpenStats}
          />
        ) : null}
        {view === 'topics' && subject !== null ? (
          <TopicView subject={subject} onBack={props.onHome} onStart={props.onStart} />
        ) : null}
        {view === 'quiz' ? (
          <QuizRunner quiz={session.quiz} onResult={props.onResult} onFinished={props.onFinished} />
        ) : null}
        {view === 'summary' ? (
          <SummaryView
            results={session.results}
            elapsedSeconds={session.elapsedSeconds}
            onHome={props.onHome}
          />
        ) : null}
        {view === 'stats' ? <StatsView onBack={props.onHome} /> : null}
      </main>
    </div>
  );
}

export function App({ subjects: providedSubjects, now = Date.now }: AppProps = {}): JSX.Element {
  const [subjects] = useState(() => providedSubjects ?? loadSubjects());
  const session = useQuizSession(subjects, now);
  const [view, setView] = useState<View>('home');
  const [subject, setSubject] = useState<Subject | null>(null);

  function goHome(): void {
    session.reset();
    setSubject(null);
    setView('home');
  }

  function openSubject(selected: Subject): void {
    setSubject(selected);
    setView('topics');
  }

  function startQuiz(options: BuildQuizOptions): void {
    session.startQuiz(options);
    setView('quiz');
  }

  function recordResult(result: QuizResult): void {
    session.recordResult(result);
  }

  function finishQuiz(results: Array<QuizResult>): void {
    session.finishQuiz(results);
    setView('summary');
  }

  return (
    <AppContent
      subjects={subjects}
      view={view}
      subject={subject}
      session={session}
      onHome={goHome}
      onOpenSubject={openSubject}
      onStart={startQuiz}
      onResult={recordResult}
      onFinished={finishQuiz}
      onOpenStats={() => {
        setView('stats');
      }}
    />
  );
}
