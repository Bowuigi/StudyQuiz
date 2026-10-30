import type { JSX } from 'preact';

import { activityTitle, summaryExplanationLines, userAnswerLines } from '../answer-description.ts';
import { correctAnswerLines } from '../quiz.ts';
import type { QuizResult } from './quiz-result.ts';

interface SummaryViewProps {
  results: Array<QuizResult>;
  elapsedSeconds: number;
  onHome: () => void;
}

function formatPercentage(value: number): string {
  return `${Number(value.toFixed(1))}%`;
}

function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.trunc(seconds));
  const minutes = Math.floor(total / 60);
  const remainingSeconds = total % 60;
  return `${minutes} min ${remainingSeconds} s`;
}

interface SummaryStatsProps {
  correct: number;
  wrong: number;
  percentage: number;
  elapsedSeconds: number;
}

function SummaryStats({
  correct,
  wrong,
  percentage,
  elapsedSeconds,
}: SummaryStatsProps): JSX.Element {
  return (
    <div class="stats stats-vertical w-full sm:stats-horizontal">
      <div class="stat">
        <div class="stat-title">Respuestas correctas</div>
        <div class="stat-value text-success" data-testid="summary-correct-count">
          {correct}
        </div>
        <div class="stat-desc">Respuestas acertadas</div>
      </div>
      <div class="stat">
        <div class="stat-title">Respuestas incorrectas</div>
        <div class="stat-value text-error" data-testid="summary-wrong-count">
          {wrong}
        </div>
        <div class="stat-desc">Respuestas falladas</div>
      </div>
      <div class="stat">
        <div class="stat-title">Éxito total</div>
        <div class="stat-value">{formatPercentage(percentage)}</div>
        <div class="stat-desc">Porcentaje de aciertos</div>
      </div>
      <div class="stat">
        <div class="stat-title">Tiempo transcurrido</div>
        <div class="stat-value">{formatDuration(elapsedSeconds)}</div>
        <div class="stat-desc">Minutos y segundos</div>
      </div>
    </div>
  );
}

interface AnswerBlockProps {
  title: string;
  lines: Array<string>;
}

function AnswerBlock({ title, lines }: AnswerBlockProps): JSX.Element {
  return (
    <div>
      <p class="font-semibold">{title}</p>
      {lines.length > 0 ? (
        lines.map((line, index) => (
          <p key={`${line}-${index}`} class="text-base-content/80">
            {line}
          </p>
        ))
      ) : (
        <p class="text-base-content/60">No disponible.</p>
      )}
    </div>
  );
}

interface WrongActivityCardProps {
  result: QuizResult;
}

function WrongActivityCard({ result }: WrongActivityCardProps): JSX.Element {
  const title = activityTitle(result.item.activity);
  const userAnswer = userAnswerLines(result.item, result.answer);
  const correctAnswer = correctAnswerLines(result.item);
  const explanations = summaryExplanationLines(result.item);

  return (
    <article class="card border border-base-300 bg-base-100" data-testid="wrong-activity">
      <div class="card-body gap-4">
        <h3 class="card-title text-lg">{title}</h3>
        <AnswerBlock title="Tu respuesta" lines={userAnswer} />
        <AnswerBlock title="Respuesta correcta" lines={correctAnswer} />
        <AnswerBlock title="Explicaciones" lines={explanations} />
      </div>
    </article>
  );
}

export function SummaryView({ results, elapsedSeconds, onHome }: SummaryViewProps): JSX.Element {
  const correct = results.filter(result => result.correct).length;
  const wrong = results.length - correct;
  const percentage = results.length === 0 ? 0 : (correct / results.length) * 100;
  const wrongResults = results.filter(result => !result.correct);

  return (
    <div class="flex flex-col gap-6">
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body gap-6">
          <h2 class="card-title">Resumen del cuestionario</h2>
          <SummaryStats
            correct={correct}
            wrong={wrong}
            percentage={percentage}
            elapsedSeconds={elapsedSeconds}
          />
        </div>
      </div>

      <section class="flex flex-col gap-4">
        <h3 class="text-xl font-bold">Actividades incorrectas</h3>
        {wrongResults.length === 0 ? (
          <div class="alert alert-success" role="alert">
            <span>Has acertado todas las actividades.</span>
          </div>
        ) : (
          wrongResults.map((result, index) => (
            <WrongActivityCard key={`${result.item.topicId}-${index}`} result={result} />
          ))
        )}
      </section>

      <div class="card-actions justify-end">
        <button type="button" class="btn btn-primary" onClick={onHome}>
          Volver al inicio
        </button>
      </div>
    </div>
  );
}
