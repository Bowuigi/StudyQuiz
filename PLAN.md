# StudyQuiz Feature Plan

## Final Goal

Build a study quiz application with six question types stored as JSON content collections. Users can filter by subject, topic, and question type, practice questions one at a time with immediate feedback, view all questions in an exploration mode, and see session statistics with progress bars and tables.

## Relevant Context

- **Framework**: Astro 5 with TypeScript, TailwindCSS 4, DaisyUI 5
- **Content**: `src/content/quiz/{subject}/{topic}.json` — per-subject folders, per-topic JSON files
- **Quiz types** (discriminated union with `is` field):
  - `card`: `{front, back}`
  - `true_false`: `{statement, isTrue, explanation}`
  - `multiple_choice`: `{question, options: [{answer, isCorrect, explanation}...]}` — multiple correct answers allowed
  - `complete_words`: `{textWithBlanks: string[], correctWords: string[], explanation}`
  - `reorder`: `{correctOrder: string[], explanation}`
  - `relate`: `{relations: Record<string,string>, explanation}`
- **Filters**: Multi-select checkboxes for subject, topic, quiz type; shuffled by default
- **Modes**: Interactive practice (client island), Exploration (static page with answers visible)
- **Statistics**: Per-session only, client-side localStorage. Metrics: correct/incorrect per type, time per question/type. Visualizations: progress bars and tables.
- **Validation**: Zod schemas, Astro Content Collections with `glob` loader
- **Hydration**: Quiz and Statistics = `client:visible` islands. Exploration = static.

## Methodology

Follow ATDD (Acceptance Test-Driven Development) for each phase:

1. Write acceptance tests (Vitest for logic, manual for UI)
2. Implement the feature
3. Run tests
4. Fix failures
5. User reviews and commits

Each phase assumes previous phases complete. Execute one phase per session. Use `/tmp/pi-experiments/` for throwaway experiments.

## Plan Phases

### Phase 1: Content Collection & Types

**Goal of Phase 1**: Define Zod schemas, TypeScript types, and Astro content collection for quiz data.

**Description of Phase 1**:
- Create `src/content/config.ts` with `defineCollection` using `glob` loader for `quiz/**/*.json`
- Define Zod schemas for each quiz type with discriminated union
- Export TypeScript types from schemas using `z.infer`
- Create sample data: `src/content/quiz/sample/basics.json` with 2-3 questions per type
- Verify content loads with `npx astro check`

**Acceptance Criteria of Phase 1**:

*agent-tested*:
- `npx astro check` passes with no type errors
- `npm run lint` passes with no errors
- Content collection loads sample data correctly
- Each quiz type validates against its schema (invalid data throws)

*test-in-code-tested*:
- Vitest unit tests for each Zod schema: valid data passes, invalid data fails with expected errors
- Type inference test: discriminated union narrows correctly on `is` field

---

### Phase 2: Quiz Type Components

**Goal of Phase 2**: Build reusable Astro components for rendering each quiz type in both interactive and exploration modes.

**Description of Phase 2**:
- Create `src/components/quiz/` folder
- Build one component per quiz type: `Card.astro`, `TrueFalse.astro`, `MultipleChoice.astro`, `CompleteWords.astro`, `Reorder.astro`, `Relate.astro`
- Each component accepts props: `question` (typed), `mode: 'interactive' | 'exploration'`, `onAnswer?: (correct: boolean) => void`
- Interactive mode: user input, immediate feedback, show all explanations after answer
- Exploration mode: static display with answers and explanations visible
- Use DaisyUI components for styling (cards, buttons, inputs, selects, badges)
- Export a `QuizElement` component that switches on `question.is` and renders the right type

**Acceptance Criteria of Phase 2**:

*agent-tested*:
- Each component renders without errors in both modes
- Interactive mode calls `onAnswer` with correct boolean
- Exploration mode shows all answers and explanations

*test-in-code-tested*:
- Vitest component tests (using `@astrojs/test` or similar): snapshot or DOM assertions for each type in both modes
- Props type safety: passing wrong props to a component fails type check

---

### Phase 3: Filtering & Question Selection Logic

**Goal of Phase 3**: Implement client-side filtering, shuffling, and question selection logic.

**Description of Phase 3**:
- Create `src/lib/quiz.ts` with pure functions:
  - `filterQuestions(questions, filters)` — filters by subject, topic, type (multi-select)
  - `shuffleQuestions(questions)` — Fisher-Yates shuffle, deterministic seed optional
  - `getNextQuestion(index, questions)` — returns current question or null
- Filters: `{subjects: string[], topics: string[], types: string[]}` — empty array = all
- All functions pure, no side effects, fully testable
- Export types for filters and filter options (derived from content)

**Acceptance Criteria of Phase 3**:

*agent-tested*:
- Functions work in browser console with sample data

*test-in-code-tested*:
- Vitest unit tests: filter by each field, combined filters, empty filters return all, shuffle changes order, getNextQuestion returns correct item and null at end
- Edge cases: empty input, unknown filter values

---

### Phase 4: Practice Page (Interactive Island)

**Goal of Phase 4**: Build the main practice page as a client island with question navigation, answer submission, and session tracking.

**Description of Phase 4**:
- Create `src/pages/quiz/practice.astro` with `client:visible` island
- Island component (`PracticeIsland.tsx` or `.astro` with `<script>`):
  - Load all questions from content collection (passed as prop or fetched)
  - Filter UI: multi-select checkboxes for subject, topic, type (DaisyUI checkboxes)
  - Apply filters, shuffle, show question 1 of N
  - Render `QuizElement` in interactive mode
  - On answer: record result (correct/incorrect, time spent, question type), show explanations, enable "Next"
  - Track session stats in localStorage: `{questionId, type, correct, timeMs, timestamp}[]`
  - Progress bar: current/total, percent complete
  - End screen: summary with link to statistics page
- Use Preact or vanilla TS for island (Astro supports both, `npx astro add preact` installs Preact)

**Acceptance Criteria of Phase 4**:

*agent-tested*:
- Page loads, filters work, questions shuffle
- Answer submission records to localStorage
- Navigation works: next, previous (if implemented), end screen shows

*test-in-code-tested*:
- Vitest tests for island logic (extracted to pure functions): filter application, answer recording, progress calculation
- Playwright or manual test checklist for full flow

---

### Phase 5: Exploration Page (Static)

**Goal of Phase 5**: Build a static page that displays all questions for a subject/topic with answers visible.

**Description of Phase 5**:
- Create `src/pages/quiz/explore/[subject]/[topic].astro` (dynamic route)
- Use `getStaticPaths` to generate pages for each topic
- Render all questions for that topic using `QuizElement` in exploration mode
- Group by quiz type with headings
- No client-side JS needed (static HTML)
- Link from practice page and/or index

**Acceptance Criteria of Phase 5**:

*agent-tested*:
- `npx astro build` generates correct pages for sample data
- Pages render all questions with answers and explanations visible
- No hydration scripts loaded on these pages

*test-in-code-tested*:
- Vitest test: `getStaticPaths` returns expected paths from content collection
- Build output inspection: verify HTML contains expected content

---

### Phase 6: Statistics Page (Island)

**Goal of Phase 6**: Build a statistics page that reads session data from localStorage and displays progress bars and tables.

**Description of Phase 6**:
- Create `src/pages/quiz/stats.astro` with `client:visible` island
- Island component (`StatsIsland.tsx`):
  - Read session data from localStorage
  - Compute aggregates:
    - Per type: total, correct, accuracy %, avg time
    - Overall: total, correct, accuracy %, avg time
    - "Easier to understand": rank types by accuracy * speed (weighted)
  - Display:
    - Summary cards (DaisyUI stats)
    - Table per type with columns: Type, Attempted, Correct, Accuracy, Avg Time
    - Progress bars for accuracy per type
    - "Easiest type" highlight
  - Clear session button (clears localStorage)
- No server persistence

**Acceptance Criteria of Phase 6**:

*agent-tested*:
- Page reads localStorage data written by practice page
- Calculations correct for sample data
- Clear button works

*test-in-code-tested*:
- Vitest unit tests for aggregation functions: empty data, single type, multiple types, accuracy calculation, time average, ranking logic
- Component test: renders correct values for given input

---

### Phase 7: Navigation & Polish

**Goal of Phase 7**: Add navigation between pages, index page, and visual polish.

**Description of Phase 7**:
- Update `src/pages/index.astro`: landing page with links to Practice, Exploration (subject list), Statistics
- Add navigation header (DaisyUI navbar) to all quiz pages
- Consistent styling: DaisyUI theme, responsive layout
- Loading states for content collection
- Error boundaries for invalid content
- README update with usage instructions

**Acceptance Criteria of Phase 7**:

*agent-tested*:
- All pages link correctly
- Navbar present on all quiz pages
- Responsive on mobile and desktop
- `npm run build` succeeds
- `npm run lint` and `npm run fmt` pass

*test-in-code-tested*:
- Build passes with no errors
- Lint and format pass
- Manual smoke test: navigate index → practice → stats → explore