# Client license fallbacks / Testi di licenza mancanti

## English

Vite generates `dist/third-party-licenses.json` from the packages in emitted client chunks. `scripts/build-licenses.mjs` completes missing texts, collects additional LICENSE/COPYING/NOTICE files from those installed packages, and writes `dist/THIRD_PARTY_LICENSES.txt`. Both outputs are included by the existing npm `dist` allowlist. A missing text fails the build.

The three fallback texts are verbatim copies of upstream LICENSE files at the npm versions' registry `gitHead`; exact source URLs and version keys are in `overrides.json`. Builds use local copies without network requests. A version upgrade cannot silently reuse an old fallback: review the new package and source before adding another entry. Do not replace a missing text with an assumed generic license.

The inventory describes bundled client packages, not every entry in the lockfile. Server dependencies stay external; Claude Agent SDK and its binaries have Anthropic terms, not MIT. Droidsembly's original MIT license and Sora's OFL remain separate.

Validate with `npm run build`, `npm exec -- vitest run scripts/build-licenses.test.ts`, and `node scripts/smoke-package.mjs`. To verify a retained tarball instead of packing again: `node scripts/smoke-package.mjs "path/to/droidsembly-0.4.0-beta.1.tgz"`. The smoke installs only in a temporary directory and runs the demo.

## Italiano

Vite genera `dist/third-party-licenses.json` dai pacchetti dei chunk client emessi. `scripts/build-licenses.mjs` completa i testi mancanti, raccoglie gli ulteriori file LICENSE/COPYING/NOTICE dei pacchetti installati e scrive `dist/THIRD_PARTY_LICENSES.txt`. Entrambi sono inclusi dalla allowlist npm esistente per `dist`. Un testo mancante interrompe la build.

I tre testi di riserva sono copie integrali dei file LICENSE upstream al `gitHead` indicato dal registry per quelle versioni npm; URL e versioni esatti sono in `overrides.json`. La build usa copie locali senza richieste di rete. Un aggiornamento non riutilizza automaticamente il testo della vecchia versione: verificare nuovo pacchetto e fonte prima di aggiungere una voce. Non sostituire un testo mancante con una licenza generica presunta.

L'inventario descrive i pacchetti client incorporati, non tutte le voci del lockfile. Le dipendenze server restano esterne; SDK e binari Claude hanno termini Anthropic, non MIT. MIT originale di Droidsembly e OFL di Sora restano separate.

Verificare con `npm run build`, `npm exec -- vitest run scripts/build-licenses.test.ts` e `node scripts/smoke-package.mjs`. Per provare un tarball conservato senza ricrearlo: `node scripts/smoke-package.mjs "path/to/droidsembly-0.4.0-beta.1.tgz"`. Lo smoke installa solo in una directory temporanea e avvia la demo.
