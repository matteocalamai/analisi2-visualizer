# Analisi 2 Visualizer

Un piccolo visualizzatore interattivo per esplorare formule, curve e superfici di Analisi 2 direttamente nel browser.

## Funzionalità

- Curve parametriche 2D e 3D
- Curve complesse `p(t)` e curve polari `r(t)`
- Curve implicite `F(x,y)=0`
- Superfici esplicite `z=f(x,y)` e implicite `F(x,y,z)=0`
- Animazione puntuale del triedro di Frenet per curve parametriche 3D
- Piano osculatore opzionale, aggiornato durante l’animazione
- Riconoscimento automatico del tipo di formula
- Grafici interattivi, modalità chiara/scura e layout responsive

## Esempi inclusi

Deltoide complesso, curva di Lissajous, elica 3D, rosa polare, cerchio implicito e superficie ondulata.

## Utilizzo

Scarica o clona il repository e apri `index.html` in un browser moderno. Non sono necessari build step, server locale o installazioni.

### Triedro di Frenet e piano osculatore

Per una curva parametrica 3D, ad esempio `x(t)=cos(t); y(t)=sin(t); z(t)=t/4`, seleziona **Anima il punto con il triedro di Frenet** e premi **Disegna**. Il grafico mostra i vettori tangente `T`, normale principale `N` e binormale `B`; i comandi di riproduzione, pausa e cursore permettono di esplorare singoli valori di `t`.

Attivando **Mostra il piano osculatore nel punto animato**, viene visualizzato il piano generato da `T` e `N`. La funzionalità richiede una curva regolare con curvatura non nulla nel punto considerato.

## Dipendenze

Il progetto carica [math.js](https://mathjs.org/) e [Plotly](https://plotly.com/javascript/) tramite CDN per valutare le formule e disegnare i grafici.

## Note

Le formule usano la sintassi di math.js, per esempio `sin`, `cos`, `sqrt`, `pi` e `^`. Per le superfici implicite il grafico è ottenuto tramite campionamento numerico: formule molto complesse possono richiedere qualche istante.

Se il riconoscimento automatico non individua il tipo corretto, è possibile selezionarlo manualmente dal menu.
