# StudyQuiz

Una aplicación web sencilla que se ocupa de agregar y presentar cuestionarios, tarjetas, comparaciones, y otras actividades para el estudio.

**Aviso importante**: Todo StudyQuiz fue hecho con _vibe coding_ bajo poca supervisión. Se testeó manualmente (y hay pruebas automáticas) pero no hay garantías de correcto funcionamiento. En `plans/` están los planes principales que guiaron la creación de la aplicación web.

Se incluye un _prompt_ para [generar actividades dado el material de estudio](./QUESTION_GENERATION_PROMPT.md), además de un _linter_ que verifica la adhesión del contenido final a esta guía, para conseguir mejores resultados.

## ¿Cómo se usa?

1. Clonar el repositorio: `git clone https://github.com/Bowuigi/StudyQuiz`
2. Instalar dependencias: `npm install`
3. Agregar tantas actividades como se desee en `contents/<materia>/<tema>.json`, posiblemente habiéndolas generado con `QUESTION_GENERATION_PROMPT.md` a partir de un resumen.
4. (Opcional) Verificar la calidad de las actividades usando `npm run lint:content`
5. Iniciar la aplicación: `npm run dev`
6. Elegir materia, temas y actividades (cantidad y tipos).
7. Completar el cuestionario interactivo que aparece.
8. Repetir los pasos 5 a 7 hasta haber cubierto el material completo.

## Stack tecnológico

- Typescript
- Preact
- TailwindCSS con DaisyUI

Herramientas de desarrollo:

- Vitest para las pruebas.
- Oxlint para el _linting_.
- Oxfmt para el _formatting_.
- Varios _skills_ para _harnesses_ como OpenCode, Pi, etc.

## _Linter_ de contenido

El _linter_ de contenido valida que cada archivo `content/<materia>/<tema>.json` cumpla con las reglas de `QUESTION_GENERATION_PROMPT.md`. Se usa así:

```bash
npm run lint:content

# Con carpeta personalizada
npm run lint:content -- --dir content

# Salida en JSON (para CI/integraciones)
npm run lint:content -- --json

# Tratar advertencias como errores
npm run lint:content -- --strict
```

El programa clasifica los problemas en **errores** (violaciones objetivas) y **advertencias** (heurísticas con falsos positivos):

**Errores:**

- `invalid-json`: JSON inválido
- `not-an-array`: El nivel superior no es un array
- `empty-topic`: Archivo sin actividades
- `unexpected-file-location`: Archivos fuera de `content/<materia>/<tema>.json`
- `unknown-activity-type`: Tipo de actividad no reconocido
- `missing-field` / `invalid-field-type`: Campos requeridos faltantes o de tipo incorrecto
- `empty-text`: Textos vacíos (question, title, label, front, back)
- `too-few-options`: Menos de 2 opciones en actividades de elección
- `duplicate-option`: Etiquetas de opción duplicadas
- `missing-explanation` / `empty-explanation`: Explicaciones faltantes o vacías
- `single-choice-has-is-correct`: `single-choice` no debe tener campo `isCorrect` (propio de `multiple-choice`)
- `no-blank` / `empty-blank`: Actividad de completar palabras (tipo `complete-words`) sin palabras para completar
- `too-few-elements` / `duplicate-element`: Actividad de reordenar (tipo `reorder`) con pocos/duplicados elementos
- `too-few-pairs` / `empty-related-value`: Actividad de relacionar (tipo `relate`) con pocas parejas o valores vacíos
- `empty-card-side`: Tarjeta sin frente o dorso
- `duplicate-activity`: Actividad duplicada en el mismo tema
- `longest-option-is-correct`: La opción correcta es claramente la más larga
- `longest-is-always-correct`: En todas las actividades de elección del tema, la correcta es la más larga

**Warnings:**

- `option-length-imbalance`: La opción correcta es más larga (umbral bajo)
- `longest-is-usually-correct`: En la mayoría de actividades, la correcta es la más larga
- `repeated-question`: Pregunta idéntica repetida en el tema
- `similar-question`: Preguntas muy similares (Jaccard ≥ 0.8)
- `meta-question`: Pregunta sobre el material en vez del tema
- `refers-to-material`: La pregunta habla de "el material"/"las notas"
- `example-dependent-question`: Pregunta depende de un ejemplo concreto del material
- `not-in-spanish`: Pregunta parece inglés (permitido si el material es inglés)
- `topic-too-small`: Menos de 5 actividades (cobertura no exhaustiva)
- `missing-true-false`: Tema con ≥5 actividades de elección sin true/false (single-choice de 2 opciones)
- `uniform-correct-count`: Todas las multiple-choice tienen el mismo número de correctas
- `uniform-option-count`: Todas las actividades de elección tienen el mismo número de opciones
- `missing-reorder-or-relate`: Tema con ≥8 actividades sin reorder ni relate
- `blank-too-long`: La frase a completar tiene más de 3 palabras
- `blank-not-essential`: La palabra a completar es de relleno (de, la, más...)
- `quote-in-complete-words`: Texto parece cita (comillas, verbos de atribución)
- `explanation-too-short`: Explicación solo dice "Correcto."/"Incorrecto." o es demasiado corta
- `question-without-question-mark`: Pregunta de elección no termina en `?`
- `filename-not-kebab-case`: Nombre de archivo no es kebab-case
- `placeholder-filename`: Nombre de archivo es descartable (new, untitled, tema...)
- `non-json-file`: Archivo no-JSON en `content/`
- `subject-without-topics`: Materia sin archivos de tema
- `duplicate-question-across-topics`: Misma pregunta en dos temas de la misma materia

### Umbrales de longitud

Configurables en `scripts/linter.ts` (bloque `CONFIG`):

- **3+ opciones**: error si `correct >= 1.5 * media_incorrectas` Y `correct - media >= 10`; advertencia si `>= 1.25` Y `>= 5`
- **2 opciones**: solo advertencia si `correct >= 2 * otra` Y `diff >= 20`
- **Exención**: parejas verdadero/falso (verdadero/falso, sí/no, true/false) nunca reportan
