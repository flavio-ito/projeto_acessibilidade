const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const compiled = ts.transpileModule(fs.readFileSync('src/navigation.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const sandbox = { exports: {} };
vm.runInNewContext(compiled, sandbox);
const { appReducer, initialState, isAppState, journeySteps } = sandbox.exports;

test('busca, alternativa, atraso e recuperação preservam o destino e a rota', () => {
  let state = appReducer(initialState, { type: 'search', origin: ' Rua A ', destination: ' Biblioteca ' });
  assert.equal(state.screen, 'routes');
  assert.equal(state.destination, 'Biblioteca');
  state = appReducer(state, { type: 'select', route: 0 });
  state = appReducer(state, { type: 'navigate', screen: 'alternative' });
  state = appReducer(state, { type: 'alternative' });
  assert.equal(state.screen, 'journey');
  assert.equal(state.selectedRoute, 3);
  assert(journeySteps(state).some(step => step.includes('27')));
  state = appReducer(state, { type: 'start' });
  assert(state.started);
  assert.equal(state.screen, 'delay');
  state = appReducer(state, { type: 'navigate', screen: 'location' });
  const restored = appReducer(initialState, { type: 'restore', state: JSON.parse(JSON.stringify(state)) });
  assert.equal(restored.screen, 'location');
  assert.equal(restored.selectedRoute, 3);
  state = appReducer(restored, { type: 'navigate', screen: 'journey' });
  assert.equal(state.destination, 'Biblioteca');
});
test('voltar respeita o histórico e início encerra a pilha', () => {
  let state = appReducer(initialState, { type: 'search', origin: 'Rua A', destination: 'Rua B' });
  state = appReducer(state, { type: 'select', route: 1 });
  state = appReducer(state, { type: 'back' });
  assert.equal(state.screen, 'routes');
  state = appReducer(state, { type: 'navigate', screen: 'home' });
  assert.equal(state.history.length, 0);
  assert.equal(appReducer(state, { type: 'back' }), state);
});
test('rota sem baldeação não exibe metrô e personaliza o destino', () => {
  const state = { ...initialState, selectedRoute: 2, destination: 'Biblioteca' };
  assert.equal(journeySteps(state).length, 3);
  assert(!journeySteps(state).some(step => step.includes('Metrô')));
  assert(journeySteps(state).at(-1).includes('Biblioteca'));
  assert.equal(journeySteps({ ...state, selectedRoute: 1 }).length, 5);
});
test('busca inválida, rota inválida e estado salvo corrompido são rejeitados', () => {
  assert.equal(appReducer(initialState, { type: 'search', origin: ' ', destination: 'Rua B' }), initialState);
  assert.equal(appReducer(initialState, { type: 'select', route: 99 }), initialState);
  for (const value of [null, {}, { ...initialState, selectedRoute: -1 }, { ...initialState, history: ['inexistente'] }, { ...initialState, started: 'yes' }]) {
    assert.equal(isAppState(value), false);
    assert.equal(appReducer(initialState, { type: 'restore', state: value }), initialState);
  }
  assert.equal(isAppState(JSON.parse(JSON.stringify(initialState))), true);
});
