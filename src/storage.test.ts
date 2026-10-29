import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';

import { aggregate, getStats, recordResult, resetStats, type StatsRecord } from './storage.ts';

const result = {
  topicId: 'demo/tema',
  subject: 'demo',
  topic: 'tema',
  type: 'card' as const,
  correct: true,
};

const storedRecords: Array<StatsRecord> = [
  {
    topicId: 'demo/tema',
    subject: 'demo',
    topic: 'tema',
    type: 'card',
    correct: 2,
    attempts: 4,
  },
  {
    topicId: 'demo/tema',
    subject: 'demo',
    topic: 'tema',
    type: 'single-choice',
    correct: 1,
    attempts: 2,
  },
  {
    topicId: 'demo/otro',
    subject: 'demo',
    topic: 'otro',
    type: 'card',
    correct: 0,
    attempts: 2,
  },
];

beforeEach(async () => {
  await resetStats();
});

describe('recordResult for new records', () => {
  it('starts a new record at one attempt and zero correct', async () => {
    await recordResult({ ...result, correct: false });

    const records = await getStats();

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      topicId: 'demo/tema',
      subject: 'demo',
      topic: 'tema',
      type: 'card',
      correct: 0,
      attempts: 1,
    });
  });

  it('starts a new record at one attempt and one correct', async () => {
    await recordResult({ ...result, correct: true });

    const records = await getStats();

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ correct: 1, attempts: 1 });
  });
});

describe('recordResult for existing records', () => {
  it('increments the same record on a second result', async () => {
    await recordResult({ ...result, correct: true });
    await recordResult({ ...result, correct: false });

    const records = await getStats();

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ correct: 1, attempts: 2 });
  });

  it('keeps a separate record per topic and type', async () => {
    await recordResult({ ...result, correct: true });
    await recordResult({ ...result, type: 'single-choice', correct: false });
    await recordResult({ ...result, topicId: 'demo/otro', topic: 'otro', correct: true });

    const records = await getStats();

    expect(records).toHaveLength(3);
  });
});

describe('aggregate', () => {
  it('computes the correct percentage per topic and per type', () => {
    const summary = aggregate(storedRecords);

    expect(summary.topics).toEqual([
      {
        topicId: 'demo/otro',
        subject: 'demo',
        topic: 'otro',
        correct: 0,
        attempts: 2,
        percentage: 0,
      },
      {
        topicId: 'demo/tema',
        subject: 'demo',
        topic: 'tema',
        correct: 3,
        attempts: 6,
        percentage: 50,
      },
    ]);

    expect(summary.types).toHaveLength(2);
    expect(summary.types[0]).toMatchObject({ type: 'card', correct: 2, attempts: 6 });
    expect(summary.types[0]?.percentage).toBeCloseTo(100 / 3);
    expect(summary.types[1]).toEqual({
      type: 'single-choice',
      correct: 1,
      attempts: 2,
      percentage: 50,
    });
  });

  it('returns zero percent for a record with zero attempts', () => {
    const summary = aggregate([
      {
        topicId: 'demo/tema',
        subject: 'demo',
        topic: 'tema',
        type: 'card',
        correct: 0,
        attempts: 0,
      },
    ]);

    expect(summary.topics[0]?.percentage).toBe(0);
    expect(summary.types[0]?.percentage).toBe(0);
  });
});

describe('resetStats', () => {
  it('removes every record', async () => {
    await recordResult(result);
    await recordResult({ ...result, topicId: 'demo/otro', topic: 'otro' });

    await resetStats();

    expect(await getStats()).toEqual([]);
  });
});
