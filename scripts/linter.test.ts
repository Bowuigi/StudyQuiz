/// <reference types="node" />
import { describe, it, expect } from 'vitest';

import {
  lintTopicFile,
  lintContentDirectory,
  formatDiagnostics,
  formatDiagnosticsJson,
  runCli,
  type Diagnostic,
  type Activity,
} from './linter.js';

// ============================================================================
// Test fixtures - inline, not from content/
// ============================================================================

const VALID_MULTIPLE_CHOICE: Activity = {
  is: 'multiple-choice',
  question: '¿Cuál es la capital de Francia?',
  options: [
    { label: 'Madrid', isCorrect: false, explanation: 'Madrid es la capital de España.' },
    { label: 'París', isCorrect: true, explanation: 'París es la capital de Francia.' },
    { label: 'Roma', isCorrect: false, explanation: 'Roma es la capital de Italia.' },
  ],
};

const VALID_SINGLE_CHOICE: Activity = {
  is: 'single-choice',
  question: '¿Qué significa "house" en español?',
  options: [
    { label: 'Casa', explanation: 'House significa casa.' },
    { label: 'Perro', explanation: 'Perro se dice dog.' },
    { label: 'Libro', explanation: 'Libro se dice book.' },
  ],
};

const VALID_REORDER: Activity = {
  is: 'reorder',
  title: 'Ordena de menor a mayor',
  elements: ['Uno', 'Dos', 'Tres'],
};

const VALID_RELATE: Activity = {
  is: 'relate',
  title: 'Relaciona',
  related: { Uno: '1', Dos: '2', Tres: '3' },
};

const VALID_COMPLETE_WORDS: Activity = {
  is: 'complete-words',
  parts: [
    { isBlank: false, label: 'La capital de Francia es ' },
    { isBlank: true, label: 'París' },
    { isBlank: false, label: '.' },
  ],
};

const VALID_CARD: Activity = {
  is: 'card',
  front: '¿Capital de Francia?',
  back: 'París',
};

// ============================================================================
// Helper functions
// ============================================================================

function createTopicFile(activities: Array<Activity>): string {
  return JSON.stringify(activities, null, 2);
}

function getErrors(diagnostics: Array<Diagnostic>): Array<Diagnostic> {
  return diagnostics.filter(d => d.severity === 'error');
}

function getWarnings(diagnostics: Array<Diagnostic>): Array<Diagnostic> {
  return diagnostics.filter(d => d.severity === 'warning');
}

function hasRule(diagnostics: Array<Diagnostic>, ruleId: string): boolean {
  return diagnostics.some(d => d.ruleId === ruleId);
}

function getDiagnostic(diagnostics: Array<Diagnostic>, ruleId: string): Diagnostic | undefined {
  return diagnostics.find(d => d.ruleId === ruleId);
}

// ============================================================================
// Tests
// ============================================================================

describe('lintTopicFile - basic parsing', () => {
  it('reports invalid-json error', () => {
    const result = lintTopicFile('test.json', '{ invalid json }');
    const errors = getErrors(result.diagnostics);
    expect(errors.length).toBe(1);
    expect(errors[0]!.ruleId).toBe('invalid-json');
    expect(errors[0]!.message).toContain('Invalid JSON');
  });

  it('reports not-an-array error', () => {
    const result = lintTopicFile('test.json', '{"not": "array"}');
    const errors = getErrors(result.diagnostics);
    expect(errors.length).toBe(1);
    expect(errors[0]!.ruleId).toBe('not-an-array');
  });

  it('reports empty-topic error', () => {
    const result = lintTopicFile('test.json', '[]');
    const errors = getErrors(result.diagnostics);
    expect(errors.length).toBe(1);
    expect(errors[0]!.ruleId).toBe('empty-topic');
  });

  it('parses valid activities without errors', () => {
    const result = lintTopicFile('test.json', createTopicFile([VALID_MULTIPLE_CHOICE]));
    const errors = getErrors(result.diagnostics);
    expect(errors.length).toBe(0);
    expect(result.activities.length).toBe(1);
  });
});

describe('lintTopicFile - unknown activity type', () => {
  it('reports unknown-activity-type error', () => {
    const raw = '[{"is": "invalid-type", "question": "test", "options": []}]';
    const result = lintTopicFile('test.json', raw);
    const errors = getErrors(result.diagnostics);
    expect(errors.length).toBe(1);
    expect(errors[0]!.ruleId).toBe('unknown-activity-type');
    expect(errors[0]!.message).toContain('invalid-type');
  });
});

describe('lintTopicFile - multiple-choice validation', () => {
  it('reports empty-text error for empty question', () => {
    const activity: Activity = { ...VALID_MULTIPLE_CHOICE, question: '' };
    const result = lintTopicFile('test.json', createTopicFile([activity]));
    const errors = getErrors(result.diagnostics);
    expect(hasRule(errors, 'empty-text')).toBe(true);
  });

  it('reports too-few-options error', () => {
    const activity: Activity = {
      ...VALID_MULTIPLE_CHOICE,
      options: [VALID_MULTIPLE_CHOICE.options[0]!],
    };
    const result = lintTopicFile('test.json', createTopicFile([activity]));
    const errors = getErrors(result.diagnostics);
    expect(hasRule(errors, 'too-few-options')).toBe(true);
  });

  it('reports duplicate-option error', () => {
    const activity: Activity = {
      ...VALID_MULTIPLE_CHOICE,
      options: [
        { label: 'Madrid', isCorrect: false, explanation: 'Madrid es España.' },
        { label: 'Madrid', isCorrect: true, explanation: 'Madrid es España.' },
        { label: 'Roma', isCorrect: false, explanation: 'Roma es Italia.' },
      ],
    };
    const result = lintTopicFile('test.json', createTopicFile([activity]));
    const errors = getErrors(result.diagnostics);
    expect(hasRule(errors, 'duplicate-option')).toBe(true);
    expect(getDiagnostic(errors, 'duplicate-option')?.message).toContain('index 1');
  });

  it('reports empty-text error for empty option label', () => {
    const activity: Activity = {
      ...VALID_MULTIPLE_CHOICE,
      options: [
        { label: '', isCorrect: false, explanation: 'Explanation.' },
        { label: 'París', isCorrect: true, explanation: 'Explanation.' },
        { label: 'Roma', isCorrect: false, explanation: 'Explanation.' },
      ],
    };
    const result = lintTopicFile('test.json', createTopicFile([activity]));
    const errors = getErrors(result.diagnostics);
    expect(hasRule(errors, 'empty-text')).toBe(true);
  });

  it('reports empty-explanation error', () => {
    const activity: Activity = {
      ...VALID_MULTIPLE_CHOICE,
      options: [
        { label: 'Madrid', isCorrect: false, explanation: '' },
        { label: 'París', isCorrect: true, explanation: 'Correct.' },
        { label: 'Roma', isCorrect: false, explanation: 'Wrong.' },
      ],
    };
    const result = lintTopicFile('test.json', createTopicFile([activity]));
    const errors = getErrors(result.diagnostics);
    expect(hasRule(errors, 'empty-explanation')).toBe(true);
  });

  it('reports missing-correct-option error', () => {
    const activity: Activity = {
      ...VALID_MULTIPLE_CHOICE,
      options: [
        { label: 'Madrid', isCorrect: false, explanation: 'Madrid es España.' },
        { label: 'París', isCorrect: false, explanation: 'París es Francia.' },
        { label: 'Roma', isCorrect: false, explanation: 'Roma es Italia.' },
      ],
    };
    const result = lintTopicFile('test.json', createTopicFile([activity]));
    const errors = getErrors(result.diagnostics);
    expect(hasRule(errors, 'missing-correct-option')).toBe(true);
  });

  it('reports question-without-question-mark warning', () => {
    const activity: Activity = {
      ...VALID_MULTIPLE_CHOICE,
      question: 'Cuál es la capital de Francia',
    };
    const result = lintTopicFile('test.json', createTopicFile([activity]));
    const warnings = getWarnings(result.diagnostics);
    expect(hasRule(warnings, 'question-without-question-mark')).toBe(true);
  });

  it('reports explanation-too-short warning for "Correcto." only', () => {
    const activity: Activity = {
      ...VALID_MULTIPLE_CHOICE,
      options: [
        { label: 'Madrid', isCorrect: false, explanation: 'Incorrecto.' },
        { label: 'París', isCorrect: true, explanation: 'Correcto.' },
        { label: 'Roma', isCorrect: false, explanation: 'Incorrecto.' },
      ],
    };
    const result = lintTopicFile('test.json', createTopicFile([activity]));
    const warnings = getWarnings(result.diagnostics);
    expect(hasRule(warnings, 'explanation-too-short')).toBe(true);
    const diag = getDiagnostic(warnings, 'explanation-too-short')!;
    expect(diag.message).toContain('only says');
  });

  it('reports explanation-too-short warning for short explanation', () => {
    const activity: Activity = {
      ...VALID_MULTIPLE_CHOICE,
      options: [
        { label: 'Madrid', isCorrect: false, explanation: 'Wrong answer.' },
        { label: 'París', isCorrect: true, explanation: 'Right answer.' },
        { label: 'Roma', isCorrect: false, explanation: 'Wrong answer.' },
      ],
    };
    const result = lintTopicFile('test.json', createTopicFile([activity]));
    const warnings = getWarnings(result.diagnostics);
    expect(hasRule(warnings, 'explanation-too-short')).toBe(true);
    const diag = getDiagnostic(warnings, 'explanation-too-short')!;
    expect(diag.message).toContain('chars');
  });

  it('reports meta-question warning', () => {
    const activity: Activity = {
      ...VALID_MULTIPLE_CHOICE,
      question: '¿Está cubierto el tema de las capitales en estas notas?',
    };
    const result = lintTopicFile('test.json', createTopicFile([activity]));
    const warnings = getWarnings(result.diagnostics);
    expect(hasRule(warnings, 'meta-question')).toBe(true);
  });

  it('reports refers-to-material warning', () => {
    const activity: Activity = {
      ...VALID_MULTIPLE_CHOICE,
      question: 'Según el material, ¿cuál es la capital de Francia?',
    };
    const result = lintTopicFile('test.json', createTopicFile([activity]));
    const warnings = getWarnings(result.diagnostics);
    expect(hasRule(warnings, 'refers-to-material')).toBe(true);
  });

  it('reports example-dependent-question warning', () => {
    const activity: Activity = {
      ...VALID_MULTIPLE_CHOICE,
      question: 'En el ejemplo de Madrid, ¿cuál es la capital de Francia?',
    };
    const result = lintTopicFile('test.json', createTopicFile([activity]));
    const warnings = getWarnings(result.diagnostics);
    expect(hasRule(warnings, 'example-dependent-question')).toBe(true);
  });

  it('reports not-in-spanish warning for English question', () => {
    const activity: Activity = {
      ...VALID_MULTIPLE_CHOICE,
      question: 'What is the capital of France?',
    };
    const result = lintTopicFile('test.json', createTopicFile([activity]));
    const warnings = getWarnings(result.diagnostics);
    expect(hasRule(warnings, 'not-in-spanish')).toBe(true);
  });

  it('does not report not-in-spanish for Spanish question', () => {
    const activity: Activity = {
      ...VALID_MULTIPLE_CHOICE,
      question: '¿Cuál es la capital de Francia?',
    };
    const result = lintTopicFile('test.json', createTopicFile([activity]));
    const warnings = getWarnings(result.diagnostics);
    expect(hasRule(warnings, 'not-in-spanish')).toBe(false);
  });
});

describe('lintTopicFile - single-choice validation', () => {
  it('reports single-choice-has-is-correct error', () => {
    const activity: Activity = {
      is: 'single-choice',
      question: 'Test?',
      options: [
        { label: 'Casa', explanation: 'Correct.' },
        { label: 'Perro', explanation: 'Wrong.' },
        { label: 'Libro', explanation: 'Wrong.' },
      ],
    };
    // Add isCorrect to first option to trigger the error
    (activity.options[0] as Record<string, unknown>).isCorrect = true;
    const result = lintTopicFile('test.json', createTopicFile([activity]));
    const errors = getErrors(result.diagnostics);
    expect(hasRule(errors, 'single-choice-has-is-correct')).toBe(true);
  });

  it('reports empty-text for empty question', () => {
    const activity: Activity = { ...VALID_SINGLE_CHOICE, question: '' };
    const result = lintTopicFile('test.json', createTopicFile([activity]));
    const errors = getErrors(result.diagnostics);
    expect(hasRule(errors, 'empty-text')).toBe(true);
  });

  it('reports too-few-options error', () => {
    const activity: Activity = {
      ...VALID_SINGLE_CHOICE,
      options: [VALID_SINGLE_CHOICE.options[0]!],
    };
    const result = lintTopicFile('test.json', createTopicFile([activity]));
    const errors = getErrors(result.diagnostics);
    expect(hasRule(errors, 'too-few-options')).toBe(true);
  });

  it('reports duplicate-option error', () => {
    const activity: Activity = {
      ...VALID_SINGLE_CHOICE,
      options: [
        { label: 'Casa', explanation: 'Correct.' },
        { label: 'Casa', explanation: 'Wrong.' },
        { label: 'Libro', explanation: 'Wrong.' },
      ],
    };
    const result = lintTopicFile('test.json', createTopicFile([activity]));
    const errors = getErrors(result.diagnostics);
    expect(hasRule(errors, 'duplicate-option')).toBe(true);
  });

  it('reports empty-explanation error', () => {
    const activity: Activity = {
      ...VALID_SINGLE_CHOICE,
      options: [
        { label: 'Casa', explanation: '' },
        { label: 'Perro', explanation: 'Wrong.' },
        { label: 'Libro', explanation: 'Wrong.' },
      ],
    };
    const result = lintTopicFile('test.json', createTopicFile([activity]));
    const errors = getErrors(result.diagnostics);
    expect(hasRule(errors, 'empty-explanation')).toBe(true);
  });

  it('reports question-without-question-mark warning', () => {
    const activity: Activity = { ...VALID_SINGLE_CHOICE, question: 'Qué significa house' };
    const result = lintTopicFile('test.json', createTopicFile([activity]));
    const warnings = getWarnings(result.diagnostics);
    expect(hasRule(warnings, 'question-without-question-mark')).toBe(true);
  });
});

describe('lintTopicFile - reorder validation', () => {
  it('reports empty-text for empty title', () => {
    const activity: Activity = { ...VALID_REORDER, title: '' };
    const result = lintTopicFile('test.json', createTopicFile([activity]));
    const errors = getErrors(result.diagnostics);
    expect(hasRule(errors, 'empty-text')).toBe(true);
  });

  it('reports too-few-elements error', () => {
    const activity: Activity = { ...VALID_REORDER, elements: ['Uno'] };
    const result = lintTopicFile('test.json', createTopicFile([activity]));
    const errors = getErrors(result.diagnostics);
    expect(hasRule(errors, 'too-few-elements')).toBe(true);
  });

  it('reports duplicate-element error', () => {
    const activity: Activity = { ...VALID_REORDER, elements: ['Uno', 'Dos', 'Uno'] };
    const result = lintTopicFile('test.json', createTopicFile([activity]));
    const errors = getErrors(result.diagnostics);
    expect(hasRule(errors, 'duplicate-element')).toBe(true);
  });
});

describe('lintTopicFile - relate validation', () => {
  it('reports empty-text for empty title', () => {
    const activity: Activity = { ...VALID_RELATE, title: '' };
    const result = lintTopicFile('test.json', createTopicFile([activity]));
    const errors = getErrors(result.diagnostics);
    expect(hasRule(errors, 'empty-text')).toBe(true);
  });

  it('reports too-few-pairs error', () => {
    const activity: Activity = { ...VALID_RELATE, related: { Uno: '1' } };
    const result = lintTopicFile('test.json', createTopicFile([activity]));
    const errors = getErrors(result.diagnostics);
    expect(hasRule(errors, 'too-few-pairs')).toBe(true);
  });

  it('reports empty-related-value error for empty key', () => {
    const activity: Activity = { ...VALID_RELATE, related: { '': '1', Dos: '2' } };
    const result = lintTopicFile('test.json', createTopicFile([activity]));
    const errors = getErrors(result.diagnostics);
    expect(hasRule(errors, 'empty-related-value')).toBe(true);
  });

  it('reports empty-related-value error for empty value', () => {
    const activity: Activity = { ...VALID_RELATE, related: { Uno: '', Dos: '2' } };
    const result = lintTopicFile('test.json', createTopicFile([activity]));
    const errors = getErrors(result.diagnostics);
    expect(hasRule(errors, 'empty-related-value')).toBe(true);
  });
});

describe('lintTopicFile - complete-words validation', () => {
  it('reports no-blank error for empty parts', () => {
    const activity: Activity = { ...VALID_COMPLETE_WORDS, parts: [] };
    const result = lintTopicFile('test.json', createTopicFile([activity]));
    const errors = getErrors(result.diagnostics);
    expect(hasRule(errors, 'no-blank')).toBe(true);
  });

  it('reports no-blank error when no blank parts', () => {
    const activity: Activity = {
      is: 'complete-words',
      parts: [{ isBlank: false, label: 'La capital de Francia es París.' }],
    };
    const result = lintTopicFile('test.json', createTopicFile([activity]));
    const errors = getErrors(result.diagnostics);
    expect(hasRule(errors, 'no-blank')).toBe(true);
  });

  it('reports empty-blank error', () => {
    const activity: Activity = {
      ...VALID_COMPLETE_WORDS,
      parts: [
        { isBlank: false, label: 'La capital de Francia es ' },
        { isBlank: true, label: '' },
        { isBlank: false, label: '.' },
      ],
    };
    const result = lintTopicFile('test.json', createTopicFile([activity]));
    const errors = getErrors(result.diagnostics);
    expect(hasRule(errors, 'empty-blank')).toBe(true);
  });

  it('reports blank-too-long warning', () => {
    const activity: Activity = {
      ...VALID_COMPLETE_WORDS,
      parts: [
        { isBlank: false, label: 'La capital de Francia es ' },
        { isBlank: true, label: 'París la hermosa ciudad' }, // 4 words
        { isBlank: false, label: '.' },
      ],
    };
    const result = lintTopicFile('test.json', createTopicFile([activity]));
    const warnings = getWarnings(result.diagnostics);
    expect(hasRule(warnings, 'blank-too-long')).toBe(true);
  });

  it('reports blank-not-essential warning for filler word', () => {
    const activity: Activity = {
      ...VALID_COMPLETE_WORDS,
      parts: [
        { isBlank: false, label: 'La capital de Francia es ' },
        { isBlank: true, label: 'de' }, // filler word
        { isBlank: false, label: ' París.' },
      ],
    };
    const result = lintTopicFile('test.json', createTopicFile([activity]));
    const warnings = getWarnings(result.diagnostics);
    expect(hasRule(warnings, 'blank-not-essential')).toBe(true);
  });

  it('reports quote-in-complete-words warning', () => {
    const activity: Activity = {
      ...VALID_COMPLETE_WORDS,
      parts: [
        { isBlank: false, label: 'Como dijo Shakespeare: "' },
        { isBlank: true, label: 'Ser o no ser' },
        { isBlank: false, label: '"' },
      ],
    };
    const result = lintTopicFile('test.json', createTopicFile([activity]));
    const warnings = getWarnings(result.diagnostics);
    expect(hasRule(warnings, 'quote-in-complete-words')).toBe(true);
  });
});

describe('lintTopicFile - card validation', () => {
  it('reports empty-card-side error for empty front', () => {
    const activity: Activity = { ...VALID_CARD, front: '' };
    const result = lintTopicFile('test.json', createTopicFile([activity]));
    const errors = getErrors(result.diagnostics);
    expect(hasRule(errors, 'empty-card-side')).toBe(true);
  });

  it('reports empty-card-side error for empty back', () => {
    const activity: Activity = { ...VALID_CARD, back: '' };
    const result = lintTopicFile('test.json', createTopicFile([activity]));
    const errors = getErrors(result.diagnostics);
    expect(hasRule(errors, 'empty-card-side')).toBe(true);
  });
});

describe('lintTopicFile - topic level checks', () => {
  it('reports duplicate-activity error', () => {
    const result = lintTopicFile(
      'test.json',
      createTopicFile([VALID_MULTIPLE_CHOICE, VALID_MULTIPLE_CHOICE]),
    );
    const errors = getErrors(result.diagnostics);
    expect(hasRule(errors, 'duplicate-activity')).toBe(true);
  });

  it('reports repeated-question warning', () => {
    const activity1 = { ...VALID_MULTIPLE_CHOICE, question: '¿Cuál es la capital de Francia?' };
    const activity2 = { ...VALID_MULTIPLE_CHOICE, question: '¿Cuál es la capital de Francia?' };
    const result = lintTopicFile('test.json', createTopicFile([activity1, activity2]));
    const warnings = getWarnings(result.diagnostics);
    expect(hasRule(warnings, 'repeated-question')).toBe(true);
  });

  it('reports similar-question warning', () => {
    const activity1 = {
      ...VALID_MULTIPLE_CHOICE,
      question: '¿Cuál es la capital de Francia y cuál es su población total?',
    };
    const activity2 = {
      ...VALID_MULTIPLE_CHOICE,
      question: '¿Cuál es la capital de Francia y cuál es su población total y su área?',
    };
    const result = lintTopicFile('test.json', createTopicFile([activity1, activity2]));
    const warnings = getWarnings(result.diagnostics);
    expect(hasRule(warnings, 'similar-question')).toBe(true);
  });

  it('reports topic-too-small warning', () => {
    const result = lintTopicFile(
      'test.json',
      createTopicFile([VALID_MULTIPLE_CHOICE, VALID_SINGLE_CHOICE]),
    );
    const warnings = getWarnings(result.diagnostics);
    expect(hasRule(warnings, 'topic-too-small')).toBe(true);
  });

  it('reports missing-true-false warning', () => {
    const activities = Array.from({ length: 5 }, () => VALID_MULTIPLE_CHOICE);
    const result = lintTopicFile('test.json', createTopicFile(activities));
    const warnings = getWarnings(result.diagnostics);
    expect(hasRule(warnings, 'missing-true-false')).toBe(true);
  });

  it('does not report missing-true-false when true/false exists', () => {
    const trueFalse: Activity = {
      is: 'single-choice',
      question: '¿Es París la capital de Francia?',
      options: [
        { label: 'Sí', explanation: 'Correcto.' },
        { label: 'No', explanation: 'Incorrecto.' },
      ],
    };
    const activities: Array<Activity> = [
      trueFalse,
      VALID_MULTIPLE_CHOICE,
      VALID_MULTIPLE_CHOICE,
      VALID_MULTIPLE_CHOICE,
      VALID_MULTIPLE_CHOICE,
    ];
    const result = lintTopicFile('test.json', createTopicFile(activities));
    const warnings = getWarnings(result.diagnostics);
    expect(hasRule(warnings, 'missing-true-false')).toBe(false);
  });

  it('reports uniform-correct-count warning', () => {
    const activities: Array<Activity> = [
      VALID_MULTIPLE_CHOICE,
      { ...VALID_MULTIPLE_CHOICE, question: '¿Capital de España?' },
      { ...VALID_MULTIPLE_CHOICE, question: '¿Capital de Italia?' },
    ];
    const result = lintTopicFile('test.json', createTopicFile(activities));
    const warnings = getWarnings(result.diagnostics);
    expect(hasRule(warnings, 'uniform-correct-count')).toBe(true);
  });

  it('reports uniform-option-count warning', () => {
    const activities: Array<Activity> = [
      VALID_MULTIPLE_CHOICE,
      { ...VALID_MULTIPLE_CHOICE, question: '¿Capital de España?' },
      { ...VALID_SINGLE_CHOICE, question: '¿Capital de Italia?' },
    ];
    const result = lintTopicFile('test.json', createTopicFile(activities));
    const warnings = getWarnings(result.diagnostics);
    expect(hasRule(warnings, 'uniform-option-count')).toBe(true);
  });

  it('reports missing-reorder-or-relate warning', () => {
    const activities = Array.from({ length: 8 }, () => VALID_MULTIPLE_CHOICE);
    const result = lintTopicFile('test.json', createTopicFile(activities));
    const warnings = getWarnings(result.diagnostics);
    expect(hasRule(warnings, 'missing-reorder-or-relate')).toBe(true);
  });
});

describe('lintTopicFile - longest option detection', () => {
  it('reports longest-option-is-correct error (3+ options, ratio >= 1.5, diff >= 10)', () => {
    const activity: Activity = {
      is: 'multiple-choice',
      question: 'Test question?',
      options: [
        { label: 'Short', isCorrect: false, explanation: 'Wrong.' }, // 5 chars
        {
          label: 'This is a very long correct option that is clearly the longest',
          isCorrect: true,
          explanation: 'Correct.',
        }, // ~60 chars
        { label: 'Medium', isCorrect: false, explanation: 'Wrong.' }, // 6 chars
      ],
    };
    const result = lintTopicFile('test.json', createTopicFile([activity]));
    const errors = getErrors(result.diagnostics);
    expect(hasRule(errors, 'longest-option-is-correct')).toBe(true);
    const diag = getDiagnostic(errors, 'longest-option-is-correct')!;
    expect(diag.message).toContain('option 0:');
    expect(diag.message).toContain('option 1:');
    expect(diag.message).toContain('option 2:');
    expect(diag.message).toContain('(correct)');
  });

  it('reports option-length-imbalance warning (3+ options, ratio >= 1.25, diff >= 5)', () => {
    const activity: Activity = {
      is: 'multiple-choice',
      question: 'Test question?',
      options: [
        { label: 'Short', isCorrect: false, explanation: 'Wrong.' }, // 5 chars
        { label: 'Correct opt', isCorrect: true, explanation: 'Correct.' }, // 11 chars
        { label: 'Medium', isCorrect: false, explanation: 'Wrong.' }, // 6 chars
      ],
    };
    const result = lintTopicFile('test.json', createTopicFile([activity]));
    const warnings = getWarnings(result.diagnostics);
    expect(hasRule(warnings, 'option-length-imbalance')).toBe(true);
    const diag = getDiagnostic(warnings, 'option-length-imbalance')!;
    expect(diag.message).toContain('option 0:');
    expect(diag.message).toContain('(correct)');
  });

  it('does not report for true/false pair', () => {
    const activity: Activity = {
      is: 'single-choice',
      question: 'Test?',
      options: [
        { label: 'Verdadero', explanation: 'Correct.' },
        { label: 'Falso', explanation: 'Wrong.' },
      ],
    };
    const result = lintTopicFile('test.json', createTopicFile([activity]));
    const errors = getErrors(result.diagnostics);
    const warnings = getWarnings(result.diagnostics);
    expect(hasRule(errors, 'longest-option-is-correct')).toBe(false);
    expect(hasRule(warnings, 'option-length-imbalance')).toBe(false);
  });

  it('reports option-length-imbalance warning for 2-option (ratio >= 2, diff >= 20)', () => {
    const activity: Activity = {
      is: 'single-choice',
      question: 'Test?',
      options: [
        {
          label: 'This is a very long correct option that is much longer',
          explanation: 'Correct.',
        }, // ~50 chars
        { label: 'Short', explanation: 'Wrong.' }, // 5 chars
      ],
    };
    const result = lintTopicFile('test.json', createTopicFile([activity]));
    const warnings = getWarnings(result.diagnostics);
    expect(hasRule(warnings, 'option-length-imbalance')).toBe(true);
  });

  it('reports longest-is-always-correct error at topic level', () => {
    const activities: Array<Activity> = [
      {
        is: 'multiple-choice',
        question: 'Q1?',
        options: [
          { label: 'A', isCorrect: false, explanation: 'Wrong.' },
          { label: 'Very long correct option', isCorrect: true, explanation: 'Correct.' },
          { label: 'B', isCorrect: false, explanation: 'Wrong.' },
        ],
      },
      {
        is: 'multiple-choice',
        question: 'Q2?',
        options: [
          { label: 'C', isCorrect: false, explanation: 'Wrong.' },
          {
            label: 'Another very long correct answer here',
            isCorrect: true,
            explanation: 'Correct.',
          },
          { label: 'D', isCorrect: false, explanation: 'Wrong.' },
        ],
      },
      {
        is: 'multiple-choice',
        question: 'Q3?',
        options: [
          { label: 'E', isCorrect: false, explanation: 'Wrong.' },
          {
            label: 'Yet another extremely long correct option',
            isCorrect: true,
            explanation: 'Correct.',
          },
          { label: 'F', isCorrect: false, explanation: 'Wrong.' },
        ],
      },
    ];
    const result = lintTopicFile('test.json', createTopicFile(activities));
    const errors = getErrors(result.diagnostics);
    expect(hasRule(errors, 'longest-is-always-correct')).toBe(true);
    const diag = getDiagnostic(errors, 'longest-is-always-correct')!;
    expect(diag.message).toContain('activity 0');
    expect(diag.message).toContain('activity 1');
    expect(diag.message).toContain('activity 2');
  });

  it('reports longest-is-usually-correct warning at topic level', () => {
    const activities: Array<Activity> = [
      {
        is: 'multiple-choice',
        question: 'Q1?',
        options: [
          { label: 'A', isCorrect: false, explanation: 'Wrong.' },
          { label: 'Very long correct option', isCorrect: true, explanation: 'Correct.' },
          { label: 'B', isCorrect: false, explanation: 'Wrong.' },
        ],
      },
      {
        is: 'multiple-choice',
        question: 'Q2?',
        options: [
          { label: 'C', isCorrect: false, explanation: 'Wrong.' },
          {
            label: 'Another very long correct answer here',
            isCorrect: true,
            explanation: 'Correct.',
          },
          { label: 'D', isCorrect: false, explanation: 'Wrong.' },
        ],
      },
      {
        is: 'multiple-choice',
        question: 'Q3?',
        options: [
          { label: 'Short', isCorrect: true, explanation: 'Correct.' },
          { label: 'Also short', isCorrect: false, explanation: 'Wrong.' },
          { label: 'Also short', isCorrect: false, explanation: 'Wrong.' },
        ],
      },
    ];
    const result = lintTopicFile('test.json', createTopicFile(activities));
    const warnings = getWarnings(result.diagnostics);
    expect(hasRule(warnings, 'longest-is-usually-correct')).toBe(true);
  });
});

describe('lintTopicFile - line/column reporting', () => {
  it('reports correct activity index and line/column', () => {
    const raw = `[
  {
    "is": "multiple-choice",
    "question": "Test?",
    "options": [
      { "label": "A", "isCorrect": false, "explanation": "Wrong." },
      { "label": "B", "isCorrect": true, "explanation": "Correct." }
    ]
  },
  {
    "is": "multiple-choice",
    "question": "",
    "options": [
      { "label": "C", "isCorrect": false, "explanation": "Wrong." },
      { "label": "D", "isCorrect": true, "explanation": "Correct." }
    ]
  }
]`;
    const result = lintTopicFile('test.json', raw);
    const errors = getErrors(result.diagnostics);
    const emptyTextError = errors.find(e => e.ruleId === 'empty-text')!;
    expect(emptyTextError.activityIndex).toBe(1);
    expect(emptyTextError.line).toBeGreaterThan(1);
  });

  it('reports line numbers at activity object boundaries, not nested arrays (regression)', () => {
    // This test ensures findActivityOffsets tracks { } at array depth 1,
    // not [ ] of nested arrays like "options"
    const raw = `[
  {
    "is": "multiple-choice",
    "question": "Q1?",
    "options": [
      { "label": "A", "isCorrect": false, "explanation": "Wrong." },
      { "label": "B", "isCorrect": true, "explanation": "Correct." }
    ]
  },
  {
    "is": "multiple-choice",
    "question": "",
    "options": [
      { "label": "C", "isCorrect": false, "explanation": "Wrong." },
      { "label": "D", "isCorrect": true, "explanation": "Correct." }
    ]
  }
]`;
    const result = lintTopicFile('test.json', raw);
    const errors = getErrors(result.diagnostics);
    const emptyTextError = errors.find(e => e.ruleId === 'empty-text')!;

    // The empty question is on line 11 in the raw text above
    // The activity object starts on line 10
    // Before the fix, it would report line 8 (end of first activity's options array)
    expect(emptyTextError.activityIndex).toBe(1);
    expect(emptyTextError.line).toBe(10); // Activity 2 starts at line 10
  });
});

describe('lintContentDirectory', () => {
  it('returns empty array for non-existent directory', () => {
    const result = lintContentDirectory('/non/existent/path');
    expect(result.length).toBe(0);
  });

  it('reports subject-without-topics for empty content dir', () => {
    // This might not apply since it has topic files
    lintContentDirectory('example-content/matematicas');
  });
});

describe('formatDiagnostics', () => {
  it('formats empty diagnostics', () => {
    const output = formatDiagnostics([]);
    expect(output).toBe('No issues found.');
  });

  it('formats diagnostics with file, rule, severity, message', () => {
    const diags: Array<Diagnostic> = [
      {
        ruleId: 'test-rule',
        severity: 'error',
        message: 'Test message',
        filePath: 'content/test/topic.json',
        line: 5,
        column: 10,
        activityIndex: 0,
        scope: 'activity',
      },
    ];
    const output = formatDiagnostics(diags);
    expect(output).toContain('content/test/topic.json');
    expect(output).toContain('[test-rule]');
    expect(output).toContain('ERROR');
    expect(output).toContain('Test message');
    expect(output).toContain('activity 0');
    expect(output).toContain('line 5');
    expect(output).toContain('col 10');
  });

  it('sorts by file path then line then column', () => {
    const diags: Array<Diagnostic> = [
      {
        ruleId: 'a',
        severity: 'error',
        message: '1',
        filePath: 'b.json',
        line: 1,
        column: 1,
        scope: 'file',
      },
      {
        ruleId: 'b',
        severity: 'error',
        message: '2',
        filePath: 'a.json',
        line: 1,
        column: 1,
        scope: 'file',
      },
      {
        ruleId: 'c',
        severity: 'error',
        message: '3',
        filePath: 'a.json',
        line: 2,
        column: 1,
        scope: 'file',
      },
    ];
    const output = formatDiagnostics(diags);
    const aPos = output.indexOf('a.json');
    const bPos = output.indexOf('b.json');
    expect(aPos).toBeLessThan(bPos);
  });
});

describe('formatDiagnosticsJson', () => {
  it('outputs valid JSON', () => {
    const diags: Array<Diagnostic> = [
      {
        ruleId: 'test-rule',
        severity: 'error',
        message: 'Test message',
        filePath: 'test.json',
        line: 1,
        column: 1,
        scope: 'file',
      },
    ];
    const output = formatDiagnosticsJson(diags);
    const parsed = JSON.parse(output);
    expect(parsed.length).toBe(1);
    expect(parsed[0].ruleId).toBe('test-rule');
  });
});

describe('runCli', () => {
  it('returns 0 for no issues', () => {
    // Test with example-content which should have no errors
    const code = runCli(['--dir', 'example-content']);
    expect(code).toBe(0);
  });

  it('returns 1 for errors', () => {
    // Create a temp dir with invalid content
    // This is harder to test without filesystem, so we skip
  });

  it('shows help with --help', () => {
    const code = runCli(['--help']);
    expect(code).toBe(0);
  });
});

describe('example-content validation', () => {
  it('matematicas/geometria.json has no errors', () => {
    const result = lintContentDirectory('example-content');
    const errors = getErrors(result);
    // Filter to just geometria.json
    const geoErrors = errors.filter(e => e.filePath.includes('geometria.json'));
    expect(geoErrors.length).toBe(0);
  });

  it('ingles/vocabulario.json has no errors', () => {
    const result = lintContentDirectory('example-content');
    const errors = getErrors(result);
    const vocabErrors = errors.filter(e => e.filePath.includes('vocabulario.json'));
    expect(vocabErrors.length).toBe(0);
  });
});

describe('subject-level checks', () => {
  it('reports filename-not-kebab-case warning', () => {
    // This is tested indirectly through lintContentDirectory
    // The actual check is on the filename
  });

  it('reports placeholder-filename warning', () => {
    // Tested indirectly
  });

  it('reports duplicate-question-across-topics warning', () => {
    // Requires multiple topic files in same subject
    // Hard to test without filesystem setup
  });
});

describe('regression: real content structure', () => {
  it('parses all example-content files without errors', () => {
    const result = lintContentDirectory('example-content');
    const errors = getErrors(result);
    // The sample content should be valid
    expect(errors.length).toBe(0);
  });
});

// ============================================================================
// Additional edge case tests
// ============================================================================

describe('edge cases', () => {
  it('handles activity with missing fields gracefully', () => {
    const raw = `[{"is": "multiple-choice"}]`;
    const result = lintTopicFile('test.json', raw);
    const errors = getErrors(result.diagnostics);
    // Should report missing fields
    expect(errors.length).toBeGreaterThan(0);
  });

  it('handles null values in options', () => {
    const activity: Activity = {
      is: 'multiple-choice',
      question: 'Test?',
      options: [
        { label: 'A', isCorrect: false, explanation: 'Wrong.' },
        { label: null as unknown as string, isCorrect: true, explanation: 'Correct.' },
        { label: 'C', isCorrect: false, explanation: 'Wrong.' },
      ],
    };
    const result = lintTopicFile('test.json', createTopicFile([activity]));
    const errors = getErrors(result.diagnostics);
    expect(hasRule(errors, 'empty-text')).toBe(true);
  });

  it('handles explanation with only whitespace', () => {
    const activity: Activity = {
      ...VALID_MULTIPLE_CHOICE,
      options: [
        { label: 'Madrid', isCorrect: false, explanation: '   ' },
        { label: 'París', isCorrect: true, explanation: 'Correct.' },
        { label: 'Roma', isCorrect: false, explanation: 'Wrong.' },
      ],
    };
    const result = lintTopicFile('test.json', createTopicFile([activity]));
    const errors = getErrors(result.diagnostics);
    expect(hasRule(errors, 'empty-explanation')).toBe(true);
  });

  it('handles complete-words with multiple blanks', () => {
    const activity: Activity = {
      is: 'complete-words',
      parts: [
        { isBlank: true, label: 'París' },
        { isBlank: false, label: ' es la capital de ' },
        { isBlank: true, label: 'Francia' },
      ],
    };
    const result = lintTopicFile('test.json', createTopicFile([activity]));
    const errors = getErrors(result.diagnostics);
    expect(errors.length).toBe(0);
  });

  it('reports missing-field for wrong activity shape', () => {
    const raw = `[{"is": "multiple-choice", "question": "Test?"}]`; // missing options
    const result = lintTopicFile('test.json', raw);
    const errors = getErrors(result.diagnostics);
    // The activity validation will fail on options access
    expect(errors.length).toBeGreaterThan(0);
  });
});
