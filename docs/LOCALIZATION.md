# Languages

The top-right EN / PT / ES buttons select English, Brazilian Portuguese or Spanish. The language is saved separately from game progress in `aurora-language`. Switching languages rerenders text without recreating the Phaser canvas or changing mission state.

`src/i18n/translate.ts` localizes presentation strings with `t(value)`. Numeric values, React elements, mission ids, flags, chances, resource deltas and scheduling remain unchanged. The English source is the fallback. Both translation catalogs are bundled and work without network access.

Catalogs: `src/i18n/locales/pt.json` and `es.json`. Initial translations were generated using Google with explicit user permission, then primary terminology, names and selected messages were adjusted manually. Longer mission stories still benefit from editorial review by native speakers.

To add a message, wrap the displayed source string in `t`, add the same English key to both catalogs and preserve placeholders such as `{crew}` and `{v0}`. Full templates are preferred over translating individual words. Character names, project branding, source citations and logos remain as proper names.

Narration chooses an available voice for `en-US`, `pt-BR` or `es-ES`. Browser/OS voices determine availability and quality. The document language, narration, scene descriptions and locale-specific date formatting follow the selection. Animated text must be translated before it is split into words or characters. Text baked into artwork is not changed.

Verification: build/lint; switch each language on the title screen, reload to check persistence, check cinematic captions and mission descriptions, and switch during the game while confirming the same Phaser canvas and game state remain present.
