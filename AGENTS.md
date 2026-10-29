## General

If a question of yours can be answered by an experiment, experiment. On OpenCode, use the `/tmp/opencode/*` directory; on Pi, use the `/tmp/pi-experiments/*` one. If an experiment has to be run from this directory, remember to clean it up afterwards.

Do not use em dashes, ever. No marketing fluff either.

## Tech stack

- Typescript (very strict)
- Astro
- TailwindCSS and DaisyUI
- Vitest
- Oxlint and Oxfmt

Run linting, formatting and testing with `npm run lint`, `npm run fmt` and `npm run test`. Make sure all of them pass before marking a task as completed.

# Available skills

Available skills in this project (load with the `skill` tool when the task matches automatically):

| Skill | When to Use |
|---|---|
| astro-framework | Creating Astro components, configuring hydration, Content Layer API, sessions, i18n routing, actions, SSR adapters, view transitions, integrating React/Vue/Svelte/Solid |
| daisyui | Writing HTML/JSX — must use daisyUI components for TailwindCSS |

# Astro

When starting the dev server, use background mode:

```
npx astro dev --background
```

Manage the background server with `npx astro dev stop`, `npx astro dev status`, and `npx astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
