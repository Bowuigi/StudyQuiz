import type { JSX } from 'preact';

import { ACTIVITY_TYPES } from '../activity-types.ts';
import type { QuizActivityType } from '../quiz.ts';
import { aggregate, type StatsRecord, type TopicStats } from '../storage.ts';
import { useStatsRecords } from '../use-stats-records.ts';

interface StatsViewProps {
  onBack: () => void;
}

interface TopicTypeSummary {
  type: QuizActivityType;
  correct: number;
  attempts: number;
  percentage: number;
}

interface SubjectGroup {
  subject: string;
  topics: Array<TopicStats>;
}

function formatPercentage(value: number): string {
  return `${Number(value.toFixed(1))}%`;
}

function formatAttempts(attempts: number): string {
  return attempts === 1 ? '1 intento' : `${attempts} intentos`;
}

function activityTypeLabel(type: QuizActivityType): string {
  return ACTIVITY_TYPES.find(option => option.type === type)?.label ?? type;
}

function groupTopics(topics: Array<TopicStats>): Array<SubjectGroup> {
  const groups = new Map<string, Array<TopicStats>>();

  for (const topic of topics) {
    const subjectTopics = groups.get(topic.subject) ?? [];
    subjectTopics.push(topic);
    groups.set(topic.subject, subjectTopics);
  }

  return [...groups.entries()].map(([subject, subjectTopics]) => ({
    subject,
    topics: subjectTopics,
  }));
}

function summarizeTopicTypes(
  records: Array<StatsRecord>,
  topicId: string,
): Array<TopicTypeSummary> {
  const totals = new Map<QuizActivityType, TopicTypeSummary>();

  for (const record of records) {
    if (record.topicId === topicId) {
      const current = totals.get(record.type) ?? {
        type: record.type,
        correct: 0,
        attempts: 0,
        percentage: 0,
      };
      current.correct += record.correct;
      current.attempts += record.attempts;
      totals.set(record.type, current);
    }
  }

  return [...totals.values()]
    .map(summary => ({
      ...summary,
      percentage: summary.attempts === 0 ? 0 : (summary.correct / summary.attempts) * 100,
    }))
    .toSorted((first, second) =>
      activityTypeLabel(first.type).localeCompare(activityTypeLabel(second.type), 'es'),
    );
}

interface TopicProgressProps {
  topic: TopicStats;
  typeSummaries: Array<TopicTypeSummary>;
}

function TopicProgress({ topic, typeSummaries }: TopicProgressProps): JSX.Element {
  return (
    <article class="card border border-base-300 bg-base-100">
      <div class="card-body gap-4">
        <h4 class="card-title text-lg capitalize">{topic.topic}</h4>
        <div class="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span class="font-semibold">{formatPercentage(topic.percentage)} de éxito</span>
          <span class="text-base-content/70">{formatAttempts(topic.attempts)}</span>
        </div>
        <progress
          class="progress w-full"
          value={topic.percentage}
          max={100}
          aria-label={`Progreso de ${topic.topicId}`}
        />

        <div class="flex flex-col gap-3 border-t border-base-300 pt-3">
          {typeSummaries.map(summary => {
            const label = activityTypeLabel(summary.type);
            return (
              <div key={summary.type} class="flex flex-col gap-2">
                <div class="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span class="font-medium">{label}</span>
                  <span class="text-base-content/70">
                    {formatPercentage(summary.percentage)} · {formatAttempts(summary.attempts)}
                  </span>
                </div>
                <progress
                  class="progress w-full"
                  value={summary.percentage}
                  max={100}
                  aria-label={`Progreso de ${label} en ${topic.topicId}`}
                />
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}

interface ResetDialogProps {
  open: boolean;
  resetting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function ResetDialog({ open, resetting, onCancel, onConfirm }: ResetDialogProps): JSX.Element {
  if (!open) return <></>;

  return (
    <dialog id="reset-stats-dialog" class="modal modal-open" open>
      <div class="modal-box">
        <h3 class="text-lg font-bold">Reiniciar estadísticas</h3>
        <p class="py-4">
          Se borrarán todos los resultados guardados. Esta acción no se puede deshacer.
        </p>
        <div class="modal-action">
          <button type="button" class="btn" disabled={resetting} onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" class="btn btn-error" disabled={resetting} onClick={onConfirm}>
            {resetting ? 'Reiniciando...' : 'Confirmar'}
          </button>
        </div>
      </div>
      <form
        method="dialog"
        class="modal-backdrop"
        onSubmit={event => {
          event.preventDefault();
          onCancel();
        }}>
        <button type="submit">Cerrar</button>
      </form>
    </dialog>
  );
}

interface StatsContentProps {
  records: Array<StatsRecord>;
  subjectGroups: Array<SubjectGroup>;
  loading: boolean;
  error: string | null;
}

function StatsContent({ records, subjectGroups, loading, error }: StatsContentProps): JSX.Element {
  if (error === null) {
    if (loading) {
      return <p class="text-base-content/70">Cargando estadísticas...</p>;
    }

    if (subjectGroups.length === 0) {
      return (
        <div class="alert" role="alert">
          <span>No hay estadísticas todavía.</span>
        </div>
      );
    }

    return (
      <div class="flex flex-col gap-6">
        {subjectGroups.map(group => (
          <section key={group.subject} class="flex flex-col gap-3">
            <h3 class="text-xl font-bold capitalize">{group.subject}</h3>
            {group.topics.map(topic => (
              <TopicProgress
                key={topic.topicId}
                topic={topic}
                typeSummaries={summarizeTopicTypes(records, topic.topicId)}
              />
            ))}
          </section>
        ))}
      </div>
    );
  }

  return (
    <div class="alert alert-error" role="alert">
      <span>{error}</span>
    </div>
  );
}

export function StatsView({ onBack }: StatsViewProps): JSX.Element {
  const state = useStatsRecords();
  const summary = aggregate(state.records);
  const subjectGroups = groupTopics(summary.topics);

  return (
    <div class="flex flex-col gap-6">
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body gap-4">
          <h2 class="card-title">Estadísticas</h2>
          <p class="text-base-content/70">Revisa tu progreso por tema y tipo de actividad.</p>
          <StatsContent
            records={state.records}
            subjectGroups={subjectGroups}
            loading={state.loading}
            error={state.error}
          />
          <div class="card-actions justify-end">
            <button type="button" class="btn" onClick={onBack}>
              Volver al inicio
            </button>
            <button type="button" class="btn btn-error" onClick={state.openReset}>
              Reiniciar estadísticas
            </button>
          </div>
        </div>
      </div>

      <ResetDialog
        open={state.confirmingReset}
        resetting={state.resetting}
        onCancel={state.cancelReset}
        onConfirm={state.confirmReset}
      />
    </div>
  );
}
