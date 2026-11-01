# Distribuzione npm / npm releases

## Stato / Status

**IT:** Preparazione locale autorizzata: pacchetto pubblico `droidsembly`, comando `droidsembly`, versione `0.4.0-beta.1`, canale `next`. Non ancora pubblicato. Account npm indicato dal manager: `rosariomoscato`; la titolarità del pacchetto e la configurazione del publisher non sono state verificate tramite login.

**EN:** Authorized local preparation: public package `droidsembly`, command `droidsembly`, version `0.4.0-beta.1`, channel `next`. Not published yet. The maintainer supplied npm username `rosariomoscato`; package ownership and publisher setup have not been verified through authentication.

## Compatibilità / Compatibility

- Il nuovo pacchetto espone soltanto `droidsembly`; nessun alias globale `cubefarm` che possa collidere con l'originale. / The new package exposes only `droidsembly`, avoiding a global alias collision with upstream.
- `bin/cubefarm.js`, `~/.cubefarm`, `SWARM_HOME`, porte e launcher esistenti sono conservati. / The internal entry file, default data path, environment variables, ports and existing launchers are preserved.
- Per installazioni affiancate usare home distinte; nessuna migrazione automatica. / Use separate homes for side-by-side installations; there is no automatic migration.
- I prerequisiti restano Node >=22, Git e, per lavoro reale, GitHub CLI e provider configurati. npm non installa automaticamente tutti gli strumenti esterni. / Node >=22, Git and, for real work, GitHub CLI and configured providers remain prerequisites; npm does not install every external tool.
- La CLI consulta `droidsembly/next` per le prerelease, `droidsembly/latest` per le stabili. Il passaggio beta → stabile avviene scegliendo esplicitamente il canale stabile dopo il suo rilascio. / The CLI checks `next` for prereleases and `latest` for stable versions. Users explicitly switch to the stable channel once released.

## Verifiche locali / Local checks

PowerShell, dalla copia di sviluppo / from the development checkout:

```powershell
npm.cmd run typecheck
npm.cmd test -- scripts/distribution.test.ts scripts/officeSteps.test.ts server/config.test.ts --maxWorkers=1
npm.cmd run build
npm.cmd pack --dry-run --ignore-scripts
$env:RELEASE_TAG = 'droidsembly-v0.4.0-beta.1'
node scripts/release-metadata.mjs
$env:SWARM_PORT = '0'
node scripts/smoke-package.mjs
```

Su macOS/Linux usare `npm` e la sintassi della shell per le variabili. La suite completa resta richiesta prima di una PR. / On macOS/Linux use `npm` and your shell's environment syntax. The full suite remains required before a PR.

Lo smoke installa il tarball effettivo in una cartella temporanea, controlla versione/help tramite il comando installato, verifica licenze e avvia solo la demo. `CI=1` disabilita il controllo degli aggiornamenti. Non usa l'ufficio reale né richieste AI. / The smoke installs the actual tarball in a temporary folder, checks the installed command's version/help and license files, and starts only a demo. `CI=1` disables update checks. It does not use the real office or make AI requests.

## Prima pubblicazione / First publication

1. Confermare la disponibilità del nome al momento del rilascio e accedere al proprio account npm con 2FA. Credenziali e codici restano al manager. / Confirm name availability at release time and sign in to the maintainer's npm account with 2FA. Credentials and codes stay with the maintainer.
2. Integrare la preparazione tramite PR verificata. Concordare separatamente il bootstrap del pacchetto nuovo: prima pubblicazione autenticata o procedura iniziale supportata da npm, prima di poter fare affidamento sul trusted publisher del pacchetto. / Merge the preparation through a verified PR. Separately agree on new-package bootstrap via authenticated first publication or npm's supported initial setup before relying on the package's trusted publisher.
3. Configurare OIDC per owner `rosariomoscato`, repository `droidsembly`, workflow `release.yml`, autorizzando la pubblicazione diretta `npm publish`. Node >=22.14.0 e npm >=11.5.1 sono richiesti per OIDC; il job usa Node 24 e npm 11. / Configure OIDC with those exact fields and allow direct `npm publish`; the job uses Node 24 and npm 11 to meet the OIDC requirements.
4. Configurare il publisher quando pronti: secondo le regole npm consultate, una nuova configurazione scade se non validata entro due giorni. / Configure the publisher when ready: current npm rules expire an unused new configuration after two days.

Nessun comando di pubblicazione viene eseguito da queste istruzioni o dai controlli locali. Il primo rilascio richiede autorizzazione distinta. / These instructions and local checks perform no publication. The first release requires separate authorization.

## Release successive / Subsequent releases

1. PR con versione coerente fra package e lock e `publishConfig.tag`: `next` per `-beta.N`, `latest` per una versione stabile. / Review version and channel changes through a PR, keeping package and lock consistent.
2. Dopo autorizzazione, creare un tag `droidsembly-v<version>` sul commit approvato integrato in main. / After authorization, create the matching fork-specific tag on the approved commit merged into main.
3. Avviare manualmente **Actions → Release** su `main`, indicando quel tag. Il semplice push di un tag non pubblica nulla. / Manually dispatch Release on main with that tag; pushing a tag alone does not publish.
4. Il workflow verifica identità/tag, appartenenza alla storia di main e tutti e tre i sistemi operativi. Il job di pubblicazione ripete test/build/smoke sul codice del tag, pubblica sul canale previsto e crea la release GitHub. / The workflow validates identity/tag, main ancestry and all three operating systems. The publishing job repeats tests/build/smoke, publishes to the expected channel, then creates the GitHub release.
5. La prima release GitHub usa note esplicite; le successive confrontano soltanto tag `droidsembly-v*`. Nessun bump o push automatico su main. / The first GitHub release has explicit notes; subsequent notes use only fork-specific tags. There are no automatic bumps or pushes to main.

Se npm ha pubblicato ma la creazione della release GitHub fallisce, non ripubblicare la stessa versione: verificare lo stato del registry e completare solo il passaggio mancante con autorizzazione. Le coppie nome/versione già pubblicate non si riutilizzano. / If npm succeeds but GitHub release creation fails, do not republish the same version: inspect registry state and complete only the missing step with authorization. Published name/version pairs cannot be reused.

## Documentazione e attribuzioni / Documentation and attribution

I README EN/IT usano URL assoluti del fork per immagini e guide, così il tarball non deve includere documenti locali. MIT originale e avviso Sora OFL restano nel pacchetto. Prima della prima pubblicazione completare la verifica delle licenze delle dipendenze e dei componenti incorporati; la presenza di questi due avvisi non costituisce un audit completo. / EN/IT READMEs use absolute fork URLs for images and guides, keeping local documents out of the tarball. Original MIT and Sora OFL notices remain included. Complete the dependency and bundled-component license review before first publication; those two notices alone are not a complete audit.

Fonti / Sources: [npm trusted publishing](https://docs.npmjs.com/trusted-publishers), [public scoped packages](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages).
