# Analisi 2 Visualizer

Un piccolo visualizzatore interattivo per esplorare formule, curve e superfici di Analisi 2 direttamente nel browser.

## Funzionalità

- Curve parametriche 2D e 3D
- Curve complesse `p(t)` e curve polari `r(t)`
- Curve implicite `F(x,y)=0`
- Superfici esplicite `z=f(x,y)` e implicite `F(x,y,z)=0`
- Animazione puntuale del triedro di Frenet per curve parametriche 2D e 3D, complesse e polari
- Piano osculatore opzionale, aggiornato durante l’animazione
- Riconoscimento automatico del tipo di formula
- Grafici interattivi, modalità chiara/scura e layout responsive

## Esempi inclusi

Deltoide complesso, curva di Lissajous, elica 3D, rosa polare, cerchio implicito e superficie ondulata.

## Utilizzo

Scarica o clona il repository e apri `index.html` in un browser moderno. Non sono necessari build step, server locale o installazioni.

### Triedro di Frenet e piano osculatore

Per una curva parametrica 2D o 3D, complessa o polare, seleziona **Anima il punto con il triedro di Frenet** e premi **Disegna**. Il grafico mostra i vettori tangente `T`, normale principale `N` e binormale `B`; i comandi di riproduzione, pausa e cursore permettono di esplorare singoli valori del parametro.

Il calcolo usa sempre una parametrizzazione spaziale interna `r(t) = (x(t), y(t), z(t))`: le curve 2D diventano `(x(t), y(t), 0)`, le polari diventano `(r(t) cos(t), r(t) sin(t), 0)` e le complesse diventano `(Re(p(t)), Im(p(t)), 0)`. Sono accettate sia `r(t)` sia `r(θ)` per le polari.

Attivando **Mostra il piano osculatore nel punto animato**, viene visualizzato il piano generato da `T` e `N`. La funzionalità richiede una curva regolare con curvatura non nulla nel punto considerato: quando il triedro non è definito, non vengono mostrati vettori o piani non validi. Le curve implicite 2D restano escluse, poiché il loro rendering corrente non fornisce una parametrizzazione ordinata affidabile.

## Dipendenze

Il progetto carica [math.js](https://mathjs.org/) e [Plotly](https://plotly.com/javascript/) tramite CDN per valutare le formule e disegnare i grafici.

## Note

Le formule usano la sintassi di math.js, per esempio `sin`, `cos`, `sqrt`, `pi` e `^`. Per le superfici implicite il grafico è ottenuto tramite campionamento numerico: formule molto complesse possono richiedere qualche istante.

Se il riconoscimento automatico non individua il tipo corretto, è possibile selezionarlo manualmente dal menu.
