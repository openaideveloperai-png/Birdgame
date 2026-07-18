import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html, script, css] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../main.js', import.meta.url), 'utf8'),
  readFile(new URL('../style.css', import.meta.url), 'utf8'),
]);

test('prototype wires the playable browser surface', () => {
  assert.match(html, /<canvas id="game"/);
  assert.match(html, /script type="module" src="main\.js"/);
  assert.match(script, /PerspectiveCamera/);
  assert.match(script, /requestPointerLock/);
});

test('core puzzle systems are present', () => {
  assert.match(script, /function blockedAt/);
  assert.match(script, /function grabOrDrop/);
  assert.match(script, /desiredScale/);
  assert.match(script, /function updatePuzzle/);
  assert.match(script, /SPATIAL FOLD TRAVERSED/);
  assert.match(script, /function throwCube/);
  assert.match(script, /cubeVelocity/);
  assert.match(script, /cube\.userData\.scale >= 1\.35/);
});

test('interface includes third-person guidance and responsive treatment', () => {
  assert.match(html, /WHEEL.*Scale object/);
  assert.match(html, /CLICK.*Throw object/);
  assert.match(html, /id="objective"/);
  assert.match(html, /Third-person spatial puzzle game/);
  assert.match(css, /@media \(max-width: 650px\)/);
  assert.match(script, /const player = new THREE\.Group/);
  assert.match(script, /SpotLight/);
});
