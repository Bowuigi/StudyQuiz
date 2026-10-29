import type { JSX } from 'preact';
import { useState } from 'preact/hooks';

import { ACTIVITY_TYPES } from '../activity-types.ts';
import type { Subject, Topic } from '../content.ts';
import type { BuildQuizOptions, QuizActivityType } from '../quiz.ts';

interface TopicViewProps {
  subject: Subject;
  onBack: () => void;
  onStart: (options: BuildQuizOptions) => void;
}

const DEFAULT_COUNT = 10;

function parseCount(value: string): number {
  const parsed = Math.trunc(Number(value));
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
}

function toggleValue<T>(values: Array<T>, value: T): Array<T> {
  return values.includes(value) ? values.filter(current => current !== value) : [...values, value];
}

interface TopicChecklistProps {
  topics: Array<Topic>;
  selected: Array<string>;
  onToggle: (topicId: string) => void;
}

function TopicChecklist({ topics, selected, onToggle }: TopicChecklistProps): JSX.Element {
  return (
    <fieldset class="fieldset">
      <legend class="fieldset-legend">Temas</legend>
      <div class="flex flex-col gap-2">
        {topics.map(topic => (
          <label key={topic.id} class="label cursor-pointer justify-start gap-3">
            <input
              type="checkbox"
              class="checkbox checkbox-sm"
              checked={selected.includes(topic.id)}
              onChange={() => {
                onToggle(topic.id);
              }}
            />
            <span>{topic.name}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

interface TypeChecklistProps {
  selected: Array<QuizActivityType>;
  onToggle: (type: QuizActivityType) => void;
}

function TypeChecklist({ selected, onToggle }: TypeChecklistProps): JSX.Element {
  return (
    <fieldset class="fieldset">
      <legend class="fieldset-legend">Tipos de actividad</legend>
      <div class="flex flex-col gap-2">
        {ACTIVITY_TYPES.map(option => (
          <label key={option.type} class="label cursor-pointer justify-start gap-3">
            <input
              type="checkbox"
              class="checkbox checkbox-sm"
              checked={selected.includes(option.type)}
              onChange={() => {
                onToggle(option.type);
              }}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

interface CountFieldProps {
  count: number;
  available: number;
  onChange: (value: string) => void;
}

function CountField({ count, available, onChange }: CountFieldProps): JSX.Element {
  return (
    <fieldset class="fieldset">
      <legend class="fieldset-legend">Número de actividades</legend>
      <input
        type="number"
        min={1}
        class="input w-32"
        aria-label="Número de actividades"
        value={count}
        onInput={event => {
          onChange(event.currentTarget.value);
        }}
      />
      <p class="label">Actividades disponibles: {available}</p>
      {count > available && available > 0 ? (
        <p class="text-sm text-warning">
          Solo hay {available} actividades disponibles; se usarán todas.
        </p>
      ) : null}
    </fieldset>
  );
}

interface StartActionsProps {
  canStart: boolean;
  onStart: () => void;
}

function StartActions({ canStart, onStart }: StartActionsProps): JSX.Element {
  return (
    <div class="card-actions justify-end">
      <button type="button" class="btn btn-primary" disabled={!canStart} onClick={onStart}>
        Comenzar
      </button>
    </div>
  );
}

interface TopicHeaderProps {
  name: string;
  onBack: () => void;
}

function TopicHeader({ name, onBack }: TopicHeaderProps): JSX.Element {
  return (
    <div class="flex flex-wrap items-center gap-3">
      <button type="button" class="btn btn-ghost btn-sm" onClick={onBack}>
        Volver
      </button>
      <h2 class="text-2xl font-bold capitalize">{name}</h2>
    </div>
  );
}

export function TopicView({ subject, onBack, onStart }: TopicViewProps): JSX.Element {
  const [topicIds, setTopicIds] = useState(() => subject.topics.map(topic => topic.id));
  const [types, setTypes] = useState(() => ACTIVITY_TYPES.map(option => option.type));
  const [count, setCount] = useState(DEFAULT_COUNT);

  const available = subject.topics
    .filter(topic => topicIds.includes(topic.id))
    .flatMap(topic => topic.activities)
    .filter(activity => types.includes(activity.is)).length;

  const canStart = topicIds.length > 0 && types.length > 0;

  return (
    <div class="flex flex-col gap-6">
      <TopicHeader name={subject.name} onBack={onBack} />

      <div class="card bg-base-100 shadow-sm">
        <div class="card-body gap-6">
          <TopicChecklist
            topics={subject.topics}
            selected={topicIds}
            onToggle={topicId => {
              setTopicIds(current => toggleValue(current, topicId));
            }}
          />
          <TypeChecklist
            selected={types}
            onToggle={type => {
              setTypes(current => toggleValue(current, type));
            }}
          />
          <CountField
            count={count}
            available={available}
            onChange={value => {
              setCount(parseCount(value));
            }}
          />
          <StartActions
            canStart={canStart}
            onStart={() => {
              onStart({ topicIds, types, count });
            }}
          />
        </div>
      </div>
    </div>
  );
}
