# Droidsembly — inventario e proposta 02

Revisione 02: dettaglio laterale circolare con lineette allineate sul medesimo asse prospettico, contorno del cubo arrotondato, riflesso sul visore, gradienti sulle facce e antenna sferica con ombra alla base. Aggiornata soltanto la tavola di approvazione.

Stato: revisione 02 approvata dal manager e integrata nella copia di sviluppo. Base: `925f32a`, branch `feat/droidsembly-branding`. Dettagli degli asset definitivi e verifiche in `README.md`.
Riferimento: pagina 03 dell’Identity Book allegata in conversazione; nessun PDF o asset originale individuato nel progetto. `preview.html` è una ricostruzione vettoriale offline, non un’estrazione degli originali.

## Superfici e asset censiti

| Superficie | File | Intervento censito |
| --- | --- | --- |
| Ingresso | `client/src/ui/StartScreen.tsx` | Simbolo ✻, versione prodotto, fallback nome; conservare azienda configurata |
| Wizard | `client/src/ui/SetupWizard.tsx` | Simbolo ✻ e titolo cubefarm |
| Touch | `client/src/pocket/Pocket.tsx` | Simbolo, versione, titolo documento e fallback azienda |
| Browser | `client/index.html` | Favicon SVG inline cubo arancione, titolo, Apple title, theme-color |
| PWA | `client/public/manifest.webmanifest` | Name/short_name, icone e colori; conservare id, scope e start_url |
| Installazione | `client/public/icons/` | icon.svg, icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png |
| Notifiche | `client/src/notifications.ts`, `server/notifier.ts`, `server/pwa.ts` | Nome visibile test, icona 192, badge-96.png monocromatico; verificare aggiornamento cache precache |
| Console | `client/src/ui/ManagerConsole.tsx` | Placeholder azienda e versione prodotto |
| Intestazioni e colloqui | `client/src/ui/HUD.tsx`, `client/src/ui/Interview.tsx` | Fallback prodotto e simbolo intestazione colloqui |
| Lobby 3D | `client/src/world/Lobby.tsx` | Simbolo insegna azienda e Manager Console; preservare nome azienda e payoff |
| Disegno 3D | `client/src/world/draw.ts` | Esaminare il simbolo a riga 185 nel contesto; lo spinner operativo non è automaticamente un marchio |
| News e tetto | `client/src/world/events/news.ts`, `client/src/world/roof/billboardLayout.ts` | Fallback nome prodotto |
| Modalità foto | `client/src/photo/overlay.ts`, `photoMode.ts`, `gallery.ts`, `shots.ts` | Timbro ✻, fallback nome e prefisso nuovi download; nessuna rinomina di file esistenti |

L’attuale pacchetto distribuisce una web app con PWA; non risultano configurazioni Electron/Tauri in package.json. Le icone installabili censite sono quelle del manifest e Apple touch.

## Confini della rinomina

- Autorizzato: marchio e diciture visibili del prodotto → Droidsembly, payoff inglese “Software, assembled by agents.”
- Conservare nomi aziendali configurati, inclusi Soot & Stars, e payoff lobby “Small droids. Serious software.”
- Conservare package/bin, cartelle dati, chiavi localStorage, eventi e protocolli `cubefarm:*`, identificativi notifiche/PWA, launcher, porte e rete.
- Link di documentazione upstream e attribuzioni MIT non sono asset grafici da sostituire indiscriminatamente.
- I simboli ✻ nei log Claude, parser e spinner sono indicatori operativi: non sostituirli come se fossero loghi.

## Tavola originale approvata

`preview.html`: logo chiaro/scuro, tre fondi icona, prove 16/32/48 px, assemblaggio singolo di circa 2,2 secondi, movimento ridotto statico. Nessuna dipendenza di rete, richiesta AI o accesso ai dati dell’app.

Colori approssimati dal riferimento, font di sistema temporaneo dichiarato nella tavola originale (il riferimento indica Sora). Gli asset definitivi usano Sora locale, SVG separati, variante favicon semplificata, esportazioni PNG/maskable con area sicura e badge monocromatico. La tavola originale resta la sorgente geometrica riproducibile del robot approvato, non una schermata dell’app finale.

Inventario completato con ricerca senza distinzione maiuscole/minuscole: aggiornata anche la scritta CUBEFARM sul cabinato arcade (`client/src/world/decor/Decorations.tsx`). Aggiornate le diciture presentate dai terminali/notifiche, dal controllo anteprima e dai futuri commenti/report generati, oltre al solo nome prodotto nei prompt agenti/CEO. Nessun cambiamento alle istruzioni operative, ai comandi CLI, alle attribuzioni o ai protocolli.
