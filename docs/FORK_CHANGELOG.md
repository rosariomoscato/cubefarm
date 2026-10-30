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
