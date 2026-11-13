# Plan: StudyQuiz interface improvements

## Final goal

Improve the StudyQuiz interface with these changes:

1. The home page shows the subjects as a grid of squares. Each square shows the subject title, the number of activities, and the number of topics. The page shows no total for all subjects.
2. The navbar shows the picked subject. It shows "¡Estudiemos!" when no subject is picked.
3. The topic view shows the number of activities for each topic and for each activity type.
4. Every graded activity shows "Respuesta Correcta" or "Respuesta Incorrecta" under its activity type caption. The separate feedback card at the bottom is gone.
5. The card activity looks like an actual study card. It is a rounded square with a shadow. It flips on click to show the other side. The "Lo sé" and "Me olvidé" buttons are centered under the card.
6. Clicking "Lo sé" or "Me olvidé" advances to the next activity. The user must not need to click "Siguiente" on this case.
7. The names of topics and subjects appear in title case. The rule removes `-` and `_` and keeps the uppercase letters that the name already has.
8. The complete-words activity shows a border for each part after confirming. An incorrect part shows the correct answer in a tooltip.
9. The choice activities color the radio and the checkbox inputs after confirming, keeping the other coloring intact.
10. The relate activity shows an outline per field after confirming. The correct answer appears under the left text.
11. The reorder activity shows the correct position of each answer after confirming. The number is big, bold, and colored.
12. The navbar has a theme selector with all 35 daisyUI themes. The choice is stored in localStorage.

The user asked for these changes to make the app clearer and easier to use.

## Relevant context

### Rules of this project

- The stack is Preact, strict TypeScript, TailwindCSS, daisyUI 5, Vitest, Oxlint, and Oxfmt.
- The interface text is Spanish. All non-user-directed docs (e.g. plans) and agent communications are in English.
- The dev server runs at `http://localhost:5173`. Use the browser MCP for the manual checks.
- Load the `daisyui` skill before writing any JSX.

### Current code map

| File | Role today |
| --- | --- |
| `src/app.tsx` | The view state machine. `AppHeader` renders the navbar with the "StudyQuiz" brand. |
| `src/app.css` | Imports Tailwind and the daisyUI plugin with no options. |
| `src/content.ts` | Loads the subjects and the topics from `content/<subject>/<topic>.json`. |
| `src/activity-types.ts` | The list of the six activity types with their Spanish labels. |
| `src/quiz.ts` | Builds the quiz, grades the answers, and returns the correct answer lines. The `normalize` function is private. |
| `src/answer-description.ts` | Builds the titles and the answer lines for the summary view. |
| `src/components/home-view.tsx` | The home page. The subjects are a vertical list of buttons. |
| `src/components/topic-view.tsx` | The topic page. It lists the topics and the activity types as checkboxes. |
| `src/components/quiz-runner.tsx` | Runs the quiz. It shows the progress badge and the topic name with the `capitalize` class. |
| `src/components/activity-stage.tsx` | Picks the stage component for the activity type. |
| `src/components/stage-actions.tsx` | Renders the "Confirmar" and "Siguiente" buttons. |
| `src/components/activity-feedback.tsx` | Renders the separate feedback card at the bottom of the generated activities. |
| `src/components/card-activity.tsx` | The card face. It shows the "Tarjeta" caption and the "Mostrar respuesta" button. |
| `src/components/card-stage.tsx` | The card logic. It shows the card and the "Siguiente" button. |
| `src/components/single-choice-activity.tsx` | The option cards. They change the border color after confirming. |
| `src/components/multiple-choice-activity.tsx` | The option cards. They change the border color after confirming. |
| `src/components/complete-words-activity.tsx` | The text inputs for the blanks. |
| `src/components/relate-activity.tsx` | One dropdown per key of the related record. |
| `src/components/reorder-activity.tsx` | The drag and drop list of the elements. |

### Decisions from the interview

- The status label goes under the small activity type caption. The caption sits above the question or the title.
- The cards do not show the status label. The card leaves the screen at once.
- The number next to a reorder answer is its position in the correct order. Example: the correct order is A B C D E and the user left A C D B E, so the screen shows 1, 3, 4, 2, 5. The number uses the success color when it matches the current position and the error color when it does not.
- A click on the card flips it. The "Mostrar respuesta" button is gone. The "Lo sé" and "Me olvidé" buttons sit centered under the card and they advance to the next activity.
- The title case rule replaces `-` and `_` with a space and uppercases the first letter of each word. The rest of each word stays as it is. Example: "data-mining-2" becomes "Data Mining 2" and "NASA" stays "NASA". The rule applies to topics and to subjects.
- The navbar shows the brand and the subject on the left. The theme selector sits on the right.
- The theme selector is a select box. It has the 35 daisyUI themes. It stores the choice in localStorage.
- The topic list shows the activities of that topic. The type list shows the activities of that type over the whole subject. The numbers do not change when the user changes the selection.

### daisyUI facts

- The CSS config uses `@plugin "daisyui";`. The default config only builds the `light` and the `dark` themes. Use `@plugin "daisyui" { themes: all; }` to build all 35 themes. The `light` theme stays the default and `dark` follows the system color scheme.
- The 35 theme names of daisyUI 5.7.50 are: abyss, acid, aqua, autumn, black, bumblebee, business, caramellatte, cmyk, coffee, corporate, cupcake, cyberpunk, dark, dim, dracula, emerald, fantasy, forest, garden, halloween, lemonade, light, lofi, luxury, night, nord, pastel, retro, silk, sunset, synthwave, valentine, winter, wireframe.
- The `.card` class sets `border-radius: var(--radius-box)`. The `card-border` class adds a border. The `card-sm` and the other size classes set the font sizes. The `.card` class does not set `overflow: hidden`.
- The radio takes one color class, for example `radio-success` or `radio-error`. The checkbox takes `checkbox-success` or `checkbox-error`. The input takes `input-success` or `input-error`.
- The tooltip wraps the element and takes the text in the `data-tip` attribute.
- The outline utilities of Tailwind work with the daisyUI colors, for example `outline-2 outline-success`.

The `daisyui` skill is authoritative. If this plan contradicts it, the skill-provided information wins.

### Risks

- The flip needs `perspective` on the card and `transform-style: preserve-3d` on the inner element. The two faces use `backface-visibility: hidden`. The front face sets the height and the back face sits on top of it. Check the result in the browser. If the rotation does not show, use a fade between the two faces instead.
- The runner keeps the results in a state variable. The card calls the result callback and the next callback in the same event. The runner must keep the results in a ref as well, or the last result is missing from the summary.

## Methodology

Follow these steps for the whole plan.

1. Read this plan and the files that the phase names. Load the `daisyui` skill before you write any JSX.
2. Work on one phase only. Assume that all the earlier phases are done. Do not start a later phase.
3. Write the acceptance tests for the phase first. Derive at least one test from each criterion in the "Test in code" list.
4. Run the tests. Make sure that they fail for the expected reason.
5. Write the smallest change that makes the tests pass. Repeat until every criterion of the phase has evidence.
6. Run `npm run lint`, `npm run fmt`, and `npm run test -- --run`. All of them must pass.
7. Run the criteria in the "Agent-tested" list in the browser at `http://localhost:5173`. Use the browser MCP for these checks.
8. Stop. Report what changed and what you checked.
9. Do not commit. Do not start the next phase.

The acceptance criteria of a phase are the definition of done.

## Plan phases

### Phase 1: Display names, subject grid, and navbar subject

**Goal of phase 1**: The home page shows the subjects as squares. The navbar shows the picked subject or "¡Estudiemos!".

**Description of phase 1**:

Add a new module `src/format.ts` with one function. The function takes a name and returns the display name. It replaces `-` and `_` with a space, it uppercases the first letter of each word, it keeps the rest of each word as it is, it removes the repeated spaces, and it trims the result. Add `src/format.test.ts` with the cases "data-mining-2" to "Data Mining 2", "bi_casos" to "Bi Casos", "NASA" to "NASA", and "ayd2-p2" to "Ayd2 P2".

Change `src/components/home-view.tsx`. Replace the vertical list of subject buttons with a grid. Use one column on a small screen, two columns on a medium screen, and three columns on a large screen. Each subject is a button with the daisyUI card classes, a shadow, and the `aspect-square` class. The body of the card shows the display name of the subject, the number of activities, and the number of topics. The number of activities is the sum of the activities of every topic of the subject. The number of topics is the number of topics of the subject. Write "1 actividad" and "1 tema" for the singular forms. Keep the "Intentar" card, its title, and its description. Put the grid inside the body of that card. The page shows no total for all subjects.

Change `src/app.tsx`. The `AppHeader` component takes the name of the subject or `null`. The start of the navbar shows the brand "StudyQuiz" and, next to it, the display name of the subject. It shows "¡Estudiemos!" when the subject is `null`. The `AppContent` component passes the name of the current subject. The subject stays selected until the user goes back to the home page.

**Acceptance criteria of phase 1**:

Agent-tested:

- The home page shows the subjects as squares. Each square shows the title, the number of activities, and the number of topics.
- The home page shows no total for all the subjects.
- The navbar shows "¡Estudiemos!" on the home page.
- The navbar shows the name of the subject after the user picks a subject.

Test in code:

- The display name function turns "data-mining-2" into "Data Mining 2", "bi_casos" into "Bi Casos", and it keeps "NASA" as "NASA".
- The home view renders one button per subject. The name of the button holds the title, the number of activities, and the number of topics.
- The navbar shows "¡Estudiemos!" when no subject is picked.
- The navbar shows the display name of the subject after a click on a subject.

### Phase 2: Topic and activity type counts

**Goal of phase 2**: The topic page shows the number of activities of every topic and of every activity type.

**Description of phase 2**:

Change `src/components/topic-view.tsx`. The topic list shows the display name of the topic and the number of activities of that topic in parentheses. The type list shows the label of the type and the number of activities of that type in parentheses. The count of a type is the number of activities of that type over all the topics of the subject. The numbers stay the same when the user changes the selection. The heading of the page shows the display name of the subject.

Change `src/components/quiz-runner.tsx`. The topic name in the header uses the display name function. Remove the `capitalize` class.

Change `src/components/stats-view.tsx`. The topic names and the subject names use the display name function. Remove the `capitalize` classes.

Change `src/app.test.tsx`. The names of the topic checkboxes and of the subject buttons now hold the counts and the display names. Update the matchers.

**Acceptance criteria of phase 2**:

Agent-tested:

- The topic list shows the number of activities of every topic.
- The type list shows the number of activities of every type.
- The numbers do not change when the user unchecks a topic.
- The topic names show in title case in the topic list, in the quiz header, and in the statistics view.

Test in code:

- The name of a topic checkbox holds the display name and the count of the topic.
- The name of a type checkbox holds the label and the count of the type.
- The count of a type covers all the topics of the subject.
- The counts stay the same after the user changes a checkbox.
- The quiz runner and the statistics view show the display name of the topic.

### Phase 3: Theme selector

**Goal of phase 3**: The navbar has a theme selector with all the daisyUI themes. The choice stays after a reload.

**Description of phase 3**:

Change `src/app.css`. Use the option `themes: all` in the daisyUI plugin so that the CSS holds all 35 themes.

Add a new module `src/themes.ts`. It exports the list of the 35 theme names and the name of the default theme, which is "light".

Add a new component `src/components/theme-select.tsx`. It renders a select box with the class `select select-sm` and the label "Tema". It has one option per theme. The label of an option starts with an uppercase letter. The value of an option is the name of the theme. The component reads the stored theme from localStorage when it starts. It applies the theme by setting the attribute `data-theme` on the `html` element. It ignores a stored value that is not in the list and uses the default theme in that case. When the user picks a theme, the component sets the attribute and writes the value in localStorage under the key `study-quiz-theme`.

Change `src/app.tsx`. The end of the navbar holds the theme selector.

**Acceptance criteria of phase 3**:

Agent-tested:

- The navbar has a theme selector with all 35 themes.
- Picking a theme changes the colors of the whole page at once.
- The theme stays the same after a reload of the page.

Test in code:

- The select box has 35 options with the names of the daisyUI themes.
- A change sets the attribute `data-theme` on the `html` element and writes the value in localStorage.
- The stored theme is applied when the app starts.
- The CSS config builds all the themes.

### Phase 4: Card activity with a flip and an automatic advance

**Goal of phase 4**: The card activity looks like a card, it flips on click, and its buttons move to the next activity.

**Description of phase 4**:

Change `src/app.css`. Add the classes for the flip. The card has the `perspective`. The inner element has `transform-style: preserve-3d` and a transition of the transform. The inner element turns 180 degrees on the Y axis when the card is flipped. The two faces use `backface-visibility: hidden`. The back face sits on top of the front face with `position: absolute` and it turns 180 degrees on the Y axis. The front face sets the height of the card.

Change `src/components/card-activity.tsx`. The component renders a button with the daisyUI card classes, a border, a shadow, and a fixed minimum height. The button holds the inner element with the two faces. The front face shows the front text. The back face shows the back text. The component sets the attribute `data-flipped` on the inner element when the card is flipped. The "Lo sé" and "Me olvidé" buttons sit in a row that is centered under the card. They only show after the card is flipped. The "Mostrar respuesta" button is gone.

Change `src/components/card-stage.tsx`. The stage keeps the "revealed" state. A click on the card sets the state and it never goes back. The stage calls the result callback and then the next callback when the user clicks "Lo sé" or "Me olvidé". The stage does not render the "Siguiente" button.

Change `src/components/quiz-runner.tsx`. Keep the results in a ref next to the state. The result handler updates the ref before it calls the parent. The next handler sends the values of the ref to the finished callback. This keeps the last result of a card in the summary.

Change `src/components/quiz-runner.test.tsx`. The tests of the card now click the card to flip it. The test no longer expects a "Siguiente" button after the card is graded.

**Acceptance criteria of phase 4**:

Agent-tested:

- The card looks like a rounded square card with a shadow.
- A click on the card shows the back of the card.
- The "Lo sé" and "Me olvidé" buttons are centered under the card.
- Clicking "Lo sé" moves to the next activity without a "Siguiente" click.
- Clicking "Me olvidé" moves to the next activity.
- The last card opens the summary and the summary holds one result for every activity.

Test in code:

- A click on the card sets the attribute `data-flipped` and shows the back text.
- The "Mostrar respuesta" button is not in the DOM.
- Clicking "Lo sé" calls the result callback with `known` set to true and it moves to the next activity.
- Clicking "Me olvidé" calls the result callback with `known` set to false.
- The finished callback holds one result per activity when the last activity is a card.

### Phase 5: Activity type caption and answer status

**Goal of phase 5**: Every graded activity shows its type caption and the status of the answer. The separate feedback card is gone.

**Description of phase 5**:

Add a new component `src/components/activity-header.tsx`. It takes the type of the activity and the status of the answer. The status is `null` when the activity is not confirmed, `true` when the answer is correct, and `false` when it is wrong. The component shows the label of the type from `src/activity-types.ts` in the small uppercase style. When the status is not `null`, it shows either "Respuesta Correcta" in the success color or "Respuesta Incorrecta" in the error color under the caption.

Delete `src/components/activity-feedback.tsx`. The file has no other use.

Change the five stage components: `single-choice-stage.tsx`, `multiple-choice-stage.tsx`, `complete-words-stage.tsx`, `relate-stage.tsx`, and `reorder-stage.tsx`. Each stage keeps the result of the grade. Each stage renders the activity header above the activity. The header takes the type of the activity and the status of the answer. The stages no longer render the feedback card.

Change `src/components/card-stage.tsx`. The stage renders the activity header with the type "card" and the status `null`. The cards show the caption but no status.

Change `src/components/card-activity.tsx` and `src/components/complete-words-activity.tsx`. Remove the old type captions because the activity header now shows them.

Change `src/components/single-choice-activity.tsx`. After the user confirms, the radio of the selected option takes the class `radio-success` when the option is correct and the class `radio-error` when it is wrong. The other radios keep the default color.

Change `src/components/multiple-choice-activity.tsx`. After the user confirms, the checkbox of a selected option takes the class `checkbox-success` when the option is correct and the class `checkbox-error` when it is wrong. The other checkboxes keep the default color. The border of the option cards stays as it is today.

**Acceptance criteria of phase 5**:

Agent-tested:

- The activity shows the type caption above the question or the title.
- After confirming, the activity shows "Respuesta Correcta" or "Respuesta Incorrecta" under the caption.
- The separate feedback card at the bottom is gone.
- The radio and the checkboxes change their color after confirming.

Test in code:

- The caption holds the label of the activity type.
- The status text appears under the caption with the success class or the error class.
- The alert of the old feedback card is not in the DOM after confirming.
- The selected radio takes the class `radio-success` or `radio-error`.
- The selected checkbox takes the class `checkbox-success` or `checkbox-error`.
- The card activity shows the caption and no status.

### Phase 6: Feedback for complete words, relate, and reorder

**Goal of phase 6**: The three generated activities show the result of the answer inside the activity.

**Description of phase 6**:

Change `src/quiz.ts`. Export the function that normalizes an answer so that the complete words activity can use the same rule as the grading.

Change `src/components/complete-words-activity.tsx`. After the user confirms, each input takes the class `input-success` when the answer is correct and the class `input-error` when it is wrong. An incorrect input sits in a daisyUI tooltip and the tooltip holds the correct answer in the attribute `data-tip`. The correct answer comes from the label of the blank part. The comparison uses the exported normalize function.

Change `src/components/relate-activity.tsx`. After the user confirms, each row takes the outline class `outline-2 outline-success` when the pair is right and the class `outline-2 outline-error` when it is wrong. A row without an answer counts as wrong. Under the left text, the row shows the correct value of the key in a small line. The line starts with the text "Correcto: ".

Change `src/components/reorder-activity.tsx`. After the user confirms, each row shows the position of its element in the correct order. The position is the index of the element in `activity.elements` plus one. The number sits on the left of the element. It is big and bold. It takes the success color when the position matches the current position of the row and the error color when it does not.

Change `src/components/generated-activities.test.tsx`. The tests no longer expect the correct answer panel. They now check the new marks of each activity.

**Acceptance criteria of phase 6**:

Agent-tested:

- The complete words activity shows a green border for a correct blank and a red border for a wrong blank.
- A wrong blank shows the correct answer when the user points at it.
- The relate activity shows a green outline for a right field and a red outline for a wrong field.
- The relate activity shows the correct value under the left text of every field.
- The reorder activity shows the correct position of every answer as a big number.
- The number of the reorder activity is green when the answer sits in the right place and red when it does not.

Test in code:

- A correct blank takes the class `input-success` and a wrong blank takes the class `input-error`.
- The tooltip of a wrong blank holds the correct answer in the attribute `data-tip`.
- A right relate row takes the class `outline-success` and a wrong row takes the class `outline-error`.
- The relate row shows the correct value under the left text.
- The reorder row shows the correct position of its element.
- The number of the reorder row takes the success class when the position matches and the error class when it does not.
