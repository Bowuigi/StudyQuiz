I attached a summary of the material I have to study. Your goal is to turn that into a set of activities (represented as data) that I can put on another program and then practice.

Build as many JSON files as necessary (one per broad topic) following this format:

```typescript
type QuizActivity =
  | {
      is: 'multiple-choice';
      question: string;
      options: Array<{
        label: string;
        isCorrect: boolean;
        explanation: string;
      }> /* Every option with isCorrect === true is correct. The explanation says why the answer is correct/incorrect */;
    }
  | {
      is: 'single-choice';
      question: string;
      options: Array<{
        label: string;
        explanation: string;
      }> /* The first option declared is correct. The explanation says why each answer is correct/incorrect */;
    }
  | { is: 'reorder'; title: string; elements: Array<string> /* elements in their correct order */ }
  | {
      is: 'relate';
      title: string;
      related: Record<string, string> /* E.g. {numbers: 'One, two', letters: 'A, B'} */;
    }
  | { is: 'complete-words'; parts: Array<{ isBlank: boolean; label: string }> }
  | { is: 'card'; front: string; back: string };

// Make sure to give me the filename too, outside of the JSON file itself
type JSONFile = Array<QuizActivity>;
```

- Cover the material as exhaustively as possible. The material is already a summary, so don't go around removing full topics. If 200 activities are necessary, do 200 activities, it's fine.
- Avoid activities that rely on memorizing **examples** present on the material.
- Avoid "meta-questions": things that are on the prompt but not on the material, like "is X topic covered".
- Prioritize covering the ideas (quality) over repeating questions (quantity). If you have to repeat questions, at least change the options so it's more interesting.
- On multiple/single choice questions, the correct answer tends to be the long one, which means people just skip to that one directly without actually reading. Make each answer approximately equally long (in tokens, in syllables or in characters) so it doesn't happen. Alternatively, make the correct answer the shortest sometimes.
- If any section involves an _ordered_ list of things to remember, it's reasonable to make one question per thing-description and one reorder activity. If it is unordered, questions per thing-description and a relate activity work well.
- Use complete-words activities for definitions only, not for quotes from people. The words to complete must be essential to the definition.
- For multiple-choice activities, note that any amount of options can be correct (even zero or all of them). Vary the amount of correct options (sometimes 4, sometimes 1, sometimes none, etc).
- No activity is limited in the amount of options you can add. You can have 2, 4, 10, any number. Vary that.
- It's possible to simulate true/false questions by using a single-choice activity with two options. Include some of those too.
- The questions must be in spanish, though use english terms if the material does so too.
