# Recuperare Droidsembly

## App

Il repository https://github.com/rosariomoscato/droidsembly contiene il codice integrato su `main` e la cronologia. Clonarlo e seguire README.it.md per compilazione e avvio. La beta pubblicata è disponibile anche come `droidsembly@0.4.0-beta.1` su npm; la release GitHub registra commit e hash dell'artefatto.

## Sito

I sorgenti di https://droidsembly.com sono conservati nel repository privato `rosariomoscato/droidsembly-site`, accessibile al titolare. Include entrambi i Visual Book PDF, le immagini e la funzione contatti. README.md e RECOVERY.md di quel repository descrivono il collegamento al progetto Vercel esistente e la configurazione Resend. Una nuova clonazione è stata verificata con build e confronto byte per byte dei PDF e della funzione contatti.

## Dati personali e account

GitHub non conserva automaticamente lo stato degli uffici, i repository collegati con modifiche non pubblicate, i launcher personalizzati o le credenziali dei provider. Questi elementi richiedono un backup separato su una destinazione privata esterna al computer. Arrestare prima l'app e le sessioni per una copia coerente della home dati; non sovrascrivere la home originale durante le verifiche di ripristino.

Le chiavi del sito restano nei Secret Vercel, non nel codice. Per recuperare gli account usare i rispettivi metodi di recupero; se necessario rigenerare la chiave Resend e autenticare nuovamente GitHub CLI e provider AI.

Stato: destinazione privata kDrive e arresto dell'app autorizzati dal titolare; copia locale e verifica SHA256 in preparazione. Cifratura, verifica del ripristino e sincronizzazione cloud ancora da completare. Le copie locali aggiuntive dei sorgenti e degli appunti non proteggono dal guasto del disco finché non vengono trasferite fuori dal computer.

## Verifiche della revisione documentale (1 novembre 2026)

Typecheck e build superati. La suite locale con `npm test -- --maxWorkers=2` ha concluso con 2.626 test superati e 6 falliti in 5 file (959,30 secondi): `walkways.test.ts` mediana 14,0729 ms rispetto al limite di 8 ms; `sky/indoor.test.ts` e `toys/throwSim.test.ts` timeout di 5 secondi; `server/scale.test.ts` timeout di 120 secondi; due test di `server/workspace.test.ts` timeout di 60 secondi, oltre al timeout di 10 secondi del relativo `afterAll`. Non è stato dimostrato che questi fallimenti siano preesistenti.

Il titolare ha autorizzato esplicitamente l'apertura della sola PR documentale nonostante i fallimenti locali, subordinando il merge al superamento della CI GitHub.
