# Utilizzo AI / AI usage

Il Centro di controllo e le impostazioni Pocket mostrano le risorse usate da CEO e agenti. La stessa scheda è disponibile su desktop, tablet e smartphone, in inglese e italiano.

## Cosa significano i dati

- **Selezione configurata**: lo strumento/modello richiesto per il prossimo lavoro. Finché non arriva telemetria non è presentato come connessione osservata.
- **Connessione osservata**: provider/modello comunicati dal processo che sta lavorando, con data dell'osservazione. Il provider non viene ricavato da un elenco fisso.
- **Token**: contatori comunicati dal servizio. Ingresso, uscita, ragionamento e cache sono separati: alcune categorie possono sovrapporsi, quindi non vengono sommate in un totale inventato.
- **Costo riportato USD**: valore comunicato dal runtime, che può essere una stima ai prezzi API. Non è una fattura, un addebito dell'abbonamento o la quota residua.
- **Non disponibile**: nessun dato verificabile per quel campo. Non significa zero o utilizzo illimitato.
- **Segnale di quota**: ultimo avviso/rifiuto ricevuto, con orario e reset quando comunicato. Non è un sondaggio continuo del saldo dell'abbonamento.
- **Prossimo controllo di avvio**: termine del blocco locale. Se il provider non indica il reset, si applica un'attesa prudenziale di cinque minuti; non viene presentata come reset comunicato dal provider.

Lo storico conserva il provider/modello del messaggio originario. Le righe di stato Claude sono contatori cumulativi della sessione e sostituiscono la precedente osservazione; non sono consumo aggiuntivo da sommare ai messaggi. Le osservazioni SDK di costo risultato rimangono separate dai token dei singoli messaggi. Il pannello espone le ultime 200 osservazioni, mentre lo stato locale conserva lo storico completo. Osservare nuovamente un messaggio o un contatore non ne raddoppia il consumo.

## Copertura degli adattatori

| Runtime | Fonte | Disponibilità e limiti |
| --- | --- | --- |
| Claude Agent SDK | Messaggi assistant, risultati e rate-limit events | Token per messaggio, costo risultato quando comunicato, avvisi e rifiuti. Nessuna deduzione automatica dell'account/provider da un nome modello Claude. |
| Claude Code terminale | Statusline e hook StopFailure | Modello osservato, contatori cumulativi ingresso/uscita e costo, finestre rate_limits quando presenti. I valori della finestra di contesto non sono percentuali di quota. |
| OpenCode V2 | Plugin: contesto assistant, model.request, http.response e retry | Provider/modello dinamici; token/costo quando comunicati; HTTP 429 e segnali retry 429, inclusi quelli di trasporti non HTTP se esposti dal runtime. Retry-After letto senza consumare/modificare il body. |
| Codex terminale | Hook fidati e transcript locale della sola sessione | Provider session_meta, modello turn_context, delta dei contatori token_count e finestre primary/secondary disponibili. Costo non inventato. Le notify di completamento da sole non contengono queste metriche. |

Gli hook Codex restano soggetti al normale meccanismo di fiducia del CLI: non viene aggirato. Il formato transcript è best-effort e non è un contratto stabile. Il lettore accetta solo il file `.jsonl` indicato dall'hook, con session_id coincidente, fino a 16 MiB e 4.000 record di metadati; non scansiona le altre conversazioni. Se il file/formato non è utilizzabile, i campi restano non disponibili. I payload di utilizzo contengono esclusivamente campi consentiti, mai prompt, risposte, istruzioni, percorsi del transcript o credenziali. Le finestre Codex vecchie/già scadute non vengono riattivate rileggendo lo storico.

In OpenCode la connessione attiva viene cercata tramite l'integrazione del provider effettivamente usato. Si leggono solo metadati: **mai** `connection.resolve`, token, chiavi, headers o body delle richieste. Gli ID delle credenziali vengono trasformati sul server in identificatori opachi, distinti per macchina/strumento. Una connessione `key` identifica l'accesso API; OAuth da solo non dimostra quale piano di fatturazione sia in uso e resta «modalità non comunicata».

La scoperta viene aggiornata dalle sessioni osservate: non esegue richieste AI di prova né accede agli account per ricostruire il saldo. Cambiare login o impostazioni esternamente al processo può richiedere una nuova osservazione prima che l'identità sia aggiornata. Un nuovo provider è riconosciuto anche se non esiste un adattatore per leggerne il saldo.

L'endpoint OpenCode `experimental.usage.limits` riguarda **OpenCode Go e budget Console**, non tutte le sottoscrizioni dei provider collegati: non viene usato come quota universale. Per i provider che non espongono saldi attraverso le fonti sopra, quota residua e reset restano non disponibili fino a un segnale concreto.

## Rallentamento selettivo

- Un avviso limita solo l'avvio di nuovi issue sulla quota interessata al numero di «sessioni durante il rallentamento». Le sessioni su altre quote non entrano nel conteggio.
- Un limite raggiunto trattiene anche QA, correzioni e nuovi lavori CEO che usano quella quota. I lavori già avviati continuano.
- Le code e gli altri vincoli restano attivi: automazioni dei progetti, dipendenze, limite globale di sessioni, disponibilità agenti e approvazioni.
- Il limite di una correzione dell'autore non è motivo per spostarla automaticamente a un altro provider.
- Non si modificano automaticamente provider, modello, account o modalità di fatturazione. Non esiste passaggio automatico abbonamento → API.
- Un reset mancante comporta un'attesa locale esplicita; un dato mancante non prova che la quota sia libera.

Gli account identificati vengono raggruppati per strumento/provider/account/modalità. Se l'account non è identificabile, il gruppo è isolato per agente e provider: non viene presunta la condivisione tra Claude Code, Codex e OpenCode. Quando il segnale non specifica una finestra più stretta, il blocco riguarda prudentemente la connessione del provider, non un saldo attribuito ad altri provider.

### Confermare una quota condivisa

Nella scheda della risorsa, aprire **Associazione quota** e salvare la stessa etichetta sulle connessioni che condividono realmente la quota. La conferma permette anche la condivisione fra strumenti diversi, ad esempio Codex e OpenCode, senza presumerla dal solo nome OpenAI. Etichetta vuota rimuove l'associazione. L'associazione è legata all'identità della risorsa, non riassegna lo storico e non si trasferisce automaticamente a un provider/account diverso.

Entrare o uscire da un gruppo non cancella un blocco già attivo. **Riprendi questa quota** rimuove soltanto il rallentamento della quota selezionata, rispettando gli eventuali altri gruppi; un limite bloccante non viene cancellato prima del termine. Stato delle finestre, associazioni e osservazioni vengono salvati localmente e caricati dopo il riavvio.

## Verifica senza consumo reale

```powershell
npm.cmd run build
npm.cmd test -- server/aiUsage.test.ts server/codexUsage.test.ts server/usageScheduling.test.ts server/opencodePlugin.test.ts server/pacing.test.ts
node scripts/ai-usage-smoke.mjs
```

Lo smoke controlla prima che `127.0.0.1:4419` sia libera, crea uno `SWARM_HOME` temporaneo, usa esclusivamente il backend demo e chiude solo il processo che ha avviato. Seed: automazioni off, CEO heartbeat 0, scaling approve, coda vuota e nessun lavoro reale. Comprende EN/IT, scheda condivisa a tre dimensioni, dati mancanti, isolamento dei provider e ripresa selettiva. La prima prova 3D può essere lenta con rendering software; la prova ripetibile usa la stessa scheda attraverso Pocket senza caricare il mondo 3D.

### Riferimenti dei contratti verificati

- OpenCode V2: <https://opencode.ai/v2/docs/build/plugins/server> e <https://opencode.ai/v2/openapi.json>.
- Codex hooks e avvertenza sulla stabilità del transcript: <https://developers.openai.com/codex/hooks/>.
- Codex protocol: <https://github.com/openai/codex/blob/main/codex-rs/protocol/src/protocol.rs> (`TokenCountEvent`, `RateLimitWindow`, `SessionMeta`, `TurnContextItem`).
