import type { QuizActivityType } from './quiz.ts';

export interface ResultInput {
  topicId: string;
  subject: string;
  topic: string;
  type: QuizActivityType;
  correct: boolean;
}

export interface StatsRecord {
  topicId: string;
  subject: string;
  topic: string;
  type: QuizActivityType;
  correct: number;
  attempts: number;
}

export interface TopicStats {
  topicId: string;
  subject: string;
  topic: string;
  correct: number;
  attempts: number;
  percentage: number;
}

export interface TypeStats {
  type: QuizActivityType;
  correct: number;
  attempts: number;
  percentage: number;
}

export interface Aggregate {
  topics: Array<TopicStats>;
  types: Array<TypeStats>;
}

const DATABASE_NAME = 'study-quiz';
const DATABASE_VERSION = 1;
const STORE_NAME = 'stats';

let databasePromise: Promise<IDBDatabase> | null = null;

async function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise !== null) {
    return databasePromise;
  }

  const connection = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.addEventListener('upgradeneeded', () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: ['topicId', 'type'] });
      }
    });

    request.addEventListener('success', () => {
      resolve(request.result);
    });
    request.addEventListener('error', () => {
      reject(request.error ?? new Error('No se pudo abrir IndexedDB.'));
    });
  });

  databasePromise = connection;
  const database = await connection;
  return database;
}

async function transactionDone(transaction: IDBTransaction): Promise<void> {
  const completion = new Promise<void>((resolve, reject) => {
    transaction.addEventListener('complete', () => {
      resolve();
    });
    transaction.addEventListener('error', () => {
      reject(transaction.error ?? new Error('Falló la transacción.'));
    });
    transaction.addEventListener('abort', () => {
      reject(transaction.error ?? new Error('Se abortó la transacción.'));
    });
  });

  await completion;
}

async function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  const completion = new Promise<T>((resolve, reject) => {
    request.addEventListener('success', () => {
      resolve(request.result);
    });
    request.addEventListener('error', () => {
      reject(request.error ?? new Error('Falló la solicitud a IndexedDB.'));
    });
  });

  const result = await completion;
  return result;
}

export async function recordResult(result: ResultInput): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, 'readwrite');
  const done = transactionDone(transaction);
  const store = transaction.objectStore(STORE_NAME);
  const key: [string, QuizActivityType] = [result.topicId, result.type];
  const request = store.get(key);

  request.addEventListener('success', () => {
    const existing = request.result as StatsRecord | undefined;
    const record: StatsRecord = existing
      ? {
          ...existing,
          correct: existing.correct + (result.correct ? 1 : 0),
          attempts: existing.attempts + 1,
        }
      : {
          topicId: result.topicId,
          subject: result.subject,
          topic: result.topic,
          type: result.type,
          correct: result.correct ? 1 : 0,
          attempts: 1,
        };

    store.put(record);
  });

  await done;
}

export async function getStats(): Promise<Array<StatsRecord>> {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, 'readonly');
  const done = transactionDone(transaction);
  const records = await requestToPromise(transaction.objectStore(STORE_NAME).getAll());
  await done;

  return records as Array<StatsRecord>;
}

export async function resetStats(): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, 'readwrite');
  const done = transactionDone(transaction);
  transaction.objectStore(STORE_NAME).clear();
  await done;
}

function percentage(correct: number, attempts: number): number {
  return attempts === 0 ? 0 : (correct / attempts) * 100;
}

export function aggregate(records: Array<StatsRecord>): Aggregate {
  const topicTotals = new Map<string, TopicStats>();
  const typeTotals = new Map<QuizActivityType, TypeStats>();

  for (const record of records) {
    const topic = topicTotals.get(record.topicId) ?? {
      topicId: record.topicId,
      subject: record.subject,
      topic: record.topic,
      correct: 0,
      attempts: 0,
      percentage: 0,
    };
    topic.correct += record.correct;
    topic.attempts += record.attempts;
    topicTotals.set(record.topicId, topic);

    const type = typeTotals.get(record.type) ?? {
      type: record.type,
      correct: 0,
      attempts: 0,
      percentage: 0,
    };
    type.correct += record.correct;
    type.attempts += record.attempts;
    typeTotals.set(record.type, type);
  }

  const topics = [...topicTotals.values()]
    .map(topic => ({
      ...topic,
      percentage: percentage(topic.correct, topic.attempts),
    }))
    .toSorted(
      (a, b) => a.subject.localeCompare(b.subject, 'es') || a.topic.localeCompare(b.topic, 'es'),
    );

  const types = [...typeTotals.values()]
    .map(type => ({ ...type, percentage: percentage(type.correct, type.attempts) }))
    .toSorted((a, b) => a.type.localeCompare(b.type, 'es'));

  return { topics, types };
}
