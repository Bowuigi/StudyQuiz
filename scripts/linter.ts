/// <reference types="node" />
// Content linter for QUESTION_GENERATION_PROMPT.md
// Run with: node scripts/linter.ts [--dir <path>] [--json] [--strict]

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
const { join, relative, dirname, basename } = path;

// ============================================================================
// Configuration block - thresholds can be tuned here
// ============================================================================

const CONFIG = {
  // Length thresholds for longest-option detection
  // For 3+ options: error when correct >= ratio * mean AND correct - mean >= diff
  longestErrorRatio: 1.5,
  longestErrorDiff: 10,
  longestWarningRatio: 1.25,
  longestWarningDiff: 5,
  // For 2 options: warning only (true/false simulation)
  longestTwoOptionWarningRatio: 2,
  longestTwoOptionWarningDiff: 20,
  // Explanation length thresholds
  shortExplanationChars: 25,
  // Topic size thresholds
  minTopicActivities: 5,
  minChoiceActivitiesForTrueFalse: 5,
  minActivitiesForReorderRelate: 8,
  // Similarity threshold for questions
  similarQuestionJaccard: 0.8,
  // Blank length threshold
  maxBlankWords: 3,
  // Filler words for blank-not-essential
  fillerWords: new Set([
    'de',
    'la',
    'el',
    'los',
    'las',
    'un',
    'una',
    'unos',
    'unas',
    'y',
    'o',
    'pero',
    'porque',
    'como',
    'cuando',
    'donde',
    'del',
    'al',
    'más',
    'menos',
    'muy',
    'tan',
    'bien',
    'mal',
    'en',
    'con',
    'sin',
    'sobre',
    'bajo',
    'entre',
    'hacia',
    'para',
    'por',
    'segun',
    'según',
    'desde',
    'hasta',
  ]),
  // Placeholder filenames
  placeholderFilenames: new Set([
    'new',
    'untitled',
    'tema',
    'contenido',
    'topic',
    'subject',
    'nuevo',
    'sin-titulo',
    'ejemplo',
    'example',
    'test',
    'prueba',
  ]),
  // English/Spanish markers
  englishMarkers: new Set([
    'the',
    'and',
    'or',
    'but',
    'if',
    'then',
    'else',
    'when',
    'where',
    'what',
    'which',
    'who',
    'whom',
    'whose',
    'how',
    'why',
    'is',
    'are',
    'was',
    'were',
    'been',
    'being',
    'have',
    'has',
    'had',
    'do',
    'does',
    'did',
    'will',
    'would',
    'could',
    'should',
    'may',
    'might',
    'must',
    'can',
    'cannot',
    'shall',
    'should',
    'this',
    'that',
    'these',
    'those',
    'a',
    'an',
    'in',
    'on',
    'at',
    'by',
    'for',
    'with',
    'without',
    'from',
    'to',
    'of',
    'as',
    'it',
    'its',
    'their',
    'there',
    'here',
    'be',
    'been',
  ]),
  spanishMarkers: new Set([
    'el',
    'la',
    'los',
    'las',
    'un',
    'una',
    'unos',
    'unas',
    'y',
    'o',
    'pero',
    'porque',
    'como',
    'cuando',
    'donde',
    'que',
    'qué',
    'quien',
    'quién',
    'cual',
    'cuál',
    'cuyo',
    'cuya',
    'cuyos',
    'cuyas',
    'como',
    'cómo',
    'por',
    'para',
    'con',
    'sin',
    'sobre',
    'bajo',
    'entre',
    'hacia',
    'desde',
    'hasta',
    'del',
    'al',
    'más',
    'menos',
    'muy',
    'también',
    'no',
    'sí',
    'es',
    'son',
    'era',
    'eran',
    'está',
    'están',
    'estaba',
    'estaban',
    'ha',
    'han',
    'he',
    'has',
    'hay',
    'tiene',
    'tienen',
    'hace',
    'hacen',
    'dice',
    'dicen',
    've',
    'ven',
    'sabe',
    'saben',
    'quiere',
    'quieren',
    'puede',
    'pueden',
  ]),
  // Meta question patterns
  metaPatterns: [
    /est[áa]\s+cubiert/i,
    /est[áa]n\s+cubiert/i,
    /cubr[eé]\s+el\s+tema/i,
    /est[áa]s\s+notas/i,
    /en\s+el\s+material/i,
    /seg[uú]n\s+el\s+material/i,
    /las\s+notas\s+dicen/i,
    /el\s+material\s+dice/i,
    /seg[uú]n\s+las\s+notas/i,
    /en\s+las\s+notas/i,
    /el\s+ejemplo\s+de/i,
    /en\s+el\s+ejemplo\s+de/i,
  ],
  // Explanation-only patterns
  explanationOnlyPatterns: [
    /^correcto\.?$/i,
    /^incorrecto\.?$/i,
    /^correcta\.?$/i,
    /^incorrecta\.?$/i,
    /^true\.?$/i,
    /^false\.?$/i,
    /^verdadero\.?$/i,
    /^falso\.?$/i,
    /^s[ií]\.?$/i,
    /^no\.?$/i,
  ],
} as const;

// ============================================================================
// Types
// ============================================================================

type Severity = 'error' | 'warning';

type Diagnostic = {
  ruleId: string;
  severity: Severity;
  message: string;
  filePath: string;
  line: number;
  column: number;
  activityIndex?: number;
  scope: 'file' | 'activity' | 'topic' | 'subject';
};

// JSON shapes (mirroring src/types.d.ts)
type MultipleChoiceActivity = {
  question: string;
  options: Array<{ label: string; isCorrect: boolean; explanation: string }>;
};

type SingleChoiceActivity = {
  question: string;
  options: Array<{ label: string; explanation: string }>;
};

type ReorderActivity = {
  title: string;
  elements: Array<string>;
};

type RelateActivity = {
  title: string;
  related: Record<string, string>;
};

type CompleteWordsActivity = {
  parts: Array<{ isBlank: boolean; label: string }>;
};

type CardActivity = {
  front: string;
  back: string;
};

type Activity =
  | ({ is: 'multiple-choice' } & MultipleChoiceActivity)
  | ({ is: 'single-choice' } & SingleChoiceActivity)
  | ({ is: 'reorder' } & ReorderActivity)
  | ({ is: 'relate' } & RelateActivity)
  | ({ is: 'complete-words' } & CompleteWordsActivity)
  | ({ is: 'card' } & CardActivity);

type TopicDiagnostics = {
  filePath: string;
  activities: Array<Activity>;
  diagnostics: Array<Diagnostic>;
  rawText: string;
};

type SubjectDiagnostics = {
  subject: string;
  topics: Array<TopicDiagnostics>;
  diagnostics: Array<Diagnostic>;
};

// ============================================================================
// Utility functions
// ============================================================================

function findLineColumn(text: string, offset: number): { line: number; column: number } {
  let line = 1;
  let column = 1;
  for (let i = 0; i < offset && i < text.length; i++) {
    if (text[i] === '\n') {
      line++;
      column = 1;
    } else {
      column++;
    }
  }
  return { line, column };
}

function findActivityOffsets(rawText: string): Array<{ start: number; end: number }> {
  const offsets: Array<{ start: number; end: number }> = [];
  let arrayDepth = 0;
  let braceDepth = 0;
  let inString = false;
  let escape = false;
  let start = -1;

  for (let i = 0; i < rawText.length; i++) {
    const ch = rawText[i];

    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === '\\') {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
    } else if (ch === '"') {
      inString = true;
    } else if (ch === '[') {
      arrayDepth++;
    } else if (ch === ']') {
      arrayDepth--;
    } else if (ch === '{' && arrayDepth === 1) {
      // Start of an activity object (direct child of the outer array)
      if (braceDepth === 0) {
        start = i;
      }
      braceDepth++;
    } else if (ch === '}' && arrayDepth === 1) {
      braceDepth--;
      if (braceDepth === 0 && start !== -1) {
        // End of an activity object
        offsets.push({ start, end: i + 1 });
        start = -1;
      }
    }
  }

  return offsets;
}

function normalizeQuestion(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replaceAll(/[¿?¡!.,;:()[\]{}[]/g, '')
    .replaceAll(/\s+/g, ' ')
    .trim();
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replaceAll(/[^a-záéíóúüñ0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2),
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  const intersection = new Set([...a].filter(x => b.has(x)));
  const union = new Set([...a, ...b]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

function isTrueFalsePair(options: Array<{ label: string }>): boolean {
  if (options.length !== 2) return false;
  const labels = options.map(o => o.label.toLowerCase().trim());
  const trueLabels = new Set([
    'verdadero',
    'falso',
    'sí',
    'no',
    'si',
    'true',
    'false',
    'yes',
    'no',
  ]);
  return labels.every(l => trueLabels.has(l));
}

function getCorrectOptionIndex(activity: Activity): number | null {
  if (activity.is === 'multiple-choice') {
    return activity.options?.findIndex(o => o.isCorrect) ?? -1;
  }
  if (activity.is === 'single-choice') {
    // First option is correct
    return activity.options && activity.options.length > 0 ? 0 : -1;
  }
  return null;
}

function getOptionLabels(activity: Activity): Array<string> {
  if ((activity.is === 'multiple-choice' || activity.is === 'single-choice') && activity.options) {
    return activity.options.map(o => o.label ?? '');
  }
  return [];
}

// ============================================================================
// Core linting functions
// ============================================================================

function checkLongestOption(
  options: Array<{ label: string; isCorrect?: boolean }>,
  correctIndex: number,
  activityIndex: number,
  filePath: string,
  baseLine: number,
  baseColumn: number,
  diagnostics: Array<Diagnostic>,
): void {
  // Skip true/false pairs
  if (isTrueFalsePair(options)) return;

  const correctLabel = options[correctIndex]?.label ?? '';
  const correctLen = correctLabel.length;
  const incorrectOptions = options.filter((_, i) => i !== correctIndex);
  if (incorrectOptions.length === 0) return;

  const incorrectLengths = incorrectOptions.map(o => (o.label ?? '').length);
  const meanIncorrect = incorrectLengths.reduce((a, b) => a + b, 0) / incorrectLengths.length;
  const ratio = correctLen / meanIncorrect;
  const diff = correctLen - meanIncorrect;

  // Build detailed message with all option lengths
  const optionDetails = options
    .map((o, i) => {
      const marker = i === correctIndex ? ' (correct)' : '';
      return `option ${i}: ${(o.label ?? '').length} chars${marker}`;
    })
    .join('; ');

  if (options.length >= 3) {
    if (ratio >= CONFIG.longestErrorRatio && diff >= CONFIG.longestErrorDiff) {
      diagnostics.push({
        ruleId: 'longest-option-is-correct',
        severity: 'error',
        message: `Correct option is clearly the longest (${correctLen} chars vs mean ${meanIncorrect.toFixed(1)} of incorrect, ratio ${ratio.toFixed(2)}, diff ${diff}). ${optionDetails}`,
        filePath,
        line: baseLine,
        column: baseColumn,
        activityIndex,
        scope: 'activity',
      });
    } else if (ratio >= CONFIG.longestWarningRatio && diff >= CONFIG.longestWarningDiff) {
      diagnostics.push({
        ruleId: 'option-length-imbalance',
        severity: 'warning',
        message: `Correct option is longer than incorrect ones (${correctLen} chars vs mean ${meanIncorrect.toFixed(1)}, ratio ${ratio.toFixed(2)}, diff ${diff}). ${optionDetails}`,
        filePath,
        line: baseLine,
        column: baseColumn,
        activityIndex,
        scope: 'activity',
      });
    }
  } else if (options.length === 2) {
    // Warning only for two-option activities
    if (
      ratio >= CONFIG.longestTwoOptionWarningRatio &&
      diff >= CONFIG.longestTwoOptionWarningDiff
    ) {
      diagnostics.push({
        ruleId: 'option-length-imbalance',
        severity: 'warning',
        message: `Correct option is much longer than the other (${correctLen} chars vs ${meanIncorrect.toFixed(1)}, ratio ${ratio.toFixed(2)}, diff ${diff}). ${optionDetails}`,
        filePath,
        line: baseLine,
        column: baseColumn,
        activityIndex,
        scope: 'activity',
      });
    }
  }
}

function lintLongestAlwaysCorrect(
  activities: Array<Activity>,
  filePath: string,
  diagnostics: Array<Diagnostic>,
): void {
  const choiceActivities = activities
    .filter(a => a.is === 'multiple-choice' || a.is === 'single-choice')
    .filter(a => {
      const correctIdx = getCorrectOptionIndex(a);
      return correctIdx !== null && correctIdx !== -1 && a.options && a.options.length > 0;
    });

  if (choiceActivities.length < 3) return;

  let allLongest = true;
  const details: Array<string> = [];

  for (const activity of choiceActivities) {
    const correctIdx = getCorrectOptionIndex(activity)!;
    const options = getOptionLabels(activity);
    if (options.length > 0) {
      if (isTrueFalsePair(options.map(l => ({ label: l })))) {
        allLongest = false;
        break;
      }

      const correctLen = options[correctIdx]!.length;
      const incorrectLengths = options.filter((_, i) => i !== correctIdx).map(l => l.length);
      const meanIncorrect = incorrectLengths.reduce((a, b) => a + b, 0) / incorrectLengths.length;
      const ratio = correctLen / meanIncorrect;
      const diff = correctLen - meanIncorrect;

      const optionDetails = options
        .map((l, i) => {
          const marker = i === correctIdx ? ' (correct)' : '';
          return `option ${i}: ${l.length} chars${marker}`;
        })
        .join('; ');

      if (ratio < CONFIG.longestErrorRatio || diff < CONFIG.longestErrorDiff) {
        allLongest = false;
      }
      details.push(
        `activity ${activities.indexOf(activity)}: ${optionDetails} (ratio ${ratio.toFixed(2)}, diff ${diff})`,
      );
    }
  }

  if (allLongest) {
    diagnostics.push({
      ruleId: 'longest-is-always-correct',
      severity: 'error',
      message: `In all ${choiceActivities.length} choice activities, the correct option is the longest. Details: ${details.join(' | ')}`,
      filePath,
      line: 1,
      column: 1,
      scope: 'topic',
    });
  } else {
    // Check if most are longest
    let longestCount = 0;
    for (const activity of choiceActivities) {
      const correctIdx = getCorrectOptionIndex(activity)!;
      const options = getOptionLabels(activity);
      if (!isTrueFalsePair(options.map(l => ({ label: l })))) {
        const correctLen = options[correctIdx]!.length;
        const incorrectLengths = options.filter((_, i) => i !== correctIdx).map(l => l.length);
        const meanIncorrect = incorrectLengths.reduce((a, b) => a + b, 0) / incorrectLengths.length;
        const ratio = correctLen / meanIncorrect;
        const diff = correctLen - meanIncorrect;

        if (ratio >= CONFIG.longestWarningRatio && diff >= CONFIG.longestWarningDiff) {
          longestCount++;
        }
      }
    }

    if (longestCount > choiceActivities.length / 2) {
      diagnostics.push({
        ruleId: 'longest-is-usually-correct',
        severity: 'warning',
        message: `In ${longestCount} of ${choiceActivities.length} choice activities, the correct option is the longest`,
        filePath,
        line: 1,
        column: 1,
        scope: 'topic',
      });
    }
  }
}

function isSpanish(text: string): boolean {
  const words = text.toLowerCase().split(/\s+/);
  let englishCount = 0;
  let spanishCount = 0;

  for (const word of words) {
    const clean = word.replaceAll(/[^a-záéíóúüñ]/g, '');
    if (CONFIG.englishMarkers.has(clean)) englishCount++;
    if (CONFIG.spanishMarkers.has(clean)) spanishCount++;
  }

  // At least 2 English markers and no Spanish markers
  return !(englishCount >= 2 && spanishCount === 0);
}

function lintMultipleChoice(
  activity: MultipleChoiceActivity & { is: 'multiple-choice' },
  activityIndex: number,
  filePath: string,
  baseLine: number,
  baseColumn: number,
  rawText: string,
  activityStartOffset: number,
  diagnostics: Array<Diagnostic>,
): void {
  const { question, options } = activity;

  // Missing options field
  if (!options || !Array.isArray(options)) {
    diagnostics.push({
      ruleId: 'missing-field',
      severity: 'error',
      message: 'Multiple-choice activity must have an options array',
      filePath,
      line: baseLine,
      column: baseColumn,
      activityIndex,
      scope: 'activity',
    });
    return;
  }

  // Empty question
  if (!question || !question.trim()) {
    diagnostics.push({
      ruleId: 'empty-text',
      severity: 'error',
      message: 'Question must be a non-empty string',
      filePath,
      line: baseLine,
      column: baseColumn,
      activityIndex,
      scope: 'activity',
    });
  } else if (!question.trim().endsWith('?')) {
    diagnostics.push({
      ruleId: 'question-without-question-mark',
      severity: 'warning',
      message: 'Choice question should end with "?"',
      filePath,
      line: baseLine,
      column: baseColumn,
      activityIndex,
      scope: 'activity',
    });
  }

  // Too few options
  if (options.length < 2) {
    diagnostics.push({
      ruleId: 'too-few-options',
      severity: 'error',
      message: 'Multiple-choice activity needs at least two options',
      filePath,
      line: baseLine,
      column: baseColumn,
      activityIndex,
      scope: 'activity',
    });
    return;
  }

  // Check options
  const labels = options.map(o => o.label ?? '');
  const seenLabels = new Map<string, number>();
  for (let i = 0; i < labels.length; i++) {
    const label = labels[i]!.trim();
    if (seenLabels.has(label)) {
      diagnostics.push({
        ruleId: 'duplicate-option',
        severity: 'error',
        message: `Duplicate option label "${label}" at index ${i} (first at index ${seenLabels.get(label)})`,
        filePath,
        line: baseLine,
        column: baseColumn,
        activityIndex,
        scope: 'activity',
      });
    } else {
      seenLabels.set(label, i);
    }

    // Empty label
    if (!label) {
      diagnostics.push({
        ruleId: 'empty-text',
        severity: 'error',
        message: `Option ${i} label must be a non-empty string`,
        filePath,
        line: baseLine,
        column: baseColumn,
        activityIndex,
        scope: 'activity',
      });
    }

    // Missing/empty explanation
    const explanation = options[i]!.explanation.trim();
    if (!explanation) {
      diagnostics.push({
        ruleId: 'empty-explanation',
        severity: 'error',
        message: `Option ${i} ("${label}") has an empty explanation`,
        filePath,
        line: baseLine,
        column: baseColumn,
        activityIndex,
        scope: 'activity',
      });
    } else if (CONFIG.explanationOnlyPatterns.some(p => p.test(explanation))) {
      diagnostics.push({
        ruleId: 'explanation-too-short',
        severity: 'warning',
        message: `Option ${i} ("${label}") explanation only says "${explanation}" without saying why`,
        filePath,
        line: baseLine,
        column: baseColumn,
        activityIndex,
        scope: 'activity',
      });
    } else if (explanation.length < CONFIG.shortExplanationChars) {
      diagnostics.push({
        ruleId: 'explanation-too-short',
        severity: 'warning',
        message: `Option ${i} ("${label}") explanation is only ${explanation.length} chars (below ${CONFIG.shortExplanationChars})`,
        filePath,
        line: baseLine,
        column: baseColumn,
        activityIndex,
        scope: 'activity',
      });
    }
  }

  // Check isCorrect presence
  const correctCount = options.filter(o => o.isCorrect).length;
  if (correctCount === 0) {
    diagnostics.push({
      ruleId: 'missing-correct-option',
      severity: 'error',
      message: 'Multiple-choice activity must have at least one correct option (isCorrect: true)',
      filePath,
      line: baseLine,
      column: baseColumn,
      activityIndex,
      scope: 'activity',
    });
  }

  // Longest option detection
  if (correctCount === 1) {
    const correctIndex = options.findIndex(o => o.isCorrect);
    checkLongestOption(
      options,
      correctIndex,
      activityIndex,
      filePath,
      baseLine,
      baseColumn,
      diagnostics,
    );
  }

  // Meta question patterns
  if (question && CONFIG.metaPatterns.some(p => p.test(question))) {
    diagnostics.push({
      ruleId: 'meta-question',
      severity: 'warning',
      message: 'Question appears to ask about the material/coverage rather than the topic itself',
      filePath,
      line: baseLine,
      column: baseColumn,
      activityIndex,
      scope: 'activity',
    });
  }

  // Refers to material
  if (
    question &&
    /seg[uú]n\s+el\s+material|en\s+el\s+material|las\s+notas|el\s+material\s+dice/i.test(question)
  ) {
    diagnostics.push({
      ruleId: 'refers-to-material',
      severity: 'warning',
      message:
        'Question is phrased relative to the source material ("según el material", "en las notas", etc.)',
      filePath,
      line: baseLine,
      column: baseColumn,
      activityIndex,
      scope: 'activity',
    });
  }

  // Example-dependent
  if (question && /en\s+el\s+ejemplo\s+de/i.test(question)) {
    diagnostics.push({
      ruleId: 'example-dependent-question',
      severity: 'warning',
      message: 'Question depends on a concrete example from the material',
      filePath,
      line: baseLine,
      column: baseColumn,
      activityIndex,
      scope: 'activity',
    });
  }

  // Language check
  if (question && !isSpanish(question)) {
    diagnostics.push({
      ruleId: 'not-in-spanish',
      severity: 'warning',
      message: 'Question appears to be in English (allowed only if the material itself is English)',
      filePath,
      line: baseLine,
      column: baseColumn,
      activityIndex,
      scope: 'activity',
    });
  }
}

function lintSingleChoice(
  activity: SingleChoiceActivity & { is: 'single-choice' },
  activityIndex: number,
  filePath: string,
  baseLine: number,
  baseColumn: number,
  rawText: string,
  activityStartOffset: number,
  diagnostics: Array<Diagnostic>,
): void {
  const { question, options } = activity;

  // Missing options field
  if (!options || !Array.isArray(options)) {
    diagnostics.push({
      ruleId: 'missing-field',
      severity: 'error',
      message: 'Single-choice activity must have an options array',
      filePath,
      line: baseLine,
      column: baseColumn,
      activityIndex,
      scope: 'activity',
    });
    return;
  }

  // Empty question
  if (!question || !question.trim()) {
    diagnostics.push({
      ruleId: 'empty-text',
      severity: 'error',
      message: 'Question must be a non-empty string',
      filePath,
      line: baseLine,
      column: baseColumn,
      activityIndex,
      scope: 'activity',
    });
  } else if (!question.trim().endsWith('?')) {
    diagnostics.push({
      ruleId: 'question-without-question-mark',
      severity: 'warning',
      message: 'Choice question should end with "?"',
      filePath,
      line: baseLine,
      column: baseColumn,
      activityIndex,
      scope: 'activity',
    });
  }

  // Too few options
  if (options.length < 2) {
    diagnostics.push({
      ruleId: 'too-few-options',
      severity: 'error',
      message: 'Single-choice activity needs at least two options',
      filePath,
      line: baseLine,
      column: baseColumn,
      activityIndex,
      scope: 'activity',
    });
    return;
  }

  // Check options
  const labels = options.map(o => o.label ?? '');
  const seenLabels = new Map<string, number>();
  for (let i = 0; i < labels.length; i++) {
    const label = labels[i]!.trim();
    if (seenLabels.has(label)) {
      diagnostics.push({
        ruleId: 'duplicate-option',
        severity: 'error',
        message: `Duplicate option label "${label}" at index ${i} (first at index ${seenLabels.get(label)})`,
        filePath,
        line: baseLine,
        column: baseColumn,
        activityIndex,
        scope: 'activity',
      });
    } else {
      seenLabels.set(label, i);
    }

    if (!label) {
      diagnostics.push({
        ruleId: 'empty-text',
        severity: 'error',
        message: `Option ${i} label must be a non-empty string`,
        filePath,
        line: baseLine,
        column: baseColumn,
        activityIndex,
        scope: 'activity',
      });
    }

    // Missing/empty explanation
    const explanation = options[i]!.explanation.trim();
    if (!explanation) {
      diagnostics.push({
        ruleId: 'empty-explanation',
        severity: 'error',
        message: `Option ${i} ("${label}") has an empty explanation`,
        filePath,
        line: baseLine,
        column: baseColumn,
        activityIndex,
        scope: 'activity',
      });
    } else if (CONFIG.explanationOnlyPatterns.some(p => p.test(explanation))) {
      diagnostics.push({
        ruleId: 'explanation-too-short',
        severity: 'warning',
        message: `Option ${i} ("${label}") explanation only says "${explanation}" without saying why`,
        filePath,
        line: baseLine,
        column: baseColumn,
        activityIndex,
        scope: 'activity',
      });
    } else if (explanation.length < CONFIG.shortExplanationChars) {
      diagnostics.push({
        ruleId: 'explanation-too-short',
        severity: 'warning',
        message: `Option ${i} ("${label}") explanation is only ${explanation.length} chars (below ${CONFIG.shortExplanationChars})`,
        filePath,
        line: baseLine,
        column: baseColumn,
        activityIndex,
        scope: 'activity',
      });
    }
  }

  // In single-choice, first option is correct - check for isCorrect field (should not exist)
  for (let i = 0; i < options.length; i++) {
    const opt = options[i] as Record<string, unknown>;
    if ('isCorrect' in opt) {
      diagnostics.push({
        ruleId: 'single-choice-has-is-correct',
        severity: 'error',
        message: `Single-choice options must not have "isCorrect" field (first option is implicitly correct). Found on option ${i}`,
        filePath,
        line: baseLine,
        column: baseColumn,
        activityIndex,
        scope: 'activity',
      });
      break;
    }
  }

  // Longest option detection (first option is correct)
  checkLongestOption(
    options.map(o => ({ label: o.label, isCorrect: false })),
    0,
    activityIndex,
    filePath,
    baseLine,
    baseColumn,
    diagnostics,
  );

  // Meta question patterns
  if (question && CONFIG.metaPatterns.some(p => p.test(question))) {
    diagnostics.push({
      ruleId: 'meta-question',
      severity: 'warning',
      message: 'Question appears to ask about the material/coverage rather than the topic itself',
      filePath,
      line: baseLine,
      column: baseColumn,
      activityIndex,
      scope: 'activity',
    });
  }

  // Refers to material
  if (
    question &&
    /seg[uú]n\s+el\s+material|en\s+el\s+material|las\s+notas|el\s+material\s+dice/i.test(question)
  ) {
    diagnostics.push({
      ruleId: 'refers-to-material',
      severity: 'warning',
      message:
        'Question is phrased relative to the source material ("según el material", "en las notas", etc.)',
      filePath,
      line: baseLine,
      column: baseColumn,
      activityIndex,
      scope: 'activity',
    });
  }

  // Example-dependent
  if (question && /en\s+el\s+ejemplo\s+de/i.test(question)) {
    diagnostics.push({
      ruleId: 'example-dependent-question',
      severity: 'warning',
      message: 'Question depends on a concrete example from the material',
      filePath,
      line: baseLine,
      column: baseColumn,
      activityIndex,
      scope: 'activity',
    });
  }

  // Language check
  if (question && !isSpanish(question)) {
    diagnostics.push({
      ruleId: 'not-in-spanish',
      severity: 'warning',
      message: 'Question appears to be in English (allowed only if the material itself is English)',
      filePath,
      line: baseLine,
      column: baseColumn,
      activityIndex,
      scope: 'activity',
    });
  }
}

function lintReorder(
  activity: ReorderActivity & { is: 'reorder' },
  activityIndex: number,
  filePath: string,
  baseLine: number,
  baseColumn: number,
  diagnostics: Array<Diagnostic>,
): void {
  const { title, elements } = activity;

  if (!title || !title.trim()) {
    diagnostics.push({
      ruleId: 'empty-text',
      severity: 'error',
      message: 'Title must be a non-empty string',
      filePath,
      line: baseLine,
      column: baseColumn,
      activityIndex,
      scope: 'activity',
    });
  }

  if (elements.length < 2) {
    diagnostics.push({
      ruleId: 'too-few-elements',
      severity: 'error',
      message: 'Reorder activity needs at least two elements',
      filePath,
      line: baseLine,
      column: baseColumn,
      activityIndex,
      scope: 'activity',
    });
  }

  const seen = new Set<string>();
  for (const el of elements) {
    if (seen.has(el)) {
      diagnostics.push({
        ruleId: 'duplicate-element',
        severity: 'error',
        message: `Duplicate element "${el}" in reorder activity`,
        filePath,
        line: baseLine,
        column: baseColumn,
        activityIndex,
        scope: 'activity',
      });
    }
    seen.add(el);
  }
}

function lintRelate(
  activity: RelateActivity & { is: 'relate' },
  activityIndex: number,
  filePath: string,
  baseLine: number,
  baseColumn: number,
  diagnostics: Array<Diagnostic>,
): void {
  const { title, related } = activity;

  if (!title || !title.trim()) {
    diagnostics.push({
      ruleId: 'empty-text',
      severity: 'error',
      message: 'Title must be a non-empty string',
      filePath,
      line: baseLine,
      column: baseColumn,
      activityIndex,
      scope: 'activity',
    });
  }

  const pairs = Object.entries(related);
  if (pairs.length < 2) {
    diagnostics.push({
      ruleId: 'too-few-pairs',
      severity: 'error',
      message: 'Relate activity needs at least two pairs',
      filePath,
      line: baseLine,
      column: baseColumn,
      activityIndex,
      scope: 'activity',
    });
  }

  for (const [key, value] of pairs) {
    if (!key || !key.trim()) {
      diagnostics.push({
        ruleId: 'empty-related-value',
        severity: 'error',
        message: 'Relate activity has an empty key',
        filePath,
        line: baseLine,
        column: baseColumn,
        activityIndex,
        scope: 'activity',
      });
    }
    if (!value || !value.trim()) {
      diagnostics.push({
        ruleId: 'empty-related-value',
        severity: 'error',
        message: `Relate activity has an empty value for key "${key}"`,
        filePath,
        line: baseLine,
        column: baseColumn,
        activityIndex,
        scope: 'activity',
      });
    }
  }
}

function lintCompleteWords(
  activity: CompleteWordsActivity & { is: 'complete-words' },
  activityIndex: number,
  filePath: string,
  baseLine: number,
  baseColumn: number,
  diagnostics: Array<Diagnostic>,
): void {
  const { parts } = activity;

  if (parts.length === 0) {
    diagnostics.push({
      ruleId: 'no-blank',
      severity: 'error',
      message: 'Complete-words activity must have at least one part',
      filePath,
      line: baseLine,
      column: baseColumn,
      activityIndex,
      scope: 'activity',
    });
    return;
  }

  const blanks = parts.filter(p => p.isBlank);
  if (blanks.length === 0) {
    diagnostics.push({
      ruleId: 'no-blank',
      severity: 'error',
      message: 'Complete-words activity needs at least one blank part (isBlank: true)',
      filePath,
      line: baseLine,
      column: baseColumn,
      activityIndex,
      scope: 'activity',
    });
  }

  for (const blank of blanks) {
    const label = blank.label?.trim() || '';
    if (!label) {
      diagnostics.push({
        ruleId: 'empty-blank',
        severity: 'error',
        message: 'Blank part must have a non-empty label (the answer to type)',
        filePath,
        line: baseLine,
        column: baseColumn,
        activityIndex,
        scope: 'activity',
      });
    } else {
      const words = label.split(/\s+/).filter(w => w.length > 0);
      if (words.length > CONFIG.maxBlankWords) {
        diagnostics.push({
          ruleId: 'blank-too-long',
          severity: 'warning',
          message: `Blank has ${words.length} words ("${label}"), maximum is ${CONFIG.maxBlankWords}`,
          filePath,
          line: baseLine,
          column: baseColumn,
          activityIndex,
          scope: 'activity',
        });
      }

      // Check if blank is a filler word
      if (words.length > 0) {
        const firstWord = words[0]!.toLowerCase().replaceAll(/[.,;:!?]/g, '');
        if (CONFIG.fillerWords.has(firstWord)) {
          diagnostics.push({
            ruleId: 'blank-not-essential',
            severity: 'warning',
            message: `Blank appears to be a filler word ("${label}"), not essential to the definition`,
            filePath,
            line: baseLine,
            column: baseColumn,
            activityIndex,
            scope: 'activity',
          });
        }
      }
    }
  }

  // Check for quote-like content
  const fullText = parts.map(p => p.label).join('');
  if (
    /"|'|«|»|“|”|‘|’/.test(fullText) ||
    /\b(dice|dijo|escribe|escribió|cita|citó)\b/i.test(fullText)
  ) {
    diagnostics.push({
      ruleId: 'quote-in-complete-words',
      severity: 'warning',
      message:
        'Complete-words text looks like a quote (quotation marks or attribution verbs), but this activity is for definitions',
      filePath,
      line: baseLine,
      column: baseColumn,
      activityIndex,
      scope: 'activity',
    });
  }
}

function lintCard(
  activity: CardActivity & { is: 'card' },
  activityIndex: number,
  filePath: string,
  baseLine: number,
  baseColumn: number,
  diagnostics: Array<Diagnostic>,
): void {
  const { front, back } = activity;

  if (!front || !front.trim()) {
    diagnostics.push({
      ruleId: 'empty-card-side',
      severity: 'error',
      message: 'Card front must be a non-empty string',
      filePath,
      line: baseLine,
      column: baseColumn,
      activityIndex,
      scope: 'activity',
    });
  }

  if (!back || !back.trim()) {
    diagnostics.push({
      ruleId: 'empty-card-side',
      severity: 'error',
      message: 'Card back must be a non-empty string',
      filePath,
      line: baseLine,
      column: baseColumn,
      activityIndex,
      scope: 'activity',
    });
  }
}

// ============================================================================
// Activity dispatcher
// ============================================================================

function lintActivity(
  activity: Activity,
  activityIndex: number,
  filePath: string,
  baseLine: number,
  baseColumn: number,
  rawText: string,
  activityStartOffset: number,
  diagnostics: Array<Diagnostic>,
): void {
  // Unknown activity type
  const validTypes = [
    'multiple-choice',
    'single-choice',
    'reorder',
    'relate',
    'complete-words',
    'card',
  ];
  if (!validTypes.includes(activity.is)) {
    diagnostics.push({
      ruleId: 'unknown-activity-type',
      severity: 'error',
      message: `Unknown activity type "${activity.is}". Must be one of: ${validTypes.join(', ')}`,
      filePath,
      line: baseLine,
      column: baseColumn,
      activityIndex,
      scope: 'activity',
    });
    return;
  }

  // Type-specific validation
  switch (activity.is) {
    case 'multiple-choice': {
      lintMultipleChoice(
        activity,
        activityIndex,
        filePath,
        baseLine,
        baseColumn,
        rawText,
        activityStartOffset,
        diagnostics,
      );
      break;
    }
    case 'single-choice': {
      lintSingleChoice(
        activity,
        activityIndex,
        filePath,
        baseLine,
        baseColumn,
        rawText,
        activityStartOffset,
        diagnostics,
      );
      break;
    }
    case 'reorder': {
      lintReorder(activity, activityIndex, filePath, baseLine, baseColumn, diagnostics);
      break;
    }
    case 'relate': {
      lintRelate(activity, activityIndex, filePath, baseLine, baseColumn, diagnostics);
      break;
    }
    case 'complete-words': {
      lintCompleteWords(activity, activityIndex, filePath, baseLine, baseColumn, diagnostics);
      break;
    }
    case 'card': {
      lintCard(activity, activityIndex, filePath, baseLine, baseColumn, diagnostics);
      break;
    }
  }
}

// Topic-level checks
function lintTopicLevel(
  activities: Array<Activity>,
  filePath: string,
  diagnostics: Array<Diagnostic>,
): void {
  // Duplicate activity
  const activityKeys = new Map<string, number>();
  for (let i = 0; i < activities.length; i++) {
    const a = activities[i]!;
    const key = JSON.stringify(a);
    if (activityKeys.has(key)) {
      diagnostics.push({
        ruleId: 'duplicate-activity',
        severity: 'error',
        message: `Duplicate activity (same type, text and options) at index ${i} (first at index ${activityKeys.get(key)})`,
        filePath,
        line: 1,
        column: 1,
        activityIndex: i,
        scope: 'topic',
      });
    } else {
      activityKeys.set(key, i);
    }
  }

  // Repeated questions
  const questionMap = new Map<string, Array<number>>();
  for (let i = 0; i < activities.length; i++) {
    const a = activities[i]!;
    if (a.is === 'multiple-choice' || a.is === 'single-choice') {
      const norm = normalizeQuestion(a.question);
      if (!questionMap.has(norm)) questionMap.set(norm, []);
      questionMap.get(norm)!.push(i);
    }
  }

  for (const [_norm, indices] of questionMap) {
    if (indices.length > 1) {
      for (const idx of indices.slice(1)) {
        diagnostics.push({
          ruleId: 'repeated-question',
          severity: 'warning',
          message: `Same question text appears at activity index ${idx} (first at ${indices[0]})`,
          filePath,
          line: 1,
          column: 1,
          activityIndex: idx,
          scope: 'topic',
        });
      }
    }
  }

  // Similar questions (Jaccard)
  const choiceActivities = activities.filter(
    a => a.is === 'multiple-choice' || a.is === 'single-choice',
  );
  for (let i = 0; i < choiceActivities.length; i++) {
    for (let j = i + 1; j < choiceActivities.length; j++) {
      const tokens1 = tokenize(choiceActivities[i]!.question);
      const tokens2 = tokenize(choiceActivities[j]!.question);
      const sim = jaccardSimilarity(tokens1, tokens2);
      if (sim >= CONFIG.similarQuestionJaccard) {
        diagnostics.push({
          ruleId: 'similar-question',
          severity: 'warning',
          message: `Questions at indices ${activities.indexOf(choiceActivities[i]!)} and ${activities.indexOf(choiceActivities[j]!)} are very similar (Jaccard ${sim.toFixed(2)})`,
          filePath,
          line: 1,
          column: 1,
          activityIndex: activities.indexOf(choiceActivities[j]!),
          scope: 'topic',
        });
      }
    }
  }

  // Topic too small
  if (activities.length < CONFIG.minTopicActivities) {
    diagnostics.push({
      ruleId: 'topic-too-small',
      severity: 'warning',
      message: `Topic has only ${activities.length} activities (minimum ${CONFIG.minTopicActivities} for exhaustive coverage)`,
      filePath,
      line: 1,
      column: 1,
      scope: 'topic',
    });
  }

  // Missing true/false (two-option single-choice)
  const choiceActivitiesCount = activities.filter(
    a => a.is === 'multiple-choice' || a.is === 'single-choice',
  ).length;
  const hasTrueFalse = activities.some(a => a.is === 'single-choice' && a.options.length === 2);
  if (choiceActivitiesCount >= CONFIG.minChoiceActivitiesForTrueFalse && !hasTrueFalse) {
    diagnostics.push({
      ruleId: 'missing-true-false',
      severity: 'warning',
      message: `Topic has ${choiceActivitiesCount} choice activities but no two-option single-choice (true/false simulation)`,
      filePath,
      line: 1,
      column: 1,
      scope: 'topic',
    });
  }

  // Uniform correct count
  const multiChoice = activities.filter(a => a.is === 'multiple-choice');
  if (multiChoice.length > 1) {
    const correctCounts = multiChoice.map(a => a.options.filter(o => o.isCorrect).length);
    const allSame = correctCounts.every(c => c === correctCounts[0]);
    if (allSame) {
      diagnostics.push({
        ruleId: 'uniform-correct-count',
        severity: 'warning',
        message: `All ${multiChoice.length} multiple-choice activities have exactly ${correctCounts[0]} correct option(s)`,
        filePath,
        line: 1,
        column: 1,
        scope: 'topic',
      });
    }
  }

  // Uniform option count
  const allChoice = activities.filter(a => a.is === 'multiple-choice' || a.is === 'single-choice');
  if (allChoice.length > 1) {
    const optionCounts = allChoice.map(a => a.options.length);
    const allSame = optionCounts.every(c => c === optionCounts[0]);
    if (allSame) {
      diagnostics.push({
        ruleId: 'uniform-option-count',
        severity: 'warning',
        message: `All ${allChoice.length} choice activities have exactly ${optionCounts[0]} options`,
        filePath,
        line: 1,
        column: 1,
        scope: 'topic',
      });
    }
  }

  // Missing reorder or relate
  const hasReorder = activities.some(a => a.is === 'reorder');
  const hasRelate = activities.some(a => a.is === 'relate');
  if (activities.length >= CONFIG.minActivitiesForReorderRelate && !hasReorder && !hasRelate) {
    diagnostics.push({
      ruleId: 'missing-reorder-or-relate',
      severity: 'warning',
      message: `Topic has ${activities.length} activities but no reorder or relate activity`,
      filePath,
      line: 1,
      column: 1,
      scope: 'topic',
    });
  }

  // Longest is always correct (topic level)
  lintLongestAlwaysCorrect(activities, filePath, diagnostics);
}

// ============================================================================
// File linting
// ============================================================================

function lintTopicFile(filePath: string, rawText: string): TopicDiagnostics {
  const diagnostics: Array<Diagnostic> = [];

  // Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    diagnostics.push({
      ruleId: 'invalid-json',
      severity: 'error',
      message: `Invalid JSON: ${message}`,
      filePath,
      line: 1,
      column: 1,
      scope: 'file',
    });
    return { filePath, activities: [], diagnostics, rawText };
  }

  // Check top-level is array
  if (!Array.isArray(parsed)) {
    diagnostics.push({
      ruleId: 'not-an-array',
      severity: 'error',
      message: 'Top-level value must be an array of activities',
      filePath,
      line: 1,
      column: 1,
      scope: 'file',
    });
    return { filePath, activities: [], diagnostics, rawText };
  }

  // Empty topic
  if (parsed.length === 0) {
    diagnostics.push({
      ruleId: 'empty-topic',
      severity: 'error',
      message: 'Topic file contains no activities',
      filePath,
      line: 1,
      column: 1,
      scope: 'topic',
    });
    return { filePath, activities: [], diagnostics, rawText };
  }

  // Find activity offsets for line/column reporting
  const activityOffsets = findActivityOffsets(rawText);

  // Validate each activity
  const activities = parsed as Array<Activity>;
  for (let i = 0; i < activities.length; i++) {
    const activity = activities[i]!;
    const offset = activityOffsets[i] ?? { start: 0, end: 0 };
    const { line, column } = findLineColumn(rawText, offset.start);

    lintActivity(activity, i, filePath, line, column, rawText, offset.start, diagnostics);
  }

  // Topic-level checks (after all activities parsed)
  lintTopicLevel(activities, filePath, diagnostics);

  return { filePath, activities, diagnostics, rawText };
}

// Subject-level checks
function lintSubjectLevel(subjectDiagnostics: SubjectDiagnostics): Array<Diagnostic> {
  const diagnostics: Array<Diagnostic> = [];
  const { topics } = subjectDiagnostics;

  // Filename checks
  for (const topic of topics) {
    const fileName = basename(topic.filePath, '.json');
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(fileName)) {
      diagnostics.push({
        ruleId: 'filename-not-kebab-case',
        severity: 'warning',
        message: `Topic filename "${fileName}" is not kebab-case`,
        filePath: topic.filePath,
        line: 1,
        column: 1,
        scope: 'topic',
      });
    }
    if (CONFIG.placeholderFilenames.has(fileName.toLowerCase())) {
      diagnostics.push({
        ruleId: 'placeholder-filename',
        severity: 'warning',
        message: `Topic filename "${fileName}" appears to be a placeholder`,
        filePath: topic.filePath,
        line: 1,
        column: 1,
        scope: 'topic',
      });
    }
  }

  // Non-JSON files (handled at directory level)

  // Subject without topics (handled at directory level)

  // Duplicate questions across topics
  const questionToTopics = new Map<string, Array<{ topicPath: string; activityIndex: number }>>();
  for (const topic of topics) {
    for (let i = 0; i < topic.activities.length; i++) {
      const a = topic.activities[i]!;
      if (a.is === 'multiple-choice' || a.is === 'single-choice') {
        const norm = normalizeQuestion(a.question);
        if (!questionToTopics.has(norm)) questionToTopics.set(norm, []);
        questionToTopics.get(norm)!.push({ topicPath: topic.filePath, activityIndex: i });
      }
    }
  }

  for (const [_norm, locations] of questionToTopics) {
    if (locations.length > 1) {
      const first = locations[0]!;
      for (const loc of locations.slice(1)) {
        diagnostics.push({
          ruleId: 'duplicate-question-across-topics',
          severity: 'warning',
          message: `Same question appears in "${relative(dirname(first.topicPath), loc.topicPath)}" activity ${loc.activityIndex} (first in "${basename(first.topicPath)}" activity ${first.activityIndex})`,
          filePath: loc.topicPath,
          line: 1,
          column: 1,
          activityIndex: loc.activityIndex,
          scope: 'subject',
        });
      }
    }
  }

  return diagnostics;
}

// ============================================================================
// Directory linting
// ============================================================================

function lintContentDirectory(contentDir: string): Array<Diagnostic> {
  const allDiagnostics: Array<Diagnostic> = [];

  if (!existsSync(contentDir)) {
    process.stdout.write(
      `Content directory "${contentDir}" does not exist (content/ is gitignored, this is normal)\n`,
    );
    return allDiagnostics;
  }

  const subjects = readdirSync(contentDir).filter(name => {
    const fullPath = join(contentDir, name);
    return statSync(fullPath).isDirectory();
  });

  if (subjects.length === 0) {
    allDiagnostics.push({
      ruleId: 'subject-without-topics',
      severity: 'warning',
      message: 'Content directory exists but has no subject folders',
      filePath: contentDir,
      line: 1,
      column: 1,
      scope: 'subject',
    });
    return allDiagnostics;
  }

  const subjectDiagnostics: Array<SubjectDiagnostics> = [];

  for (const subject of subjects) {
    const subjectPath = join(contentDir, subject);
    const topicFiles = readdirSync(subjectPath)
      .filter(f => f.endsWith('.json'))
      .map(f => join(subjectPath, f));

    if (topicFiles.length === 0) {
      allDiagnostics.push({
        ruleId: 'subject-without-topics',
        severity: 'warning',
        message: `Subject "${subject}" has no topic files`,
        filePath: subjectPath,
        line: 1,
        column: 1,
        scope: 'subject',
      });
    }

    // Check for non-JSON files
    const allFiles = readdirSync(subjectPath);
    for (const f of allFiles) {
      if (!f.endsWith('.json')) {
        allDiagnostics.push({
          ruleId: 'non-json-file',
          severity: 'warning',
          message: `Non-JSON file "${f}" in subject "${subject}"`,
          filePath: join(subjectPath, f),
          line: 1,
          column: 1,
          scope: 'subject',
        });
      }
    }

    const topics: Array<TopicDiagnostics> = [];
    for (const topicFile of topicFiles) {
      const rawText = readFileSync(topicFile, 'utf8');
      const result = lintTopicFile(topicFile, rawText);
      topics.push(result);
      allDiagnostics.push(...result.diagnostics);
    }

    subjectDiagnostics.push({ subject, topics, diagnostics: [] });
  }

  // Subject-level checks
  for (const sd of subjectDiagnostics) {
    allDiagnostics.push(...lintSubjectLevel(sd));
  }

  // Unexpected file location (files directly in content/)
  const rootFiles = readdirSync(contentDir).filter(f => {
    const fullPath = join(contentDir, f);
    return statSync(fullPath).isFile();
  });
  for (const f of rootFiles) {
    allDiagnostics.push({
      ruleId: 'unexpected-file-location',
      severity: 'error',
      message: `File "${f}" is directly in content/ but should be in content/<subject>/<topic>.json`,
      filePath: join(contentDir, f),
      line: 1,
      column: 1,
      scope: 'file',
    });
  }

  return allDiagnostics;
}

// ============================================================================
// Output formatting
// ============================================================================

function formatDiagnostics(diagnostics: Array<Diagnostic>): string {
  if (diagnostics.length === 0) {
    return 'No issues found.';
  }

  // Sort by file, line, column
  const sorted = [...diagnostics].sort((a, b) => {
    const pathCompare = a.filePath.localeCompare(b.filePath);
    if (pathCompare !== 0) return pathCompare;
    if (a.line !== b.line) return a.line - b.line;
    return a.column - b.column;
  });

  const errors = sorted.filter(d => d.severity === 'error');
  const warnings = sorted.filter(d => d.severity === 'warning');

  let output = '';
  let currentFile = '';

  for (const d of sorted) {
    if (d.filePath !== currentFile) {
      currentFile = d.filePath;
      output += `\n${currentFile}:\n`;
    }

    const prefix = d.severity === 'error' ? '✗ ERROR' : '⚠ WARNING';
    const location =
      d.activityIndex !== undefined
        ? ` (activity ${d.activityIndex}, line ${d.line}, col ${d.column})`
        : ` (line ${d.line}, col ${d.column})`;
    output += `  [${d.ruleId}] ${prefix}${location}: ${d.message}\n`;
  }

  output += `\nSummary: ${errors.length} error(s), ${warnings.length} warning(s)\n`;
  return output;
}

function formatDiagnosticsJson(diagnostics: Array<Diagnostic>): string {
  return JSON.stringify(diagnostics, null, 2);
}

// ============================================================================
// CLI
// ============================================================================

function runCli(argv: Array<string>): number {
  let contentDir = 'content';
  let jsonOutput = false;
  let strict = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dir' && i + 1 < argv.length) {
      contentDir = argv[++i]!;
    } else if (arg === '--json') {
      jsonOutput = true;
    } else if (arg === '--strict') {
      strict = true;
    } else if (arg === '--help' || arg === '-h') {
      process.stdout.write('Usage: node scripts/linter.ts [--dir <path>] [--json] [--strict]\n');
      process.stdout.write('  --dir <path>   Content directory (default: content)\n');
      process.stdout.write('  --json         Output machine-readable JSON\n');
      process.stdout.write('  --strict       Treat warnings as errors (exit code 1)\n');
      return 0;
    }
  }

  const diagnostics = lintContentDirectory(contentDir);

  if (jsonOutput) {
    process.stdout.write(`${formatDiagnosticsJson(diagnostics)}\n`);
  } else {
    process.stdout.write(formatDiagnostics(diagnostics));
  }

  const hasErrors = diagnostics.some(d => d.severity === 'error');
  const hasWarnings = diagnostics.some(d => d.severity === 'warning');

  if (hasErrors || (strict && hasWarnings)) {
    return 1;
  }
  return 0;
}

// ============================================================================
// Main entry point
// ============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = runCli(process.argv.slice(2));
}

// Exports for testing
export {
  lintTopicFile,
  lintContentDirectory,
  formatDiagnostics,
  formatDiagnosticsJson,
  runCli,
  CONFIG,
  type Diagnostic,
  type Severity,
  type Activity,
  type TopicDiagnostics,
  type SubjectDiagnostics,
};
