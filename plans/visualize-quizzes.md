# Plan: Quiz Player and Statistics

## Final goal

Build a Preact application that reads quiz data and lets the user do quizzes and examine results.

The data lives in `content/<subject>/<topic>.json`. Each file is an array of `QuizActivity`, as defined in `src/types.d.ts`. The subject is the folder name. The topic is the file name.

The application has two sections:

- **Intentar** (Try): choose a subject, choose topics and activity types, do a quiz, read the summary.
- **Estadísticas** (Statistics): see success per topic and per activity type.

The interface text is Spanish. The stack is Preact, TailwindCSS, daisyUI, and strict TypeScript.

## Relevant context

### Data and domain

- `src/types.d.ts` defines the six activity types: `multiple-choice`, `single-choice`, `reorder`, `relate`, `complete-words`, and `card`.
- The file declares global types. Modules use these types.
- For `single-choice`, the first option is correct.
- For `multiple-choice`, every option with `isCorrect: true` is correct.
- For `complete-words`, a part with `isBlank: true` stores its answer in `label`. The UI hides this label and shows a text input. Non-blank parts show their label as text.
- The JSON files have no validation. Cast the parsed data to the activity type.
- Only `single-choice`, `multiple-choice`, and `card` have explanation text. For the other types, show a generated correct-answer panel.

### Decisions already made

- Load content with `import.meta.glob('../content/**/*.json', { eager: true, import: 'default' })`.
- Use a local state machine in `App`. Do not add a router.
- Sample activities at random from the selected topics and types. Cap the count at the number of available activities.
- Shuffle activity order and option order. Shuffle reorder elements for display and compare against the original correct order.
- Timer starts when the first activity opens and stops when the user confirms the last activity.
- Single choice confirms on option click. Multiple choice toggles options, then the user clicks `Confirmar`.
- Reorder uses native HTML5 drag and drop. Relate uses one dropdown per left-side key. Complete words uses text inputs.
- Cards show the front, then flip to the back, then the user clicks `Lo sé` or `Me olvidé`.
- After confirmation, show explanations. Change `Confirmar` to `Siguiente`.
- Store statistics in IndexedDB with a small native promise wrapper.
- Record one result after each confirmation. An abandoned quiz keeps its answered activities.
- Statistics group topics under subject headings and show progress bars. A reset button has a confirmation step.
- Add sample content files so the app is runnable now.

### Repository facts

- The project is almost empty. `src/index.tsx` renders `Hello world!`.
- There is no `vite.config.ts`. The current build does not process Tailwind classes and prints `Unknown at rule` warnings. Phase 1 adds the config.
- The test runner is Vitest. `@testing-library/preact` and `happy-dom` are installed.
- Tests need the `happy-dom` environment. Configure this in `vite.config.ts`.
- Storage tests need `fake-indexeddb`. Add it as a dev dependency in Phase 4.
- Lint and format rules: kebab-case file names, function declarations where possible, maximum 350 lines per file, strict TypeScript.
- Commands: `npm run lint`, `npm run fmt`, `npm run test`, `npm run build`.
- Load the `daisyui` skill before writing TSX/JSX.
- You can run experiments in `/tmp/opencode/` (OpenCode) or `/tmp/pi-experiments/` (Pi). If an experiment must run in this project, remove its files after the experiment.
- Do not use em dashes in any file or message.

### Useful target paths

- `src/content.ts`: content discovery.
- `src/quiz.ts`: sampling, grading, and answer descriptions.
- `src/storage.ts`: IndexedDB and aggregation.
- `src/components/`: views and activity components.
- `src/app.tsx`: state machine.
- `content/<subject>/<topic>.json`: sample data.

## Methodology

Follow these steps for the whole plan.

1. Read this plan and the context that you need. Load the `daisyui` skill before you write JSX.
2. Work on one phase only. Assume that all previous phases are completed. Do not start later phases.
3. Write the acceptance tests for the phase first. Derive one test from each test-in-code criterion.
4. Run the tests and make sure that they fail for the expected reason.
5. Implement the smallest change that makes the tests pass. Repeat until every criterion is done.
6. Run `npm run lint`, `npm run fmt`, and `npm run test`. All must pass.
7. Run the agent-tested criteria as experiments in `/tmp/opencode/` or in the browser.
8. Stop. Report what changed and what you verified. The user reviews the changes and commits them.
9. Do not commit. Do not start the next phase.

Use the acceptance criteria of a phase as the definition of done. A phase is not done when the code only compiles. Every criterion must have evidence.

## Plan phases

### Phase 1: Project foundation and test setup

**Goal of phase 1**: The project builds with Tailwind and daisyUI and can run component tests.

**Description of phase 1**:

Add `vite.config.ts`. Use `defineConfig` with the Preact plugin and the Tailwind Vite plugin. Add the Vitest configuration with `environment: 'happy-dom'` and a setup file that calls `cleanup` after each test.

Keep the current app minimal, but replace the placeholder text with a small daisyUI-styled shell. Do not build navigation yet.

Add a test for the shell.

**Acceptance criteria of phase 1**:

Agent-tested:

- `npm run build` completes and prints no `Unknown at rule` warning.
- The dev server starts and the page shows the styled shell.

Test in code:

- A component test renders the app shell with `@testing-library/preact`.
- The test setup cleans the DOM between tests.

### Phase 2: Content discovery and sample data

**Goal of phase 2**: The app can discover subjects and topics from JSON files and expose their activities.

**Description of phase 2**:

Create `src/content.ts`. Export a `Topic` type with `id`, `subject`, `name`, and `activities`. Export a `Subject` type with `name` and `topics`. Export `loadSubjects()`.

Use `import.meta.glob` as stated in the context. Derive the subject from the first path segment and the topic from the file name without the extension. Build the ID as `subject/topic`. Sort subjects and topics by name. Cast each default export to `Array<QuizActivity>`.

Add sample content files under `content/`. Use at least three subjects and two topics per subject. Cover all six activity types across the samples. Keep each file short.

Write tests against the real sample files.

**Acceptance criteria of phase 2**:

Agent-tested:

- A short experiment prints the discovered subjects, topics, and activity counts.

Test in code:

- The loader returns every sample subject and topic.
- Topic IDs use the `subject/topic` form.
- Subjects and topics are sorted.
- Every activity type appears at least once in the sample data.
- An empty content directory returns an empty list without an error.

### Phase 3: Quiz engine

**Goal of phase 3**: Pure functions build a quiz and grade every activity type.

**Description of phase 3**:

Create `src/quiz.ts`.

Define the input options for `buildQuiz`: selected topic IDs, selected activity types, and a count. Define a `QuizItem` that pairs an activity with its topic ID and topic name. Define an answer type for each activity. Define a `Grade` result with a boolean and a correct-answer description.

`buildQuiz` must filter activities by topic and type. It must cap the result at the available count. It must shuffle activity order and option order. It must accept an optional random function so tests are deterministic.

Grading rules:

- `single-choice`: the selected option index must be `0`.
- `multiple-choice`: the set of selected option indices must equal the set of correct option indices.
- `reorder`: the submitted order must equal the original element order.
- `relate`: every key must map to its correct value.
- `complete-words`: every blank input must equal its label after trim, case conversion, and accent removal.
- `card`: the boolean from `Lo sé` (good) or `Me olvidé` (bad).

Add a function that returns the correct-answer lines for `reorder`, `relate`, and `complete-words`. Add a function that returns the option explanations for the choice types and the back text for cards.

**Acceptance criteria of phase 3**:

Agent-tested:

- An experiment builds a quiz from the sample data and grades one activity of each type.

Test in code:

- `buildQuiz` filters by topic and by type.
- `buildQuiz` caps the count and never returns duplicates.
- Shuffling is deterministic with a fixed random function.
- Grading is correct for each activity type, including a wrong answer.
- `complete-words` ignores case, accents, and surrounding spaces.
- `reorder` grading uses the original order, not the shuffled display order.
- The correct-answer description contains no blank fields.

### Phase 4: Statistics storage

**Goal of phase 4**: Results persist in IndexedDB and the app can aggregate them per topic and per activity type.

**Description of phase 4**:

Create `src/storage.ts`. Use a native promise wrapper around IndexedDB. Do not add an IndexedDB library.

Use the database name `study-quiz` and one object store named `stats`. The key is the pair `topicId` and `type`. Each record stores `topicId`, `subject`, `topic`, `type`, `correct`, and `attempts`.

Add these functions:

- `recordResult(record)`: increment `attempts` and increment `correct` when the answer is right.
- `getStats()`: return every record.
- `resetStats()`: erase every record.
- `aggregate(records)`: return per-topic totals and per-type totals with success percentages.

Add `fake-indexeddb` as a dev dependency and load it in the storage test file.

**Acceptance criteria of phase 4**:

Agent-tested:

- An experiment writes a result, reads it back, and resets the store.

Test in code:

- A new record starts at one attempt and zero or one correct.
- A second result increments the same record.
- `aggregate` computes the correct percentage per topic and per type.
- `aggregate` returns zero percent for a record with zero attempts, without a division error.
- `resetStats` removes every record.

### Phase 5: App shell, home, and topic selection

**Goal of phase 5**: The user can navigate from the home view to topic selection and start a quiz.

**Description of phase 5**:

Create the state machine in `src/app.tsx`. The states are `home`, `topics`, `quiz`, `summary`, and `stats`. Keep the current subject and the current quiz in the state.

The home view shows the two sections `Intentar` and `Estadísticas`. Show the subject list under `Intentar`. For this phase, the `Estadísticas` entry can open a placeholder view.

The topic view shows the subject name and these controls:

- Topic checkboxes. All are checked by default.
- Activity type checkboxes. All are checked by default.
- A number input for the count, with a minimum of one.
- A `Comenzar` button.
- A back button.

Show the available count. When the requested count is larger, show a note and cap the count. Disable `Comenzar` when the user selects no topic or no type.

On `Comenzar`, build the quiz and move to the `quiz` state.

Use daisyUI components. Keep each file under 350 lines.

**Acceptance criteria of phase 5**:

Agent-tested:

- The user can run the app, choose a subject, change the selection, and start a quiz.

Test in code:

- The home view lists every sample subject.
- A click on a subject opens the topic view for that subject.
- All topic and type checkboxes start checked.
- `Comenzar` is disabled when no topic or no type is selected.
- `Comenzar` builds a quiz with the requested count, capped at the available count.
- An empty content directory shows an empty message.

### Phase 6: Quiz runner with choice and card activities

**Goal of phase 6**: The user can complete a quiz one activity at a time for the choice and card types.

**Description of phase 6**:

Create the quiz runner in `src/components/`. It receives the quiz items, an `onResult` callback, and an `onFinished` callback. It shows one activity at a time and a progress indicator such as `3 de 10`.

Single choice confirms when the user clicks an option. Multiple choice toggles options and confirms with `Confirmar`. Cards show the front and a `Mostrar respuesta` control. After the flip, show `Lo sé` and `Me olvidé`.

After confirmation:

- Disable every input for the activity.
- Show every option explanation, or the card back text.
- Change the button to `Siguiente`.
- Call `onResult` one time for the activity.

`Siguiente` opens the next activity. On the last activity, it calls `onFinished`.

Render a temporary message for the three activity types that this phase does not implement. Do not implement their interaction yet.

Do not wire storage or the summary in this phase. Use callbacks only.

**Acceptance criteria of phase 6**:

Agent-tested:

- The user completes a short quiz that contains only choice and card activities.

Test in code:

- A single choice answer confirms with one click and shows every explanation.
- A multiple choice answer needs `Confirmar` before it shows explanations.
- A correct and a wrong answer call `onResult` with the correct boolean.
- Inputs are disabled after confirmation.
- `Siguiente` advances the progress indicator.
- The last activity calls `onFinished` with one result per activity.
- A card shows the front, flips to the back, and grades with both buttons.

### Phase 7: Reorder, relate, and complete-words activities

**Goal of phase 7**: The user can complete the three remaining activity types.

**Description of phase 7**:

Add the three activity components and connect them to the runner.

Reorder shows the elements in a shuffled order. The user drags an element and drops it on another position. Use the native HTML5 drag events. The drop updates the visible order. `Confirmar` grades the order against the original correct order.

Relate shows one dropdown per key. Each dropdown contains every value from the related record. `Confirmar` grades every pair.

Complete words shows every non-blank part as text and every blank part as a text input. `Confirmar` grades every input with the normalized comparison.

After confirmation, show the correct-answer panel from the quiz engine. Then change the button to `Siguiente`.

**Acceptance criteria of phase 7**:

Agent-tested:

- The user completes a quiz with reorder, relate, and complete-words activities in a browser.

Test in code:

- A drag event sequence changes the reorder state.
- A correct and a wrong reorder order grade as expected.
- A relate dropdown change updates the answer and grades as expected.
- A complete-words answer with different case and accents grades as correct.
- Every type shows the correct-answer panel after confirmation.

### Phase 8: Summary and statistics

**Goal of phase 8**: The user sees the quiz summary and aggregate statistics from IndexedDB.

**Description of phase 8**:

Connect the runner to `recordResult` for each confirmed activity.

Start the timer when the first activity opens. Stop the timer when the user confirms the last activity. Store the start time in the app state.

The summary shows:

- The correct count and the wrong count.
- The total success percentage.
- The elapsed time as minutes and seconds.
- The list of wrong activities with the activity title or question, the user answer, the correct answer, and the explanations.
- A button to return to the home view.

Create the statistics view. Read the aggregated records when the view opens. Group topics under subject headings. For each topic, show the overall success percentage, the total attempts, and a daisyUI progress bar. Show the same values per activity type in a nested row or sub-list.

Add a `Reiniciar estadísticas` button with a daisyUI confirmation dialog. On confirmation, call `resetStats` and refresh the view.

Add a summary test and a statistics test. Use `fake-indexeddb` for the storage part.

**Acceptance criteria of phase 8**:

Agent-tested:

- The user completes a full quiz and reads the summary in a browser.
- The user reloads the page and the statistics are still present.
- The reset dialog erases the statistics.

Test in code:

- The summary shows the correct count, wrong count, percentage, and time.
- The summary lists every wrong activity with its user answer, correct answer, and explanation.
- The home button returns to the home view.
- Each confirmed activity updates the stored statistics.
- The statistics view groups topics by subject.
- The statistics view shows a progress bar per topic and per activity type.
- The reset confirmation erases the stored statistics and the view shows no data.
