# StudyQuiz

Una aplicación web sencilla que se ocupa de agregar y presentar cuestionarios, tarjetas, comparaciones, y otras actividades para el estudio.

**Aviso importante**: Todo StudyQuiz fue hecho con _vibe coding_ bajo supervisión mínima. Se testeó manualmente (y hay pruebas automáticas) pero no hay garantías de correcto funcionamiento. En `plans/` está el plan principal que guió la creación de la aplicación web.

## ¿Cómo se usa?

1. Clonar el repositorio: `git clone https://github.com/Bowuigi/StudyQuiz`
2. Instalar dependencias: `npm install`
3. Agregar tantas actividades como se desee en `contents/<materia>/<tema>.json`. El archivo `QUESTION_GENERATION_PROMPT.md` contiene un _prompt_ que se puede utilizar como base para generar preguntas dado el material de estudio (asumiendo que es un resumen).
4. Iniciar la aplicación: `npm run dev`
5. Elegir materia, temas y actividades (cantidad y tipos).
6. Completar el cuestionarios interactivo que aparece.
7. Repetir los pasos 5 a 7 hasta haber cubierto el material completo.

## Stack tecnológico

- Typescript
- Preact
- TailwindCSS con DaisyUI

Herramientas de desarrollo:

- Vitest para las pruebas.
- Oxlint para el _linting_.
- Oxfmt para el _formatting_.
- Varios _skills_ para _harnesses_ como OpenCode, Pi, etc.
