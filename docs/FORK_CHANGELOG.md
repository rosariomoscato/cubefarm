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

## 2026-10-31

### PR #6: conclusione del collaudo guidato

**Stato:** collaudo delle superfici previste concluso; [PR #6](https://github.com/rosariomoscato/cubefarm/pull/6) ancora aperta, senza merge né aggiornamento dell’ufficio reale. Questa voce aggiorna gli stati provvisori delle verifiche sotto, conservati come cronologia.

- **CI:** [41205092554](https://github.com/rosariomoscato/cubefarm/actions/runs/41205092554) superata sul codice `7cc8df6`, inclusa la correzione della fixture del frigorifero e i suggerimenti del caffè. Questa registrazione finale modifica soltanto la documentazione.
- **Prove manuali del manager nella demo:** confermati decorazioni (acquisto, collocazione, raccolta, ripristino e scatola), dardi/ricarica, ping-pong, frigorifero/consumo, caffè corretto, telescopio e sdraio. Confermati ripresa di Cubetris e Cable Snake dopo chiusura del telefono, e cambio English/Italiano su giochi, fotografia, frigorifero e caffè con nomi invariati. La ripresa dei giochi non è un test di persistenza dopo ricarica della pagina.
- **Video:** ultimo test manuale con telecamera libera ferma, ufficio non congelato e scheda in primo piano riuscito: circa 10 s e movimento visibile nel file. Anche orbita e telecamera libera in movimento erano state confermate. Il precedente blocco non si è ripresentato nel nuovo controllo; nessuna modifica al registratore e nessuna causa accertata. Restano documentati i WebM vuoti osservati nell’automazione headless, senza generalizzarli al browser interattivo.
- **Limiti:** non si dichiara tradotta ogni stringa dell’applicazione; restano testi dinamici 3D, alcune viste/azioni delle schede e messaggi demo/server non coperti. Nessuna nuova suite completa locale: le verifiche complete remote sono distinte dai timeout locali storici. Il collaudo concluso non autorizza merge, pubblicazioni o aggiornamento del servizio reale.

### PR #6: correzione dei suggerimenti del frigorifero dopo prova manuale

**Stato:** correzione sullo stesso branch della [PR #6](https://github.com/rosariomoscato/cubefarm/pull/6), nessun merge né aggiornamento dell’ufficio reale.

**Aggiornamento della prova guidata:** il manager ha confermato il frigorifero dopo la correzione, oltre a telescopio e sdraio sulla terrazza.

**Caffè pronto:** la successiva prova del manager ha individuato il suggerimento `Take coffee` ancora inglese. Aggiunti `Prendi il caffè`, il ritiro della tazza non pronta e i due avvisi della macchina (tazza mancante/caffè pronto), senza cambiare preparazione o consumo. Verifica aggiornata: **72 test passati su otto file**, inclusi navigazione, frigorifero, caffè, consumo e notifier; TypeScript e build client/server superati. Primo comando build scaduto dopo il completamento del client, ripetizione completa riuscita senza modifiche alle soglie. Prova finale Edge/Playwright nella demo superata: ritiro tazza, preparazione tramite probe QA esistenti, suggerimento del caffè pronto EN/IT senza ricarica, avviso italiano, ritiro con E e tre sorsi disponibili. Nessun errore console, lingua ripristinata. I primi tentativi perdevano la mira durante la cattura del mouse; prova ripetuta dopo aver liberato il mouse, senza cambiare l’applicazione.

**Correzione del test CI:** [41203904948](https://github.com/rosariomoscato/cubefarm/actions/runs/41203904948) è fallito sui tre sistemi esclusivamente in `navigationText.test.ts`: il test generico costruiva l’azione `fridge` senza `op`, mentre i suggerimenti di apertura/chiusura sono riconosciuti solo con `op: 'door'`. Fixture aggiornata con l’azione corretta, senza cambiare codice applicativo, aspettative di traduzione o controlli sui testi personali. Ripetizione locale: **63 test passati su sette file**, prima dell’aggiunta del seguito sul caffè; nuova CI da verificare.

- **Localizzazione:** la prova del manager ha individuato i suggerimenti 3D `Grab…` ancora inglesi. Tradotti apertura/chiusura del frigorifero, presa/scorte esaurite dei prodotti e avvisi di mani occupate, consumo prioritario e rifornimento. Il tasto indicato nell’avviso segue la configurazione dei comandi. Solo formati canonici corrispondenti all’azione e al prodotto vengono tradotti; etichette personali dei pranzi e formati sconosciuti restano letterali.
- **Verifica:** **60 test passati su sei file**, incluse tutte le otto categorie di prodotti disponibili/esauriti, fallback inglese, azioni/etichette non corrispondenti, contenuti personali, frigorifero/consumo e notifier. TypeScript e build superati con i consueti avvisi. Prova Edge/Playwright nella sola demo: apertura con E, suggerimento della pizza con cambio EN/IT senza ricarica, presa, avviso “uno alla volta”, consumo con E di cibo e bevanda e conteggi decrescenti in EN/IT; nessun errore console. Presa della bevanda e tentativo a mani occupate tramite probe QA esistente; nessuna modifica al comportamento per facilitare il test. Lingua ripristinata.
- **Esiti manuali riferiti dal manager sul quarto blocco:** acquisto/collocazione della pianta, raccolta/ripristino/comandi della scatola, dardi/ricarica e ping-pong confermati funzionanti durante la guida. Video con orbita confermato riproducibile; anche telecamera libera in movimento confermata con file di circa 2,3 MB. Un precedente video con telecamera libera ferma si bloccava poco dopo l’inizio: resta da chiarire; nessuna correzione del registratore o dichiarazione di completa risoluzione.
- **CI precedente:** il quarto blocco `2ee7645` ha superato [41201052701](https://github.com/rosariomoscato/cubefarm/actions/runs/41201052701). La presente correzione richiede la propria CI dopo il push. Restano i residui e i limiti video descritti sotto; nessuna nuova suite completa locale.

### PR #6: fotografia, giochi, catalogo, carriere e HUD specializzati

**Stato:** quarto blocco sul branch della [PR #6](https://github.com/rosariomoscato/cubefarm/pull/6), senza merge né aggiornamento dell’ufficio reale.

| Feature | Tipo | Breve descrizione |
| --- | --- | --- |
| Fotografia | Localizzazione | Pannello, filtri, galleria, controlli foto/clip/replay istantaneo e messaggi generati. Le note mantengono il testo inglese originale per i consumatori esistenti e affiancano metadati strutturati per il cambio lingua; nomi dei file, didascalie esportate ed errori tecnici restano letterali. |
| Giochi | Localizzazione | Menu, controlli accessibili e testi canvas di Cubetris, Cable Snake e Desk Pet. I riquadri dei messaggi adattano il corpo del testo alla larghezza disponibile; nessuna modifica alle meccaniche o ai formati di salvataggio. Il cucciolo traduce solo frasi canoniche, saluto col nome corrente e promozioni note; messaggi storici e personalizzati restano invariati. |
| Catalogo e carriere | Localizzazione | Nomi e descrizioni delle decorazioni/trofei integrati, scatola, spazi di collocazione, monete, schede e tabella delle carriere, anzianità, gradi e risultati. Titoli delle PR, nomi degli agenti, dettagli storici e ID sono preservati. |
| HUD specializzati | Localizzazione | Indicazioni per cibo, bevande, decorazioni e schede trasportate, dardi/ricarica, terrazza e ping-pong. I messaggi di ping-pong sono isolati in una funzione pura, con inglese predefinito invariato. |
| Evidenze | Verifica | [Cubetris IT](screenshots/italian-ui/specialized-cubetris-it.png), [foto mobile IT](screenshots/italian-ui/specialized-photo-it-mobile.png), [carriere IT](screenshots/italian-ui/specialized-careers-it.png), solo demo con identità fittizie. |

**Verifiche del quarto blocco:** **108 test passati su 12 file**, inclusi giochi, fotografia pura, gradi/rami delle carriere in EN/IT, tutti i motivi dei punti nel ping-pong, frasi del cucciolo, preservazione di nomi/file/errori e controllo notifier client/server. TypeScript e build client/server superati, con i consueti avvisi bundle/Rapier e nessun cambio alle soglie. Edge/Playwright nella demo isolata: menu/canvas EN/IT, avvio e pausa dei due giochi, ripresa dopo chiusura del telefono, apertura/cura del cucciolo, foto PNG a dimensioni corrette, galleria e cambio lingua della nota già visibile, catalogo, tabella e scheda carriera con titoli PR invariati. Nessun errore console nel passaggio finale senza registrazione video; nessun overflow orizzontale nelle viste foto/cucciolo a 390 px in EN/IT. Lingua della demo ripristinata; salvataggi del cucciolo e preferenze cambiati soltanto nel browser temporaneo. Acquisto/collocazione delle decorazioni e interazioni 3D degli HUD non esercitati end-to-end in questo blocco.

**Limite video emerso durante la prova:** Edge headless ha prodotto clip WebM di zero byte sia a 1 s sia a 4 s, con errore `ERR_REQUEST_RANGE_NOT_SATISFIABLE` nell’anteprima blob. I messaggi di salvataggio cambiano lingua, ma ciò **non valida l’export video**. Nessun confronto conclusivo con la baseline: non viene attribuito con certezza all’ambiente o a un difetto preesistente. Nessuna modifica al registratore per aggirare il problema; resta da verificare separatamente in browser interattivo. I tentativi browser hanno inoltre richiesto correzioni dei selettori e una ripetizione dopo timeout; il passaggio finale è distinto dai tentativi falliti.

**CI:** il terzo blocco `df67d0e` ha superato [41198204965](https://github.com/rosariomoscato/cubefarm/actions/runs/41198204965). Il quarto richiede la propria CI dopo il push; nessuna nuova suite completa locale, con i limiti storici conservati sotto.

**Residui:** alcune indicazioni dinamiche 3D/bersagli, viste e azioni delle schede e messaggi demo/server non coperti; identificatori tecnici e contenuti dell’utente intenzionalmente letterali. Il controllo delle chiavi esplicite non rileva ogni stringa inglese non marcata: nessuna dichiarazione di traduzione completa dell’applicazione.

### PR #6: guida, comandi e indicatori principali

**Stato:** terzo blocco sul branch della [PR #6](https://github.com/rosariomoscato/cubefarm/pull/6), senza merge né aggiornamento dell’ufficio reale.

| Feature | Tipo | Breve descrizione |
| --- | --- | --- |
| Guida estesa | Localizzazione | Tradotti i 33 paragrafi di aiuto, titoli, pulsanti e impostazioni audio, chiacchiere, giorno/notte e grafica. I paragrafi inglesi originali restano nel JSX; quelli italiani reinseriscono esplicitamente gli stessi tasti, enfasi e pulsanti. Test di corrispondenza uno-a-uno dei controlli e fallback sicuro se cambia la struttura. Nessuna sostituzione DOM o traduzione dei rapporti prestazioni. |
| Comandi | Localizzazione | Etichette delle azioni, sensibilità, gamepad, istruzioni, conflitti, riassegnazione e ripristino. I messaggi di riassegnazione già visibili seguono il cambio lingua. Codici e nomi dei tasti restano tecnici; nessuna modifica alle regole di assegnazione. |
| HUD e navigazione | Localizzazione | Stato connessione/riproduzione, riepiloghi dei piani, sessioni, telefono, avvisi di utilizzo, indicazioni principali, panoramica/edificio, elenco di agenti e visitatori ed espressioni. Tradotti solo prompt statici verificati per tipo di interazione: titoli di schede, nomi, output e formati sconosciuti restano letterali. |
| Evidenze | Verifica | [Guida IT](screenshots/italian-ui/guide-it.png), [comandi mobile IT](screenshots/italian-ui/controls-it-mobile.png), [comandi mobile EN](screenshots/italian-ui/controls-en-mobile.png), solo demo con identità fittizie. |

**Verifiche del terzo blocco:** **126 test passati su 14 file**, inclusi controlli i18n, separazione client/server del notifier, comandi, testi della diagnostica, visitatori e preservazione dei contenuti; TypeScript e build superati. Edge/Playwright nella demo isolata: guida e comandi IT/EN, cambio lingua senza ricaricare il messaggio di riassegnazione, assegnazione di un tasto, scambio per conflitto, ripristino e panoramica/edificio superati. Nessun errore console né overflow orizzontale nelle viste guida/comandi a 390 px; prova anche a 1440 px. La lingua della demo è ripristinata al termine; le preferenze dei tasti sono state modificate solo nel browser temporaneo di test. Nessuna nuova suite completa locale; i timeout del primo blocco rimangono documentati. La build conserva gli avvisi su dimensione dei bundle/import di Rapier, senza cambiare soglie o configurazione.

**Stato CI precedente:** [41194674870](https://github.com/rosariomoscato/cubefarm/actions/runs/41194674870) superata su `d1215c8`, dopo lo spostamento del test nel server. Non valida questo terzo blocco, che richiede una nuova CI sul proprio head.

**Copertura ancora residua:** HUD specializzati degli oggetti in mano e dei minigiochi, alcune indicazioni dinamiche 3D (bersagli, nomi e messaggi tecnici preservati), fotografia, giochi, catalogo/carriere, alcune viste delle schede e messaggi demo/server. Non si dichiara completa la localizzazione dell’applicazione. La demo resta aperta sulla 4431; il servizio reale sulla 4423 e i suoi dati non sono modificati.

### PR #6: centro di controllo e riepilogo della giornata

**Stato:** secondo blocco sullo stesso branch della [PR #6](https://github.com/rosariomoscato/cubefarm/pull/6), senza merge né aggiornamento dell’ufficio reale.

| Feature | Tipo | Breve descrizione |
| --- | --- | --- |
| Centro di controllo | Localizzazione | Tradotti spiegazioni sull’utilizzo, comandi, conferme, diagnostica, titoli e descrizioni delle metriche. Allarmi e segnalazioni watchdog vengono tradotti solo se corrispondono ai formati noti; nomi, dettagli diagnostici e formati sconosciuti restano letterali. |
| Riepilogo della giornata | Localizzazione | Nome italiano di Time-lapse; tradotti scheda, riepiloghi, velocità, intervalli di assenza, date, controlli di riproduzione e messaggi di caricamento/errore. Le etichette registrate nel diario restano inalterate. Nessun cambiamento a registrazione, permessi delle azioni o riproduzione. |
| Regressioni | Verifica | Copertura AST estesa alle due viste e alle etichette fornite da dati (metriche, rimedi, velocità). Test contro i messaggi canonici del watchdog per tutti i sei tipi, durate, nomi con placeholder/caratteri speciali, fallback inglese e dettagli tecnici letterali. |

**Verifiche di questo blocco:** 52 test passati su sei file; TypeScript e build superati. Prova Edge/Playwright nella sola demo isolata: entrambe le schede in IT/EN, pausa, avanzamento con tastiera, cambio velocità e ritorno al tempo reale superati, senza errori console. Primo tentativo di interazione fermato dalla cattura del mouse del canvas; ripetuto liberando il mouse, senza modificare l’app o forzare i clic. La demo resta disponibile sulla 4431 per il test del manager. La lingua della demo è stata ripristinata dopo la prova. Nessuna nuova esecuzione completa locale: i tre timeout del primo blocco restano documentati sotto; la precedente CI verde non valida questo nuovo codice.

**Residui:** guida estesa, controlli, HUD/3D, fotografia, giochi/catalogo/carriere, alcune viste delle schede e messaggi tecnici/demo restituiti dal server. Non si dichiara completa la traduzione dell’applicazione.

**Correzione CI del secondo blocco:** il [run 41193990605](https://github.com/rosariomoscato/cubefarm/actions/runs/41193990605) è fallito nei test sui tre sistemi: il nuovo test di localizzazione importava il watchdog server dalla cartella client, e il controllo di separazione client/server in `server/notifier.test.ts` lo rifiutava correttamente. Test spostato in `server/operationText.test.ts`, senza modifiche al codice applicativo o al controllo di sicurezza. Ripetizione locale: **29 test passati su quattro file**, incluso il controllo notifier, e TypeScript superato. Nuova CI da verificare; il primo run fallito non viene attribuito ai timeout preesistenti.

### Traduzione italiana: console, impostazioni e flusso operativo

**Stato:** primo blocco pubblicato sul branch `feat/complete-italian-ui` e nella [PR #6 del fork](https://github.com/rosariomoscato/cubefarm/pull/6), non ancora integrato in `main`. Il manager ha autorizzato esplicitamente l’apertura della PR nonostante i tre timeout locali riportati sotto, con tutti i limiti dichiarati e senza merge. Nessun rilascio npm o aggiornamento dell’ufficio reale.

| Feature | Tipo | Breve descrizione |
| --- | --- | --- |
| Console e progetti | Localizzazione | Tradotti testi descrittivi, conferme e campi della console manager, collegamento/creazione dei progetti, configurazione degli agenti e lista dei piani. Il selettore EN/IT esistente è mantenuto. |
| Kanban e anteprime | Localizzazione | Tradotti comandi, colonne, conferme di merge/chiusura/rinvio, stati delle anteprime e pannello QA. Titoli, descrizioni, rapporti QA, comandi, modelli, branch e output dei processi non vengono tradotti. |
| Impostazioni | Localizzazione | Coperti testi e controlli per accessibilità, profilo, cloud, notifiche, voce, meteo e festività, incluse etichette accessibili, placeholder e valori descrittivi dei cataloghi. Nessun cambiamento alle automazioni o ai segreti. |
| Telefono e modalità tascabile | Localizzazione | Tradotti riepiloghi aziendali, richieste sul team, avvisi, campi di chat, stato degli agenti e conferme delle approvazioni. Nomi e contenuti del manager/CEO sono conservati letteralmente. |
| Visita guidata e stati dinamici | Localizzazione | Tradotti i nove passaggi della visita guidata, le relative azioni, i riepiloghi dell’aggiornamento e le note generate dal Kanban/QA. Dettagli tecnici e note preesistenti restano letterali; nessun cambiamento alle decisioni del flusso di lavoro. |
| Regressioni | Verifica | Aggiunto controllo AST delle chiavi esplicitamente marcate nelle superfici coperte, controllo dei cataloghi condivisi e casi di conservazione letterale di nomi, titoli e identificatori. Rimane il test globale sui placeholder del dizionario. |

**Copertura residua del primo blocco:** guida estesa, controlli, HUD e testi 3D, centro di controllo, time-lapse, fotografia, giochi/catalogo/carriere e alcune viste delle schede. Centro di controllo e time-lapse sono affrontati nel secondo blocco descritto sopra. Il fallback inglese resta attivo; la presenza di una chiave nel dizionario non implica che tutte le relative viste la usino.

**Verifiche intermedie:** gruppi mirati da 21 e poi 62 test superati; build/TypeScript successivamente superati dopo la correzione di due errori nei dati dei nuovi test. Prima prova browser su demo isolata superata in Edge headless: cambio EN/IT su impostazioni desktop e modalità tascabile, modulo nuova issue e nessun overflow orizzontale nella schermata mobile verificata; nessun errore console rilevato. Il browser integrato non ha risposto ai comandi di apertura/navigazione; la prova è stata quindi eseguita direttamente con Playwright e il browser già installato, senza nuove installazioni.

**Limiti della suite completa:** la prima esecuzione ha superato il limite del comando dopo timeout nelle simulazioni 3D. La seconda, con due worker, è terminata con 2.549 test passati e 16 falliti su 234 file (224 passati, 10 falliti): timeout/soglie di prestazione 3D, scala, Git/workspace, test asincroni del server e due controlli della copertura i18n. Questa esecuzione è partita prima della conclusione delle modifiche; le chiavi segnalate dai controlli i18n sono presenti nell’albero finale, ma un run durante l’evoluzione dei sorgenti non può validare l’albero finale. I gruppi mirati successivi non sostituiscono una suite completa. Nessuna soglia o configurazione dei test modificata; gli esiti successivi sono riportati sotto. Non si dichiara la suite completa superata.

**Verifica sequenziale dell’albero finale:** 62 test passati su sei file, build/TypeScript superati e prova Edge/Playwright EN/IT superata. Verificati impostazioni a 390 px e 1.440 px, modulo issue del Kanban e testo della visita guidata, senza creazione di issue o avvio di agenti reali. Nessun errore console e nessun overflow orizzontale nella schermata mobile verificata. [Screenshot desktop IT](screenshots/italian-ui/desktop-it-settings.png), [desktop EN](screenshots/italian-ui/desktop-en-settings.png), [mobile IT](screenshots/italian-ui/pocket-it-settings.png), [mobile EN](screenshots/italian-ui/pocket-en-settings.png). Solo demo con percorsi fittizi nelle immagini. Demo arrestata; ufficio reale ancora attivo, senza incarichi e con automazioni disattivate.

**Confronto con il main invariato:** lo stesso ambiente ha riprodotto la soglia di prestazione dei percorsi e i timeout di simulazioni eventi, luce e lanci anche sul main (`20c3897`); il gruppo di sette file sul main è terminato con 71 test passati e cinque falliti, incluso un ulteriore timeout nel controllo dei sorgenti delle notifiche. Questo dimostra la riproducibilità di alcuni problemi sulla baseline, non la causa di tutti i fallimenti.

**Suite completa finale locale:** run sull’implementazione congelata `efcfcf151500d1695be8760a71866907176063d3`, con un solo worker e senza modificare i sorgenti durante l’esecuzione: **2.563 test passati, tre timeout; 231 file passati su 234**, durata circa 979 secondi. Timeout in `server/workspace.test.ts` (worktree PR già aperto sulla postazione dell’autore, 60 secondi), `client/src/world/toys/throwSim.test.ts` e `client/src/world/sky/indoor.test.ts` (5 secondi). I due timeout 3D sono stati riprodotti sulla baseline; quello workspace non è stato confrontato isolatamente con il main. Tutti i nuovi controlli i18n sono passati. La suite locale non è dichiarata verde e nessuna soglia è stata allentata.

**CI remota sullo stesso commit:** [run manuale 41190512044](https://github.com/rosariomoscato/cubefarm/actions/runs/41190512044) completato con successo su **Ubuntu, Windows e macOS**, inclusi TypeScript, suite completa, build e smoke test del pacchetto. Windows: **2.566 test passati**; Ubuntu e macOS: **2.564 passati e due saltati**; tutti i **234 file di test passati** su ciascun sistema. Il successo CI non viene presentato come esito positivo della suite su questo PC. Branch e PR pubblicati solo sul fork; merge non autorizzato. Le successive modifiche documentali non cambiano il codice dell’implementazione verificata; la CI della PR sul suo head è un controllo distinto dal run manuale qui citato.

### PR #5 integrata: consolidamento dipendenze e rifiniture del manager

**Riferimenti e stato:** [PR #5 del fork](https://github.com/rosariomoscato/cubefarm/pull/5), integrata con conferma esplicita del manager; merge commit `7b93a118bdbc24d071e4f48d892efa3bbe8a4e6c`. Checkout locale riportato su `main` e aggiornato in fast-forward, branch di lavoro conservati. Nessun incarico AI, modifica al progetto di prova o rilascio npm in questa operazione.

**Verifiche:** revisione mirata finale senza blocchi individuati (autovalutazione, non approvazione indipendente). [CI della PR, run 41146304695](https://github.com/rosariomoscato/cubefarm/actions/runs/41146304695), superata su Ubuntu, Windows e macOS per TypeScript, test, build e smoke test del pacchetto. Gli alberi Git del merge e della revisione verificata `cdee7b1` hanno lo stesso hash: `453c17f323f39f964bcc0fd479bc0bdfb497f60f`. Nessuna nuova esecuzione completa locale dei test viene implicata da questo confronto. La CI successiva su `main` è distinta e monitorata separatamente.

**Limiti storici conservati:** le instabilità locali, i limiti della diagnosi npm e il riuso della coda sviluppatore non vengono nascosti dal merge. I riferimenti sottostanti a modifiche solo locali, pubblicazione/merge non autorizzati e verifica remota in attesa descrivono le fasi precedenti, ora superate dalla conferma e dalla CI riportate qui.

### Consolidamento autorizzato e prova completa su un progetto reale

**Decisione del manager:** autorizzati push del branch `fix/manager-requested-refinements` e apertura di un’unica PR verso il `main` di `rosariomoscato/cubefarm`, comprendente `962ce11` (dipendenze/watchdog) e `4ac28f4` (richieste esplicite dopo QA positivo). Nessun merge o rilascio npm autorizzato. Le restrizioni di pubblicazione nelle sezioni sottostanti descrivono lo stato precedente.

**Validazione manuale completata:** dopo il riavvio dell’ufficio, la richiesta di rifinitura della [PR #13 di space-monsters](https://github.com/rosariomoscato/space-monsters/pull/13) è stata accettata tramite l’API manager, marcata `managerRequested` e affidata ad Ada sulla stessa PR. Terminata la modifica, il QA è passato al round 2 con esito positivo; il controllo dello stato ha confermato il ritorno a `passed`, senza errore dell’agente e con merge automatico ancora disattivato. Il manager ha approvato la nuova anteprima e ha eseguito il merge dall’app. GitHub ha confermato il merge `21e3bdac7a18df5ba819be01f309cd791a76cdb5`. Verificato così il ciclo issue → sviluppo → QA → rifinitura richiesta dal manager → nuovo QA → approvazione visiva → merge manuale nell’app, senza modifica manuale dello stato.

**Limiti conservati:** il secondo QA è stato svolto da Ada in una sessione separata; non è una revisione di un diverso autore umano. I rapporti del progetto dichiarano sette test, lint, typecheck, build e controlli desktop/320px nelle due lingue superati; i controlli remoti disponibili erano Vercel/preview, non una CI GitHub completa del progetto. Il difetto mobile preesistente dell’overlay iniziale è rimasto fuori ambito. Per CubeFarm restano i 207 test mirati su 14 file e build/TypeScript passati; le instabilità iniziali sono riportate sotto. La CI indipendente della nuova PR è ancora da verificare. Nessuna ulteriore richiesta AI a CEO o agenti per questo consolidamento documentale e pubblicazione.

### Richieste esplicite del manager dopo un QA positivo

**Stato:** modifiche sul branch locale `fix/manager-requested-refinements`, che include anche la correzione dipendenze/watchdog `962ce11` ancora non integrata nel main. Nessun push o merge autorizzato per questo seguito. Preparazione della correzione autorizzata dal manager; nessun nuovo incarico AI avviato per applicare la rifinitura.

| Feature | Tipo | Breve descrizione |
| --- | --- | --- |
| Richiedi modifiche dopo QA | Flusso | Nel Kanban, una PR pronta al merge offre il comando EN/IT «Request changes / Richiedi modifiche». Il dialogo richiede una nota (massimo 1.000 caratteri) e avverte dell’avvio di lavoro AI. Il percorso manager può rinviare una PR con stato `passed`; i tool di triage del CEO mantengono le restrizioni precedenti. Restano i rifiuti per PR chiuse/mergeate, sconosciute, in QA o già in correzione. |
| Richiesta distinta da un fallimento QA | Tracciamento | Il motivo `manager` identifica il lavoro aggiuntivo senza sostituire riepilogo, controlli, link al rapporto o SHA del precedente QA. Lo stato interno `failed` è riutilizzato esclusivamente come coda sviluppatore, non come nuovo verdetto; scheda e badge distinguono le modifiche richieste dal manager. Le istruzioni al developer, al QA successivo e alla ripresa dopo riavvio non dichiarano che il precedente QA sia fallito. |
| Nuovi commit e nuovo QA | Verifica | La richiesta conserva separatamente l’head corrente (`requestedSha`). Un semplice rerun di controlli o l’assenza di nuovi commit non soddisfa una richiesta di rifinitura. Dopo il push il lavoro torna al QA, non direttamente al merge, anche se il vecchio commit aveva superato tutti i controlli. Il retest esplicito non consuma il budget dei round richiesti dal QA. Anche il recupero dei vecchi budget non considera sufficiente un pass storico per una richiesta ancora pendente. |
| Test e build | Verifica | Gruppo finale: **207 test passati su 14 file**, incluse convalida del rinvio, conservazione del motivo manager nei successivi rinvii, esiti delle correzioni, prompt QA, recupero al riavvio, proprietà delle PR, merge gate, watchdog, dipendenze, schede, i18n, analisi e CEO. Build e TypeScript superati, soglie invariate. Verifica manuale del nuovo comando e del ciclo completo manager → developer → nuovo QA ancora da eseguire dopo il riavvio. |

**Contesto della richiesta:** la PR di prova aveva superato QA, ma il manager preferisce tre celle di punteggio allineate all’HUD anziché una riga discorsiva. I criteri completi sono stati pubblicati sulla stessa PR. I tentativi di rinvio con il server precedente sono stati rifiutati dalla convalida (nota troppo lunga, poi stato `passed` non ammesso), senza nuovi incarichi. Nessuna manipolazione manuale dello stato dell’ufficio per aggirare la regola.

**Limiti delle verifiche:** il primo gruppo esteso ha avuto timeout ed errori `ENOENT` nello stato temporaneo dei test. Un successivo run analisi/CEO ha rilevato un salvataggio lingua inatteso; il test isolato è passato. Un checkout temporaneo del precedente main e il branch corrente hanno poi entrambi superato i due file, e il gruppo finale completo è passato. Non è dimostrata la causa dell’instabilità; gli esiti iniziali non vengono cancellati dal risultato finale. Il checkout diagnostico temporaneo e il suo collegamento alle dipendenze sono stati rimossi senza toccare le dipendenze originali. Restano i consueti avvisi di build sui bundle e su Rapier.

**Prova installazione precedente:** l’installazione reale isolata, senza avvio di Ada, è infine riuscita in 408 secondi e ha scritto il marker coerente con package e lockfile. Il successivo incarico sulla prima issue è partito; questo non garantisce prestazioni future del registry. Il workflow della vecchia factory resta disabilitato e il merge automatico del progetto resta spento.

## 2026-10-30

### Preparazione dipendenze: watchdog coordinato e attesa visibile

**Stato:** correzione sul nuovo branch locale `fix/dependency-install-watchdog`, non integrata nel `main` e non pubblicata. Indagine e sviluppo autorizzati dal manager senza nuove richieste AI, riavvio dell’ufficio o riassegnazione automatica dell’issue di prova.

| Feature | Tipo | Breve descrizione |
| --- | --- | --- |
| Timeout coordinati per fase | Correzione | Il watchdog distingue una preparazione Git bloccata dall’installazione dipendenze in attesa o in esecuzione. Quando il runtime segnala `Installing dependencies`, l’installatore mantiene la responsabilità del proprio timeout; il watchdog non rimette il lavoro in coda dopo i primi 10 minuti. Invariati il timeout locale npm di 15 minuti, il limite delle installazioni simultanee e i controlli sugli altri stati. Il segnale è del runtime, non persistito nello stato dell’agente. |
| Installazione meno silenziosa | Diagnostica | Ogni minuto di esecuzione locale di npm, il log riceve un avviso con il tempo trascorso e il timeout. Il messaggio è generato dall’ufficio, non inoltra output npm potenzialmente sensibile e non pretende di attestare progresso dei download. Il timer viene rimosso sia al successo sia al fallimento; l’attesa in coda non è conteggiata come esecuzione npm. Le note di preparazione sono riportate anche nel terminale già esistente dell’agente. |
| Regressioni isolate | Verifica | 71 test passati su otto file: watchdog, dipendenze, nuova integrazione installazione/watchdog, analisi, CEO, terminale, OpenCode runner e macchine cloud. Le sessioni simulate dimostrano che il lavoro resta in preparazione oltre 10 minuti durante l’installazione e parte una sola volta dopo la sua conclusione, sia in caso di successo sia di fallimento. Confermati gli invariati controlli sulle preparazioni senza installazione e sulle sessioni silenziose, e la pulizia dei timer di avanzamento. Build e TypeScript superati; nessuna modifica alle soglie dei test. |

**Causa osservata nella prima issue reale:** preparazione rimessa in coda dal watchdog a 10 minuti; successivo timeout di npm a 15 minuti, senza marker di installazione completata. Nel log npm sono presenti numerosi fetch mancanti dalla cache con tempi da circa due minuti fino a oltre 14 minuti e un tentativo `ECONNRESET`. Non risultavano nuove esecuzioni della precedente factory; l’issue era priva dell’etichetta `ready` che ne attivava il dispatch. Il workflow di collegamento è stato poi disabilitato su autorizzazione esplicita, senza eliminare repository o segreti.

**Limiti:** un successivo `npm ping` al registry ufficiale è riuscito in circa un secondo, ma non dimostra che i download siano tornati veloci né separa gli effetti di rete, cache, disco o carico locale. Nessuna nuova installazione reale, cambio di registry/proxy, pulizia cache o modifica antivirus effettuati. Il problema ambientale dei download lenti non è dichiarato risolto. La nuova correzione server richiede un riavvio prima della prova manuale; l’issue resta da riassegnare soltanto con il manager. Restano gli avvisi preesistenti di build su bundle e import Rapier. La prima versione del nuovo test d’integrazione non isolava il ritardo simulato della preparazione macchina: corretto il mock, poi superato il gruppo completo riportato sopra.

### PR #4 integrata: correzioni OpenCode e risultati Markdown

**Riferimenti e stato:** [PR #4 del fork](https://github.com/rosariomoscato/cubefarm/pull/4) integrata con conferma esplicita del manager; merge commit `acf7c0ba022ef8fcd4fd8cc50eddd3cd258b972b`. Checkout locale riportato sul `main` e aggiornato in fast-forward. I branch di lavoro sono conservati; nessuna pubblicazione npm, nessuna modifica al progetto di prova e nessuna nuova richiesta AI.

**Verifiche:** revisione mirata del diff senza problemi bloccanti individuati (autovalutazione, non approvazione indipendente); [CI della PR, run 41134350240](https://github.com/rosariomoscato/cubefarm/actions/runs/41134350240), superata su Ubuntu, Windows e macOS per TypeScript, test, build e smoke test del pacchetto. Il confronto Git tra l’albero del merge e la revisione CI `1d7b153` non mostra differenze. I precedenti 148 test locali e le conferme manuali del manager restano descritti sotto; nessuna nuova esecuzione locale completa è implicata dal confronto degli alberi.

**Documentazione e limiti:** questa voce aggiorna solo lo stato di integrazione. Restano validi i limiti sugli estratti delle analisi precedenti, sulla conservazione dei log e sull’assenza di sandbox. Le sezioni sottostanti che indicano branch locale, merge non autorizzato o CI in attesa sono registrazioni storiche. La CI successiva su `main` è distinta dalla CI della PR e viene monitorata separatamente.

### Autorizzazione alla PR delle correzioni OpenCode e della vista Markdown

**Decisione del manager:** autorizzati push del branch `fix/opencode-first-run-terminal` e apertura di una PR esclusivamente su `rosariomoscato/cubefarm`, verso il `main` del fork, per la CI su Ubuntu, Windows e macOS. Nessun merge o rilascio npm autorizzato.

**Contenuto:** correzioni del commit `fa4e3fa` (cartella iniziale del CEO e risposta persistente del terminale), presentazione e conservazione del risultato Markdown del commit `232931d`. Il manager ha confermato la visualizzazione corretta anche dopo il riavvio. Verifiche locali: 148 test su 12 file, build e TypeScript superati; CI remota delle nuove modifiche ancora da verificare. Le restrizioni di pubblicazione nelle sezioni sottostanti descrivono gli stati precedenti.

### Analisi reale verificata e risultato Markdown separato dal terminale

**Stato:** seguito locale sul branch `fix/opencode-first-run-terminal`, dopo il commit `fa4e3fa`; nessun push, PR o merge di queste correzioni. Il manager ha verificato manualmente il catalogo OpenCode dopo il riavvio e la permanenza della risposta del CEO dopo il completamento e il cambio scheda. La prova successiva di analisi è stata autorizzata separatamente.

| Feature | Tipo | Breve descrizione |
| --- | --- | --- |
| Prima analisi manuale reale | Verifica | Risposta italiana su un repository del manager con OpenCode e GPT-6.1 Terra. Al controllo successivo: checkout Git pulito; agente in stato `done`, senza errori, branch, issue o PR associati; nessuna issue/PR restituita dalla ricerca GitHub, su tutti gli stati, degli elementi aggiornati nell’intervallo della prova. Assegnazione e merge automatici ancora disattivati, revisioni del CEO a zero e coda vuota. |
| Risultato leggibile | Interfaccia | Le analisi concluse mostrano la risposta in un riquadro Markdown, usando il renderer sicuro già presente (HTML non eseguito, protocolli pericolosi disabilitati, immagini remote non caricate). Terminale e log tecnico restano disponibili in una sezione richiudibile, montata solo quando viene aperta. Nuove etichette EN/IT. Nessuna modifica al layout dei terminali durante il lavoro o degli altri task. |
| Risposta integrale delle nuove analisi | Persistenza | Al completamento riuscito, il Markdown completo è conservato come voce `reply` nel log persistente e distribuito tramite il watch esistente, non nei normali snapshot. Non è limitato all’anteprima tecnica di 30 righe; resta soggetto alla normale conservazione del log. La vista seleziona solo la risposta dell’ultima richiesta, senza confondere risultati degli strumenti o follow-up precedenti. |
| Compatibilità con analisi precedenti | Interfaccia | Quando esiste solo la vecchia anteprima tecnica, questa è resa come Markdown e indicata esplicitamente come **estratto**, senza ricostruire o inventare le righe mancanti. L’output originale resta nel terminale. Nessuna nuova richiesta AI o modifica dello stato dell’ufficio per recuperarlo. |
| Regressioni e browser | Verifica | 148 test passati in 12 file (nuova presentazione/estrazione, analisi, CEO, catalogo, terminale, runner, plugin, i18n e journal); build e TypeScript superati. Nel browser dell’ufficio esistente verificati l’estratto salvato, quattro intestazioni, una tabella, etichette italiane, terminale tecnico inizialmente smontato e successivamente apribile senza perdere il risultato. Nessuna nuova generazione AI durante sviluppo o verifica della vista. |

**Limiti della verifica di sola lettura:** non era stato registrato un confronto prima/dopo della prova, quindi il checkout pulito e le tracce disponibili non escludono modifiche temporanee poi annullate o operazioni non registrate. Le regole dell’analisi sono istruzioni, non una sandbox. Il salvataggio integrale è stato verificato con sessioni simulate e lettura dello stato isolato su disco, non ripetendo l’analisi reale. Le nuove modifiche server richiedono un riavvio dell’ufficio per le analisi future; la vista client è stata verificata riutilizzando i log già disponibili. I primi tentativi paralleli di test/typecheck hanno raggiunto il timeout del comando; le verifiche successive, eseguite separatamente, sono passate. Restano gli avvisi preesistenti di build su bundle e import Rapier.

### Correzioni locali: primo catalogo OpenCode e risposta del CEO nel terminale

**Stato:** modifiche sul branch locale `fix/opencode-first-run-terminal`, non integrate nel `main`, non pubblicate su npm. Merge rinviato alla conclusione dei test e alla conferma del manager.

| Feature | Tipo | Breve descrizione |
| --- | --- | --- |
| Catalogo prima del primo incarico | Correzione | La lettura dei modelli del CEO crea prima la sua cartella dedicata, in modo idempotente. OpenCode non riceve più una posizione inesistente (HTTP 404). Nessun avvio del CEO, generazione AI o creazione di checkout; le posizioni dei repository non vengono create implicitamente. |
| Risposta finale persistente nel terminale | Correzione | Quando una sessione OpenCode viene chiusa, la risposta finale passa dallo schermo alternativo interattivo allo scrollback normale, che può riadattarsi alle dimensioni del riquadro. I caratteri di controllo della risposta sono rimossi. Le sessioni mantenute attive conservano il loro schermo interattivo. |
| Regressioni isolate | Verifica | 30 test passati in quattro file: `ceoRuntime`, `opencodeModels`, `terminal`, `cliRunnerOpenCode`. Coperti creazione della cartella prima del catalogo, letture ripetute senza sessioni, chiusura del CEO, ridimensionamento, replay dello snapshot e rimozione dei controlli terminale. Nessuna nuova richiesta AI reale. |
| Verifica estesa | Verifica | 91 test passati su sette file, includendo anche `cliRunner`, `clis` e `opencodePlugin`. Build di produzione e TypeScript superati; `git diff --check` senza errori. Restano gli avvisi di build già presenti sui bundle e sull’import di Rapier. Nessun nuovo run CI remoto avviato per queste correzioni. |

**Diagnosi e limiti:** nel primo ufficio reale il CEO ha risposto in italiano con OpenCode e il modello scelto dal manager. La risposta è rimasta salvata nel telefono. La diagnostica senza generazione ha trovato il testo nello snapshot del terminale; un riquadro più basso può tagliare le prime righe dello schermo alternativo dopo che la CLI si è chiusa e non può più ridisegnarlo. La correzione conserva il risultato in formato testuale, non promette di mantenere intatto ogni dettaglio grafico della TUI. La verifica manuale delle correzioni sul nuovo processo resta da completare; l’ufficio già in esecuzione non è stato riavviato o modificato per applicarle.

**CI precedente chiusa:** il [run su main 41088218071](https://github.com/rosariomoscato/cubefarm/actions/runs/41088218071), commit `e6c17c9`, è infine passato su Ubuntu, Windows e macOS. I primi due tentativi macOS non avevano ottenuto un runner hosted per limiti di capacità ARM64; il tentativo successivo ha eseguito tutti i passaggi con successo, senza modifiche a codice, workflow, soglie o timeout. Questo esito riguarda il main precedente, non le nuove correzioni locali.

### Integrazione EN/IT nel main del fork e verifica successiva

**Riferimenti e stato:** [PR #3 del fork](https://github.com/rosariomoscato/cubefarm/pull/3), integrata con autorizzazione esplicita del manager; merge commit `2a5200de7ebb63b639c0dcfb6cb028659c74dd99`. Checkout locale aggiornato in fast-forward sul `main` del fork. Nessuna cancellazione del branch di lavoro, nessun aggiornamento dell’installazione globale e nessuna pubblicazione npm.

| Feature | Tipo | Breve descrizione |
| --- | --- | --- |
| CI indipendente superata | Verifica | [Run 41084777570](https://github.com/rosariomoscato/cubefarm/actions/runs/41084777570) sulla revisione `fa9d3e2`: 230 file superati su ogni sistema. Windows: 2.536 test passati; Ubuntu/macOS: 2.534 passati e 2 test riservati a Windows saltati. TypeScript, build e smoke test demo del pacchetto superati su tutti e tre i sistemi, inclusa la soglia invariata degli 8 ms. |
| Revisione finale e merge | Integrazione | Revisione mirata senza blocchi individuati, uscita dalla bozza e successiva autorizzazione separata al merge. Nessuna modifica al pathfinding o alle soglie dei test. |
| Verifica del main integrato | Verifica | Confronto Git senza differenze tra l’albero del merge e la revisione passata in CI; nuova build/TypeScript e 129 test mirati su 12 file superati. |
| Nuova demo isolata | Verifica | Controllati cambio EN/IT, preferenza italiana dopo reload, navigazione Pocket, dettatura simulata che conserva la bozza senza invio automatico, interruzione con Esc e risposta italiana del CEO demo. Nessun errore console rilevato; demo e scheda diagnostica arrestate al termine. Nessuna cattura del microfono o richiesta AI/ElevenLabs reale da parte dell’agente. |

**Limiti conservati:** la localizzazione è iniziale e non integrale. La dettatura hardware in Chrome è stata verificata dall’utente; il controllo browser successivo al merge usa riconoscimento simulato. Il risultato positivo della CI non cancella i fallimenti prestazionali locali né dimostra che il solo piano energetico fosse la causa. Le sezioni precedenti/sottostanti mantengono gli stati storici di bozza, sospensione e indagine.

**Aggiornamento documentale:** README e report allineati allo stato integrato, senza ulteriori cambiamenti al codice applicativo. La CI sul `main` documentale, quando disponibile, è separata dal run della PR riportato sopra.

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
