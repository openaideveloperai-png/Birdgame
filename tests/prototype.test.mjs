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
});

test('interface includes guidance and responsive treatment', () => {
  assert.match(html, /WHEEL.*Push \/ pull/);
  assert.match(html, /id="objective"/);
  assert.match(css, /@media \(max-width: 650px\)/);
});
