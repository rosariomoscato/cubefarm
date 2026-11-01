# Droidsembly — integrazione del marchio

Revisione grafica 02 approvata in conversazione, seguita da approvazione delle schermate e prova interattiva positiva del manager. Implementazione su `feat/droidsembly-branding`, da `925f32a`. Commit, push e PR sul solo fork autorizzati; merge e deploy richiedono autorizzazioni separate.

## Asset

In `client/public/icons/`:

- `logo-light.svg`, `logo-dark.svg`: lockup con Sora incorporato, sfondo trasparente, payoff inglese.
- `icon.svg`: robot-cubo avorio/grafite, profilo ciano, visore con riflesso, occhi luminosi, antenna arancio. Cerchio laterale e lineette sullo stesso asse prospettico.
- `droid-{wire,shell,eyes,antenna,spark}.svg`: livelli dell’assemblaggio. Un’unica riproduzione di circa 2,2 s per caricamento del documento; intestazioni e favicon statiche. Nessun audio. Preferenza sistema e opzione accessibilità dell’app rispettate.
- `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`: icone PWA; variante maskable con robot interamente dentro l’area sicura centrale.
- `apple-touch-icon.png`: 180 px, fondo grafite opaco.
- `favicon.svg`, `favicon-16.png`, `favicon-32.png`: geometria semplificata per piccole dimensioni.
- `badge.svg`, `badge-96.png`: silhouette bianca trasparente, per notifiche monocromatiche.
- `sora-400.ttf`, `sora-700.ttf`, `Sora-OFL.txt`: Sora locale e licenza SIL OFL. Font originali da Google Fonts (`fonts.gstatic.com/s/sora/v17/`), licenza da `google/fonts/ofl/sora/OFL.txt`. Nessuna nuova richiesta esterna necessaria per il marchio.

Generazione ripetibile offline: `node scripts/branding-assets.mjs`. Richiede Chrome già installato e Playwright già presente; non avvia l’app. La geometria proviene dalle definizioni SVG di `preview.html`, tavola approvata conservata. Non ci sono asset originali estratti dal PDF: si tratta della ricostruzione approvata.

`Brand.tsx` usa gli stessi livelli e il font Sora locale. Il blu del lettering nell’interfaccia chiara è leggermente più scuro (`#007eaf`) per leggibilità alle dimensioni ridotte. I lockup esportabili conservano il ciano della tavola.

## Identità e compatibilità

- Nome visibile, titolo browser, Apple title e nome PWA: Droidsembly.
- Nome aziendale configurato e payoff lobby conservati. Nel collaudo: Soot & Stars / Small droids. Serious software.
- Mantiene nome npm/bin, percorsi dati, chiavi storage, protocolli/eventi, identificativi delle notifiche e id/scope/start_url PWA. Il comando tecnico rimane `cubefarm`.
- Cache service worker aggiornata tramite il nuovo index/bundle; stesso prefisso per rimuovere le versioni precedenti. Icone, font e livelli animazione inclusi nel precache.
- Simboli operativi nei log e spinner non sono marchi: conservati. Attribuzioni e documentazione upstream conservate.
- Foto già salvate, messaggi e report storici non vengono riscritti; cambia il prefisso dei nuovi download.

## Verifiche

- TypeScript e build client/server finali superati; consueti avvisi Rapier/chunk, senza modifica delle soglie.
- **124 test mirati passati su 13 file**: PWA, notifier, CLI, integrazione runner, helper cloud, browser, controllo anteprima, prompt, CEO runtime, foto, news e billboard. Corrette le aspettative dei test legate al vecchio nome; nessuna asserzione eliminata o soglia allentata.
- `node scripts/branding-smoke.mjs`: demo isolata su porta 4419 verificata libera, Chrome con profilo nuovo e agenti fittizi; ingresso desktop EN/IT, 360 px, wizard stretto, pocket 360/820 px e lobby 3D. Verificati Sora, animazione non ciclica, movimento ridotto, icona in cache offline, caricamento/dimensioni degli export, assenza di errori pagina e overflow interno nelle schede d’ingresso. Corretto il ritaglio del pulsante italiano del wizard.
- Automazioni dei progetti false, `ceoHeartbeatMin: 0`, `scaling: approve`, nessun agente in lavoro/preparazione, identità aziendale conservata. Nessuna richiesta AI reale né modifica alle preferenze audio del browser personale.
- Report finale e screenshot completi: `C:\Users\rosar\AppData\Local\Temp\opencode\droidsembly-qa-A22EYG`. Demo fermata tramite IPC al solo processo creato dal collaudo. Screenshot selezionati in `screenshots/`.
- Tentativi preliminari: primo avvio del bundle demo oltre il limite di startup, poi avvio da sorgenti; un’acquisizione con WebGL software oltre 30 s, poi completamento con limite di acquisizione 90 s. Nessuna modifica ai timeout dei test applicativi.

### Suite globale: non verde

Esecuzione intermedia completata: **2.598 passati e 8 falliti**, 236 file passati su 244, circa 660 s. Il primo tentativo era stato interrotto dal timeout dello strumento a 120 s. Log completo: `C:\Users\rosar\AppData\Local\Temp\opencode\droidsembly-tests.log`.

- Due aspettative obsolete CUBEFARM in news/billboard: aggiornate; passate nella successiva verifica mirata.
- `ceoRuntime` (cartella già esistente) e `notifier` (persistenza rimozione dispositivo): ripetizione mirata passata; non prova della causa del fallimento globale.
- Restanti segnalazioni del run: timeout in `scale`, `indoor` e `throwSim`; budget temporale superato in `walkways`.

Questa esecuzione era su codice intermedio e in parte concorrente con altre verifiche. Non è una validazione globale del codice finale e non attribuiamo automaticamente tutti gli errori alla baseline. I quattro fallimenti storici documentati nel changelog **non sono dichiarati risolti**. Nessuna ulteriore ripetizione globale automatica.
