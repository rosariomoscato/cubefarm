# Registro delle modifiche del fork

Questo documento raccoglie le personalizzazioni di [rosariomoscato/cubefarm](https://github.com/rosariomoscato/cubefarm) rispetto al [progetto originale](https://github.com/leonvanzyl/cubefarm). Non sostituisce la cronologia Git e non elenca le funzionalità già presenti upstream.

## Come aggiornare il registro

- Aggiungere le nuove voci in ordine cronologico inverso, raggruppate per data (`AAAA-MM-GG`).
- Per ogni voce indicare **feature**, **tipo** e una **breve descrizione**. Aggiungere commit o PR quando disponibili.
- Registrare modifiche effettivamente realizzate; tenere separate le proposte non ancora implementate.
- Specificare lo stato di integrazione: un commit locale o su un branch non implica che la funzionalità sia già su `main` o pubblicata su npm.
- Documentare verifiche e limitazioni rilevanti senza inserire credenziali, log privati o percorsi personali.

## Punto di partenza

| Riferimento | Dettaglio |
| --- | --- |
| Progetto originale | `leonvanzyl/cubefarm` |
| Fork personalizzato | `rosariomoscato/cubefarm` |
| Baseline precedente alle nostre modifiche | `157efde` — 2026-10-22, «Find and fix the freezes while walking around a floor; record hitches (#306)» |
| Prima modifica del fork documentata | 2026-10-30 |

La data della prima modifica è ricavata dalla cronologia Git; non viene usata come attestazione della data di creazione del fork su GitHub.

## 2026-10-30

### PR in bozza per verifica CI indipendente

**Decisione del manager:** autorizzati il push di `feat/english-italian` e l’apertura di una **PR in bozza esclusivamente su `rosariomoscato/cubefarm`**, per eseguire la CI su runner separati. Nessun merge o rilascio autorizzato. Le precedenti note di sospensione del push descrivono lo stato storico prima di questa decisione.

**Contenuto:** localizzazione EN/IT e rifinitura della dettatura del commit `3d438ce`, validazione raggruppata del commit `353fe8e`, indagine prestazionale e tentativi ambientali documentati. Aggiunta una schermata del wizard italiano ottenuta nella demo isolata, senza credenziali o contenuti privati.

**Verifiche e limiti da dichiarare nella PR:** 2.535 test locali passati su 2.536, con un solo budget prestazionale fallito anche sul `main` del fork; 129 regressioni mirate e build/TypeScript superati; conferme manuali dell’utente sulla dettatura Chrome. Nessuna soglia allentata, nessuna modifica al pathfinding. La CI esistente prevede Node 24 e controlli Ubuntu, Windows e macOS per queste modifiche, inclusi test, build e smoke test del pacchetto in demo. L’esito remoto resta da verificare: l’apertura della bozza non equivale a CI superata.

### Tentativo di prova controllata con piano Bilanciato

**Autorizzazione:** l’utente ha richiesto la prova controllata. Attivato temporaneamente il piano Windows Bilanciato, verificata l’attivazione e ripristinato/verificato il precedente Risparmio di energia al termine di ciascun tentativo.

**Esito:** prerequisito di basso carico non raggiunto. Dopo l’assestamento, quattro finestre di cinque secondi hanno misurato medie CPU di circa 55,0%, 38,7%, 75,1% e 44,0%, con picco del 95,1%; il criterio diagnostico richiedeva due finestre consecutive al massimo al 30%. Nessun test dei percorsi avviato sotto queste condizioni: il risultato non viene presentato come prova controllata riuscita né come nuovo fallimento del codice.

**Ricontrollo dopo «pronto»:** osservato ancora circa 64% di carico iniziale; uno snapshot dei contatori Windows mostra attività in WSL, Brave e OpenCode. Un ulteriore controllo temporaneo su Bilanciato ha registrato circa 99,6% medio negli ultimi cinque secondi: nessun test avviato, nessun processo fermato, piano iniziale ripristinato. Non si attribuisce causalmente l’aumento al piano energetico; resta necessario ridurre in sicurezza le attività in background.

**Dopo lo spegnimento di Docker segnalato dall’utente:** ripetuto il protocollo invariato su Bilanciato. Medie delle quattro finestre: circa 32,0%, 29,1%, 53,5% e 53,3%. Mancano due finestre consecutive sotto il criterio di basso carico: nessun test avviato, piano Risparmio di energia ripristinato e worktree temporaneo rimosso. Nessuna chiusura automatica di altri processi né nuova dichiarazione di suite verde; una macchina/CI separata o una diagnosi del carico residuo richiedono la prossima decisione del manager.

**Stato:** nessuna modifica a codice, soglia degli 8 ms o dipendenze; nessuna chiusura di programmi/uffici dell’utente, nessuna chiamata AI, commit, push o PR. Necessaria collaborazione dell’utente per ridurre solo le attività non essenziali prima di ripetere il controllo. Dettagli e ripristino in `docs/pathfinding-investigation.md`.

### Indagine sul budget prestazionale dei percorsi

| Feature | Tipo | Breve descrizione |
| --- | --- | --- |
| Confronto ripetuto branch/baseline | Diagnosi | Sei esecuzioni fresche del test originale: successi e fallimenti su entrambi i checkout. Verificati identità dei 14 moduli runtime, bundle diagnostico identico byte per byte e stessi percorsi restituiti. Nessuna evidenza di regressione del pathfinding introdotta da EN/IT. |
| Condizioni della macchina | Diagnosi | Rilevati piano Windows Risparmio di energia e carico CPU elevato durante le misure. Sono fattori rilevanti per il budget assoluto di 8 ms, non una dimostrazione causale isolata; nessuna impostazione di sistema cambiata. |
| Profilo e conteggio del lavoro | Diagnosi | Profilazione della versione originale e contatori in una sola copia temporanea: costi concentrati in pianificazione e visibilità; 2,592 MB di buffer nuovi e 496 controlli di segmento per 15 percorsi, dei quali 6 già rettilinei. Nessuna ottimizzazione applicata. |

**Stato:** indagine documentata in `docs/pathfinding-investigation.md`; codice applicativo, test, soglie e dipendenze invariati. Strumenti e misure grezze solo nella cartella temporanea approvata. Nessun push, PR o modifica all’ufficio dell’utente. La scelta tra prova ambientale controllata, ottimizzazione separata e revisione metodologica del benchmark resta al manager; il precedente fallimento della suite non viene cancellato da un retry riuscito.

### Verifica completa EN/IT suddivisa in gruppi

**Riferimento:** commit funzionale `3d438ce`, branch `feat/english-italian`, confronto con `main` del fork a `7c9c148`.

| Feature | Tipo | Breve descrizione |
| --- | --- | --- |
| Copertura dell’intera suite | Verifica | Eseguiti tutti i 230 file di test in quattro gruppi, confrontando i report JSON con l’inventario Git: nessuna omissione o duplicazione. Risultato: 2.535 test passati e 1 fallito su 2.536. Workspace (44 test) e scala superati senza allentare soglie o timeout. |
| Confronto del fallimento prestazionale | Diagnosi | Il budget di 8 ms del percorso fallisce anche in un worktree pulito del `main` del fork: circa 8,913 ms, contro 13,469 ms nel file eseguito da solo sul branch. Nessuna modifica ai file coinvolti; non si dichiara comunque verde la suite del branch. |
| Dettatura verificata dall’utente | Verifica manuale | Confermati in Chrome dettatura normale, conservazione della bozza e interruzione con Esc, senza necessità di inviare messaggi. |

**Stato:** push e apertura PR sospesi perché rimane un test prestazionale fallito, riprodotto anche sulla baseline. Nessun merge, pubblicazione npm, richiesta AI reale o modifica all’installazione globale. Worktree diagnostico separato; nessun cambiamento al codice applicativo durante questa verifica. Comandi, conteggi e limiti in `docs/validation-english-italian.md`.

Questa esecuzione completa per gruppi sostituisce l’incertezza sulla copertura della precedente prova interrotta, non ne cancella la cronologia né risolve il budget prestazionale.

### Rifinitura della dettatura e compatibilità dei browser

| Feature | Tipo | Breve descrizione |
| --- | --- | --- |
| Avvio del microfono bloccato | Correzione | Il timeout già presente di circa 10 secondi ora mostra un errore invece di annullare silenziosamente l’ascolto. Mantiene la bozza, libera l’attenuazione audio e permette di riprovare. |
| Errori senza evento finale | Robustezza | Gli errori di riconoscimento vengono mostrati anche se il browser non emette `onend`; le callback tardive dopo l’annullamento non riattivano la sessione. |
| Stati e messaggi EN/IT | Localizzazione | Tradotti avvio, ascolto, trascrizione, tooltip, etichette accessibili, errori e istruzioni principali della dettatura. |
| Compatibilità verificata | Documentazione | L’utente ha confermato la dettatura italiana in Chrome e segnalato l’avvio giallo senza trascrizione in Brave. Nessun blocco per nome del browser né passaggio automatico a servizi a pagamento; documentata l’alternativa Windows + H. |

**Stato:** consolidata insieme alla prima localizzazione nel commit locale che introduce questa voce, sul branch `feat/english-italian`, come autorizzato dall’utente. Nessun push o pubblicazione.

**Verifiche:** **129 test mirati e di regressione superati su 12 file**, inclusi timeout, riprova, callback tardive, errori senza `onend`, conservazione della bozza, normale trascrizione simulata, voce, dettatura, vivavoce e localizzazione. TypeScript e build superati. Nel browser, su una demo separata: simulato riconoscimento che non parte, errore italiano dopo circa 10 secondi, bozza conservata e riprova con trascrizione simulata senza invio automatico; nessun errore console. Demo di verifica arrestata senza toccare quella dell’utente. Nessuna cattura del microfono o chiamata AI/ElevenLabs reale da parte dell’agente.

**Suite completa finale non conclusa:** il comando con un worker è stato interrotto al limite esterno di 20 minuti; durante la prova sono comparsi un timeout nel test di scala (`server/scale.test.ts`) e un superamento della soglia temporale del percorso (`client/src/world/walkways.test.ts`). Entrambi i file rieseguiti separatamente sono passati (**18 test su 2 file**), senza modificare soglie o timeout dei test. Non si dichiara quindi superata la suite completa dello stato finale; il precedente risultato completo sotto resta riferito alla versione provata allora.

### Prima localizzazione inglese/italiano

**Stato:** modifiche consolidate nel commit locale sul nuovo branch `feat/english-italian`, basato sul `main` del fork dopo PR #2. Nessun push, pubblicazione npm o modifica all’installazione globale.

| Feature | Tipo | Breve descrizione |
| --- | --- | --- |
| Lingua dell’ufficio | Nuova funzionalità | Scelta English/Italiano salvata sul server, condivisa tra dispositivi, disponibile all’avvio, nel wizard, nelle impostazioni della console e in Pocket. Vecchi uffici e valori non supportati ricadono sull’inglese. |
| Interfaccia principale | Localizzazione | Dizionario centralizzato con fallback inglese e interpolazione; tradotti navigazione, wizard e controlli principali di chat, CEO, progetti, modelli e analisi. Nessuna riscrittura del DOM o traduzione dei contenuti dell’utente. |
| Comunicazione CEO e analisi | Integrazione | Istruzioni di risposta nella lingua scelta, anche nei messaggi a un CEO attivo e nei follow-up di analisi. Codice, issue, PR e brief QA del repository restano in inglese. |
| Voce e dettatura | Integrazione | Locale dell’ufficio per il riconoscimento nel browser, preferenza per voci compatibili, campione italiano e hint lingua ElevenLabs. Richieste/cache inglesi retrocompatibili e clip già salvate invariate. |
| Demo e regressioni | Verifica | Chat di stato e analisi demo italiane; test su fallback, interpolazione, migrazione, persistenza, istruzioni, scelta delle voci e payload ElevenLabs senza richieste reali. |

**Verifiche:** TypeScript e build superati (restano gli avvisi già noti su Rapier e dimensioni dei chunk); suite completa avviata durante la lavorazione: **2.527 test superati su 228 file**. Le ultime aggiunte ai test, successive all’avvio della suite, sono state validate con **58 test mirati superati su 5 file**, inclusi payload HTTP ElevenLabs simulati, cache tra lingue, placeholder, migrazione e persistenza. `git diff --check` senza errori di whitespace. Nel browser: wizard italiano, cambio EN↔IT, preferenza dopo reload, console/impostazioni, navigazione Pocket e risposta italiana del CEO demo; nessun errore console rilevato. Demo isolata arrestata al termine. Nessuna richiesta AI o ElevenLabs reale.

**Limiti:** prima copertura, non traduzione integrale; pannelli secondari, descrizioni avanzate, notifiche, errori, log, etichette 3D e alcuni script demo restano inglesi. La lingua dei modelli è istruita, non imposta tecnicamente. Voci italiane dipendenti da dispositivo/provider. Dettagli in `docs/languages.md`.

### Integrazione delle modifiche precedenti

I commit `8adf85b` e `6365848` sono stati integrati nel `main` del fork tramite [PR #2](https://github.com/rosariomoscato/cubefarm/pull/2), merge `7c9c148`. CI superata su Ubuntu, macOS e Windows. Le note seguenti conservano lo stato storico alla registrazione iniziale; nessuna pubblicazione npm del fork.

### Registro del fork e README

| Feature | Tipo | Breve descrizione |
| --- | --- | --- |
| Registro storico del fork | Documentazione | Introdotto `docs/FORK_CHANGELOG.md`, con date, feature, descrizioni, riferimenti, verifiche e modello per le prossime voci. |
| README del fork | Documentazione | Esplicitati supporto OpenCode V2, varianti, Analisi e onboarding opzionale; distinto l'avvio da sorgente del fork dal pacchetto npm originale. |

**Riferimento:** commit documentale successivo a `8adf85b` sul branch `feat/opencode-ceo`; non ancora pubblicato né integrato nel `main` del fork.

### Integrazione OpenCode V2 e analisi manuale

**Riferimento:** commit `8adf85b`, branch `feat/opencode-ceo`. Alla registrazione iniziale: commit locale, non ancora pubblicato né integrato nel `main` del fork.

| Feature | Tipo | Breve descrizione |
| --- | --- | --- |
| OpenCode per il CEO | Nuova funzionalità | Il CEO può usare Claude Code oppure OpenCode V2 nel runtime **Real terminals**. Claude resta il predefinito; il runtime Agent SDK resta Claude-only. |
| Aggiornamento V2 per i membri del team | Compatibilità | Configurazione, plugin e collegamenti MCP migrati alle API V2 per tutti gli agenti OpenCode, non solo per il CEO. |
| Controllo della versione OpenCode | Validazione | Verifica durante il rilevamento, nella scelta/creazione degli agenti e prima di ogni nuovo processo. V1, major non supportate e versioni non verificabili vengono rifiutate; nessun aggiornamento automatico di OpenCode. |
| Launcher OpenCode su Windows | Correzione | Risoluzione dello shim `.cmd` dell'app desktop verso l'eseguibile reale, anche con spazi nel percorso. |
| Servizi OpenCode separati | Isolamento | Ogni terminale usa `--standalone`, separando istruzioni, configurazione e callback dal servizio OpenCode condiviso del manager. Non è una sandbox. |
| Strumenti dell'ufficio per il CEO | Integrazione | Collegamento MCP di sessione per consultare e gestire l'ufficio; supporto alla configurazione MCP V2 anche per il browser. |
| Completamento dei turni | Correzione | Gestione dell'envelope `event.data` e degli eventi nativi `session.execution.*`, con deduplicazione delle notifiche e gestione di errori/interruzioni. Risolto il caso di risposta pronta nel terminale ma stato ancora su **Working**. |
| Selettore dei modelli disponibili | Nuova funzionalità | **Browse OpenCode models** offre ricerca, filtro per provider, varianti, ripristino del predefinito e inserimento manuale. Disponibile per CEO, team, nuove assunzioni, approvazioni e impostazioni generali. |
| Catalogo modelli in sola lettura | Privacy / prestazioni | Inventario dipendente dal progetto, cache di 30 secondi e aggiornamento esplicito. Al browser arrivano solo metadati di selezione, non impostazioni, header o credenziali dei provider. La lettura non genera richieste AI. |
| Varianti di ragionamento OpenCode | Interfaccia | Il controllo effort seleziona le varianti supportate dal modello e salva `provider/model#variant`; non mostra più il vecchio effort di Claude come se fosse attivo su OpenCode. |
| Cambio modello nelle chat riprese | Correzione | Modello e variante scelti vengono applicati al prossimo incarico, incluse le chat riprese da inattive. Un terminale inattivo viene ricreato se la selezione cambia. |
| Modalità Analisi | Nuova funzionalità | Un membro locale può leggere e spiegare il repository senza issue, worktree di sviluppo, installazione delle dipendenze o pipeline PR. Nessun sollecito automatico per commit, push o PR. |
| Follow-up e ripartenza delle analisi | Ciclo di vita | L'agente resta riservato ai messaggi manuali fino a **Clear desk** o a un nuovo incarico esplicito. Nessun riavvio automatico dell'analisi interrotta e nessun nudge automatico del watchdog. |
| Onboarding del CEO opzionale | Controllo manuale | È possibile collegare un progetto saltando sia lo studio iniziale del CEO sia la pianificazione dal brief. Le revisioni periodiche hanno un'impostazione separata. |
| Controlli prima del collegamento | Controllo manuale | Assegnazione automatica delle issue e merge automatico possono essere disattivati prima di collegare il repository. |
| Test e documentazione | Verifica | Aggiunti test di regressione per V2, catalogo, varianti, ripresa delle chat, analisi e onboarding opzionale; aggiornate le guide del fork. |

**Verifiche effettuate:**

- Suite completa locale: **2.517 test superati su 227 file**, con `npm.cmd test -- --maxWorkers=1 --testTimeout=15000`.
- TypeScript e build: `npm.cmd run build` riuscito. Restano avvisi di bundling relativi a Rapier e alla dimensione dei chunk, non errori di compilazione.
- Prova reale del CEO con OpenCode **2.2.1**: strumenti MCP, risposta nella chat, completamento automatico e ripresa della conversazione.
- Prova reale di un membro del team con **GPT-6.1 Sol, variante medium**: analisi riuscita con soli strumenti `read`, `glob` e `grep`, nessuna modifica al checkout e nessuna issue o PR creata.
- Prove eseguite in un ufficio isolato, mantenendo intatta l'installazione globale originale.

**Limiti attuali:** OpenCode e Analisi non sono supportati sulle macchine cloud; le regole di sola lettura sono istruzioni per l'agente, non un blocco tecnico delle scritture. Il test reale del membro del team riguarda l'analisi, non un ciclo completo implementazione → PR → QA → merge. La CI del branch OpenCode non è ancora stata eseguita su GitHub.

### Ottimizzazione del pathfinding del roomba

| Feature | Tipo | Breve descrizione |
| --- | --- | --- |
| Collisioni lungo i segmenti | Prestazioni | Il controllo del percorso considera prima solo gli ostacoli vicini al segmento, evitando di ripetere verifiche su tutti i mobili a ogni campionamento. |
| Heap del pathfinding | Prestazioni | Ridotte le allocazioni temporanee negli inserimenti e nelle estrazioni dell'heap, mantenendo il comportamento del percorso. |
| Test del percorso | Verifica | Aggiunte verifiche di regressione; mantenute le soglie prestazionali, inclusa quella degli 8 ms. Test locali e CI su Ubuntu, macOS e Windows superati. |

**Riferimenti:** commit `f6e9f97`; [PR #1 del fork](https://github.com/rosariomoscato/cubefarm/pull/1), integrata nel `main` del fork con merge commit `86a22b8`.

## Modello per le prossime voci

```markdown
## AAAA-MM-GG

### Titolo del cambiamento

| Feature | Tipo | Breve descrizione |
| --- | --- | --- |
| Nome della feature | Nuova funzionalità / Correzione / Prestazioni / Documentazione | Cosa cambia e per chi. |

**Riferimenti e stato:** commit/PR, branch, integrazione o pubblicazione.
**Verifiche:** test o prove realmente eseguiti.
**Limiti:** eventuali limitazioni o aspetti ancora da validare.
```
