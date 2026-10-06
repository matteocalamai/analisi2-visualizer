const getElement = (id) => document.getElementById(id);
const rangeInputIds = ['tmin', 'tmax', 'xmin', 'xmax', 'ymin', 'ymax', 'zmin', 'zmax'];

function evaluateNumber(expression) {
  return math.evaluate(expression);
}

function createRange(start, end, steps) {
  return Array.from({ length: steps }, (_, index) => start + ((end - start) * index) / (steps - 1));
}

function normalizeExpression(expression) {
  return expression
    .replace(/[−–]/g, '-')
    .replace(/π/g, 'pi')
    .replace(/\be\^\s*\(/g, 'exp(')
    .replace(/\bi\s*?/g, 'i*')
    .replace(/\)\s*\(/g, ')*(')
    .replace(/(\d)\s*([a-zA-Z])/g, '$1*$2');
}

function evaluateExpression(expression, scope) {
  return math.evaluate(normalizeExpression(expression), scope);
}

function getModeFromFormula(formula) {
  const text = formula.toLowerCase();
  if (/\bp\s*\(t\)|\bi\b|complex/.test(text)) return 'complex';
  if (/\br\s*\(t\)/.test(text)) return 'polar';
  if (/\bz\s*=|f\s*\(x\s*,\s*y\)/.test(text)) return 'surface';
  if (/\bx\s*\(t\).*\by\s*\(t\).*\bz\s*\(t\)/s.test(text)) return 'param3';
  if (/\bx\s*\(t\).*\by\s*\(t\)/s.test(text)) return 'param2';
  return /\bz\b/.test(text) ? 'implicit3' : 'implicit2';
}

function getRightHandSide(formula, variable) {
  const escapedVariable = variable.replace(/[()]/g, '\\$&');
  const match = formula.match(new RegExp(`(?:^|[;\\n])\\s*${escapedVariable}\\s*=\\s*([^;\\n]+)`, 'i'));
  return match ? match[1].trim() : null;
}

function getDomainValues() {
  return Object.fromEntries(rangeInputIds.map((id) => [id, evaluateNumber(getElement(id).value)]));
}

function get3DLayout() {
  return {
    margin: { l: 0, r: 0, b: 0, t: 20 },
    scene: {
      xaxis: { title: 'x', showgrid: true, zeroline: true },
      yaxis: { title: 'y', showgrid: true, zeroline: true },
      zaxis: { title: 'z', showgrid: true, zeroline: true },
      aspectmode: 'cube',
    },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
  };
}

function get2DLayout() {
  return {
    margin: { l: 55, r: 20, b: 48, t: 30 },
    xaxis: { title: 'x', scaleanchor: 'y', gridcolor: '#dce1ec', zerolinecolor: '#8290a9' },
    yaxis: { title: 'y', gridcolor: '#dce1ec', zerolinecolor: '#8290a9' },
    showlegend: true,
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
  };
}

function plot(data, layout) {
  Plotly.newPlot('plot', data, layout, { responsive: true });
}

function vectorLength(vector) {
  return Math.hypot(...vector);
}

function normalizeVector(vector) {
  const length = vectorLength(vector);
  return length > 1e-9 ? vector.map((value) => value / length) : null;
}

function crossProduct([ax, ay, az], [bx, by, bz]) {
  return [ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx];
}

function scaleVector(vector, scalar) {
  return vector.map((value) => value * scalar);
}

function addVectors(...vectors) {
  return vectors[0].map((_, index) => vectors.reduce((total, vector) => total + vector[index], 0));
}

function getFrenetFrame(xFormula, yFormula, zFormula, t, step, vectorScale, planeScale) {
  const pointAt = (parameter) => [
    Number(evaluateExpression(xFormula, { t: parameter })),
    Number(evaluateExpression(yFormula, { t: parameter })),
    Number(evaluateExpression(zFormula, { t: parameter })),
  ];
  const center = pointAt(t);
  const before = pointAt(t - step);
  const after = pointAt(t + step);
  const velocity = after.map((value, index) => (value - before[index]) / (2 * step));
  const acceleration = after.map((value, index) => (value - (2 * center[index]) + before[index]) / (step * step));
  const tangent = normalizeVector(velocity);
  const binormal = tangent && normalizeVector(crossProduct(velocity, acceleration));
  const normal = binormal && normalizeVector(crossProduct(binormal, tangent));
  if (!tangent || !normal || !binormal || !center.every(Number.isFinite)) return null;

  const endpoint = (direction) => addVectors(center, scaleVector(direction, vectorScale));
  const planeCorner = (tangentSign, normalSign) => addVectors(center, scaleVector(tangent, tangentSign * planeScale), scaleVector(normal, normalSign * planeScale));
  const corners = [planeCorner(-1, -1), planeCorner(1, -1), planeCorner(1, 1), planeCorner(-1, 1)];
  return { center, tangent, normal, binormal, endpoint, corners };
}

function createFrenetAnimation(xFormula, yFormula, zFormula, xValues, yValues, zValues, parameterValues, showPlane) {
  const span = Math.max(
    Math.max(...xValues) - Math.min(...xValues),
    Math.max(...yValues) - Math.min(...yValues),
    Math.max(...zValues) - Math.min(...zValues),
    1,
  );
  const step = Math.max((parameterValues.at(-1) - parameterValues[0]) / 12000, 1e-5);
  const selectedIndices = Array.from({ length: 100 }, (_, index) => Math.round(2 + (index * (parameterValues.length - 5)) / 99));
  const frames = selectedIndices.map((index) => {
    const frenet = getFrenetFrame(xFormula, yFormula, zFormula, parameterValues[index], step, span * .16, span * .27);
    if (!frenet) return null;
    const { center, tangent, normal, binormal, endpoint, corners } = frenet;
    const data = [
      { x: [center[0]], y: [center[1]], z: [center[2]] },
      { x: [center[0], endpoint(tangent)[0]], y: [center[1], endpoint(tangent)[1]], z: [center[2], endpoint(tangent)[2]] },
      { x: [center[0], endpoint(normal)[0]], y: [center[1], endpoint(normal)[1]], z: [center[2], endpoint(normal)[2]] },
      { x: [center[0], endpoint(binormal)[0]], y: [center[1], endpoint(binormal)[1]], z: [center[2], endpoint(binormal)[2]] },
    ];
    if (showPlane) data.push({ x: corners.map((corner) => corner[0]), y: corners.map((corner) => corner[1]), z: corners.map((corner) => corner[2]) });
    return { name: `t=${parameterValues[index].toFixed(3)}`, data, traces: data.map((_, traceIndex) => traceIndex + 1) };
  }).filter(Boolean);
  return frames;
}

function drawFrenetCurve(xFormula, yFormula, zFormula, xValues, yValues, zValues, parameterValues) {
  const showPlane = getElement('osculating').checked;
  const frames = createFrenetAnimation(xFormula, yFormula, zFormula, xValues, yValues, zValues, parameterValues, showPlane);
  if (!frames.length) throw Error('Non è possibile calcolare il triedro: scegli una curva regolare con curvatura non nulla.');
  const start = frames[0].data;
  const data = [
    { type: 'scatter3d', mode: 'lines', x: xValues, y: yValues, z: zValues, line: { width: 6, color: '#4f46e5' }, name: 'curva' },
    { type: 'scatter3d', mode: 'markers', x: start[0].x, y: start[0].y, z: start[0].z, marker: { size: 5, color: '#171c2e' }, name: 'punto' },
    { type: 'scatter3d', mode: 'lines', x: start[1].x, y: start[1].y, z: start[1].z, line: { width: 8, color: '#df3d43' }, name: 'T · tangente' },
    { type: 'scatter3d', mode: 'lines', x: start[2].x, y: start[2].y, z: start[2].z, line: { width: 8, color: '#16845d' }, name: 'N · normale' },
    { type: 'scatter3d', mode: 'lines', x: start[3].x, y: start[3].y, z: start[3].z, line: { width: 8, color: '#3b70c8' }, name: 'B · binormale' },
  ];
  if (showPlane) data.push({ type: 'mesh3d', x: start[4].x, y: start[4].y, z: start[4].z, i: [0, 0], j: [1, 2], k: [2, 3], color: '#f5a623', opacity: .34, name: 'piano osculatore', showscale: false });
  const layout = get3DLayout();
  layout.showlegend = true;
  layout.legend = { x: .02, y: .98, bgcolor: 'rgba(255,255,255,.76)' };
  layout.updatemenus = [{
    type: 'buttons', direction: 'left', x: .02, y: .02, xanchor: 'left', yanchor: 'bottom', pad: { r: 8, t: 8 },
    buttons: [
      { label: '▶ Riproduci', method: 'animate', args: [null, { fromcurrent: true, frame: { duration: 55, redraw: true }, transition: { duration: 0 } }] },
      { label: '❚❚ Pausa', method: 'animate', args: [[null], { mode: 'immediate', frame: { duration: 0, redraw: false }, transition: { duration: 0 } }] },
    ],
  }];
  layout.sliders = [{ active: 0, x: .02, len: .76, y: 0, pad: { b: 2, t: 28 }, currentvalue: { prefix: 'Posizione: ' }, steps: frames.map((frame) => ({ label: frame.name, method: 'animate', args: [[frame.name], { mode: 'immediate', frame: { duration: 0, redraw: true }, transition: { duration: 0 } }] })) }];
  Plotly.newPlot('plot', data, layout, { responsive: true }).then(() => Plotly.addFrames('plot', frames));
  getElement('plotWrap').insertAdjacentHTML('beforeend', '<div class="frenet-legend"><span class="t">T tangente</span><span class="n">N normale</span><span class="b">B binormale</span></div>');
}

function drawParametricCurve(formula, mode, parameterValues) {
  const xFormula = getRightHandSide(formula, 'x(t)');
  const yFormula = getRightHandSide(formula, 'y(t)');
  const zFormula = getRightHandSide(formula, 'z(t)');
  if (!xFormula || !yFormula) throw Error('Per una curva parametrica scrivi x(t)=...; y(t)=...');

  const xValues = parameterValues.map((t) => evaluateExpression(xFormula, { t }));
  const yValues = parameterValues.map((t) => evaluateExpression(yFormula, { t }));
  const interpretation = `x(t) = ${xFormula}; y(t) = ${yFormula}`;

  if (mode === 'param3') {
    if (!zFormula) throw Error('Manca z(t).');
    const zValues = parameterValues.map((t) => evaluateExpression(zFormula, { t }));
    if (getElement('frenet').checked) drawFrenetCurve(xFormula, yFormula, zFormula, xValues, yValues, zValues, parameterValues);
    else plot([{ type: 'scatter3d', mode: 'lines', x: xValues, y: yValues, z: zValues, line: { width: 6, color: '#4f46e5' }, name: 'curva' }], get3DLayout());
    return interpretation;
  }

  const data = [
    { type: 'scatter', mode: 'lines', x: xValues, y: yValues, line: { width: 3, color: '#4f46e5' }, name: 'curva' },
    { type: 'scatter', mode: 'markers+text', x: [xValues[0]], y: [yValues[0]], text: ['inizio →'], textposition: 'top right', marker: { size: 10, color: '#ef4444' }, name: 'verso' },
  ];

  if (getElement('tangent').checked) {
    const t = parameterValues[Math.floor(parameterValues.length / 2)];
    const step = 1e-4;
    const x = evaluateExpression(xFormula, { t });
    const y = evaluateExpression(yFormula, { t });
    // Differenza centrale: è una stima numerica della derivata nella tangente.
    const derivativeX = (evaluateExpression(xFormula, { t: t + step }) - evaluateExpression(xFormula, { t: t - step })) / (2 * step);
    const derivativeY = (evaluateExpression(yFormula, { t: t + step }) - evaluateExpression(yFormula, { t: t - step })) / (2 * step);
    const scale = 0.35;
    data.push({ type: 'scatter', mode: 'lines', x: [x - scale * derivativeX, x + scale * derivativeX], y: [y - scale * derivativeY, y + scale * derivativeY], line: { dash: 'dot', color: '#f59e0b' }, name: `tangente t=${t.toFixed(2)}` });
  }

  plot(data, get2DLayout());
  return interpretation;
}

function drawComplexCurve(formula, parameterValues) {
  const complexFormula = getRightHandSide(formula, 'p(t)') || formula.replace(/^\s*p\s*=\s*/i, '');
  const values = parameterValues.map((t) => evaluateExpression(complexFormula, { t }));
  const xValues = values.map((value) => math.re(value));
  const yValues = values.map((value) => math.im(value));
  plot([
    { type: 'scatter', mode: 'lines', x: xValues, y: yValues, line: { width: 3, color: '#4f46e5' }, name: 'p(t)' },
    { type: 'scatter', mode: 'markers+text', x: [xValues[0]], y: [yValues[0]], text: ['inizio →'], textposition: 'top right', marker: { size: 10, color: '#ef4444' }, name: 'verso' },
  ], get2DLayout());
  return `Re p(t) = ${complexFormula}; Im p(t) = ${complexFormula}`;
}

function drawPolarCurve(formula, parameterValues) {
  const radiusFormula = getRightHandSide(formula, 'r(t)') || formula;
  const radii = parameterValues.map((t) => evaluateExpression(radiusFormula, { t }));
  plot([{ type: 'scatterpolar', mode: 'lines', r: radii, theta: parameterValues.map((t) => (t * 180) / Math.PI), line: { width: 3, color: '#4f46e5' } }], { margin: { l: 25, r: 25, b: 25, t: 25 }, polar: { radialaxis: { showgrid: true }, angularaxis: { showgrid: true } }, paper_bgcolor: 'rgba(0,0,0,0)' });
  return `r(t) = ${radiusFormula}; x=r cos(t), y=r sin(t)`;
}

function drawSurface(formula, domain) {
  const surfaceFormula = formula.replace(/^\s*(z\s*=|f\s*\(x\s*,\s*y\)\s*=)\s*/i, '');
  const xValues = createRange(domain.xmin, domain.xmax, 70);
  const yValues = createRange(domain.ymin, domain.ymax, 70);
  const zValues = yValues.map((y) => xValues.map((x) => evaluateExpression(surfaceFormula, { x, y })));
  plot([{ type: 'surface', x: xValues, y: yValues, z: zValues, colorscale: 'Viridis' }], get3DLayout());
  return `z = ${surfaceFormula}`;
}

function drawImplicitCurve(formula, domain) {
  const implicitFormula = formula.replace(/^\s*f\s*\(x\s*,\s*y\)\s*=\s*/i, '');
  const xValues = createRange(domain.xmin, domain.xmax, 150);
  const yValues = createRange(domain.ymin, domain.ymax, 150);
  const zValues = yValues.map((y) => xValues.map((x) => evaluateExpression(implicitFormula, { x, y })));
  plot([{ type: 'contour', x: xValues, y: yValues, z: zValues, contours: { start: 0, end: 0, size: 1, coloring: 'lines' }, line: { color: '#4f46e5', width: 3 }, showscale: false }], get2DLayout());
  return `F(x,y) = ${implicitFormula} = 0`;
}

function drawImplicitSurface(formula, domain) {
  const implicitFormula = formula.replace(/^\s*f\s*\(x\s*,\s*y\s*,\s*z\)\s*=\s*/i, '');
  const xValues = createRange(domain.xmin, domain.xmax, 27);
  const yValues = createRange(domain.ymin, domain.ymax, 27);
  const zValues = createRange(domain.zmin, domain.zmax, 27);
  const coordinates = { x: [], y: [], z: [], value: [] };

  // Coordinate e valori devono seguire lo stesso ordine per ogni punto del reticolo.
  for (const z of zValues) {
    for (const y of yValues) {
      for (const x of xValues) {
        coordinates.x.push(x);
        coordinates.y.push(y);
        coordinates.z.push(z);
        coordinates.value.push(evaluateExpression(implicitFormula, { x, y, z }));
      }
    }
  }

  plot([{
    type: 'isosurface',
    ...coordinates,
    isomin: -0.02,
    isomax: 0.02,
    surface: { count: 1 },
    caps: { x: { show: false }, y: { show: false }, z: { show: false } },
    colorscale: 'Viridis',
  }], get3DLayout());
  return `F(x,y,z) = ${implicitFormula} = 0`;
}

function updateInterpretation(text) {
  getElement('formula').innerHTML = `<strong>Interpretazione:</strong> <code>${text.replace(/</g, '&lt;')}</code>`;
}

function draw() {
  try {
    document.querySelector('.frenet-legend')?.remove();
    const formula = getElement('expr').value;
    const selectedMode = getElement('type').value;
    const mode = selectedMode === 'auto' ? getModeFromFormula(formula) : selectedMode;
    const domain = getDomainValues();
    const parameterValues = createRange(domain.tmin, domain.tmax, 800);
    let interpretation;

    getElement('error').textContent = '';
    if (mode === 'param2' || mode === 'param3') interpretation = drawParametricCurve(formula, mode, parameterValues);
    else if (mode === 'complex') interpretation = drawComplexCurve(formula, parameterValues);
    else if (mode === 'polar') interpretation = drawPolarCurve(formula, parameterValues);
    else if (mode === 'surface') interpretation = drawSurface(formula, domain);
    else if (mode === 'implicit2') interpretation = drawImplicitCurve(formula, domain);
    else interpretation = drawImplicitSurface(formula, domain);

    updateInterpretation(interpretation);
    const is3dCurve = mode === 'param3';
    getElement('frenet').disabled = !is3dCurve;
    getElement('osculating').disabled = !is3dCurve || !getElement('frenet').checked;
    if (!is3dCurve) {
      getElement('frenet').checked = false;
      getElement('osculating').checked = false;
    }
    getElement('badge').textContent = is3dCurve && getElement('frenet').checked ? 'triedro animato' : mode.replace('param', 'parametrica ');
  } catch (error) {
    getElement('error').textContent = `Controlla la formula: ${error.message}`;
  }
}

document.querySelectorAll('.example').forEach((button) => {
  button.onclick = () => {
    getElement('type').value = button.dataset.kind;
    getElement('expr').value = button.dataset.formula;
    const [minimum, maximum] = button.dataset.t.split(',');
    getElement('tmin').value = minimum;
    getElement('tmax').value = maximum;
    draw();
  };
});

getElement('draw').onclick = draw;
getElement('frenet').onchange = () => {
  getElement('osculating').disabled = !getElement('frenet').checked;
  if (!getElement('frenet').checked) getElement('osculating').checked = false;
};
draw();
