//// Data layout

type MultipleChoiceActivity = {
  question: string;
  /**
   * Every option with isCorrect === true is correct. The explanation says why the answer is
   * correct/incorrect
   */
  options: Array<{ label: string; isCorrect: boolean; explanation: string }>;
};

/** Generalizes "pick one from A, B, C, ..." and "is this true?" */
type SingleChoiceActivity = {
  question: string;
  /** The first option declared is correct. The explanation says why the answer is correct/incorrect */
  options: Array<{ label: string; explanation: string }>;
};

type ReorderActivity = {
  title: string;
  /** Elements in their correct order */
  elements: Array<string>;
};

type RelateActivity = {
  title: string;
  /** E.g. {numbers: 'One, two', letters: 'A, B'} */
  related: Record<string, string>;
};

type CompleteWordsActivity = {
  parts: Array<{ isBlank: boolean; label: string }>;
};

type CardActivity = {
  front: string;
  back: string;
};

type QuizActivity =
  | ({ is: 'multiple-choice' } & MultipleChoiceActivity)
  | ({ is: 'single-choice' } & SingleChoiceActivity)
  | ({ is: 'reorder' } & ReorderActivity)
  | ({ is: 'relate' } & RelateActivity)
  | ({ is: 'complete-words' } & CompleteWordsActivity)
  | ({ is: 'card' } & CardActivity);
