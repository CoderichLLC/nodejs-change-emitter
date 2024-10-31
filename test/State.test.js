const State = require('../src/State');

describe('State', () => {
  let $;

  const state = new State({
    turn: 0,
    nested: {
      attribute: 'value',
      deeply: { attribute: 'value' },
      array: [1, 'two', { three: 'three' }],
      map: new Map(),
      date: new Date(),
    },
  });

  test('state.turn', (done) => {
    $ = state.$((event) => {
      expect(event).toEqual({ value: 0, path: ['turn'], assign: 1 });
    }); state.turn++; $();

    $ = state.$((event) => {
      expect(event).toEqual({ value: 1, path: ['turn'], assign: 10 });
    }); state.turn = 10; $();

    $ = state.$((event) => {
      expect(event).toEqual({ value: 10, path: ['turn'], assign: undefined });
      done();
    }); delete state.turn; $();
  });

  test('state.newAttribute', (done) => {
    $ = state.$((event) => {
      expect(event).toEqual({ value: undefined, path: ['newAttribute'], assign: 5 });
      done();
    }); state.newAttribute = 5; $();
  });

  test('state.nested.attribute', (done) => {
    $ = state.$((event) => {
      expect(event).toEqual({ value: 'value', path: ['nested', 'attribute'], assign: 'rich' });
    }); state.nested.attribute = 'rich'; $();

    $ = state.$((event) => {
      expect(event).toEqual({ value: 'value', path: ['nested', 'deeply', 'attribute'], assign: 1 });
    }); state.nested.deeply.attribute = 1; $();

    $ = state.$((event) => {
      expect(event).toEqual({ value: undefined, path: ['nested', 'deeply', 'newAttribute'], assign: { another: { level: { deep: 1 } } } });
    }); state.nested.deeply.newAttribute = { another: { level: { deep: 1 } } }; $();

    $ = state.$((event) => {
      expect(event).toEqual({ value: 1, path: ['nested', 'deeply', 'newAttribute', 'another', 'level', 'deep'], assign: -4 });
      done();
    }); state.nested.deeply.newAttribute.another.level.deep -= 5; $();
  });

  test('state.nested.{array|map|date}', (done) => {
    $ = state.$((event) => {
      expect(event).toEqual({ value: [1, 'two', { three: 'three' }], path: ['nested', 'array'], apply: ['push', 'anew', 'nelly'] });
    }); state.nested.array.push('anew', 'nelly'); $();
    expect(state.nested.array.length).toBe(5);

    $ = state.$((event) => {
      expect(event).toEqual({ value: expect.any(Map), path: ['nested', 'map'], apply: ['set', 'key', 'value'] });
    }); state.nested.map.set('key', 'value'); $();
    expect(state.nested.map.size).toBe(1);

    $ = state.$((event) => {
      expect(event).toEqual({ value: expect.any(Date), path: ['nested', 'date'], apply: ['setHours', 0, 0, 0, 0] });
      done();
    }); state.nested.date.setHours(0, 0, 0, 0); $();
  });

  test('Object.assign', () => {
    $ = state.$((event) => {
      console.log(event);
      // expect(event).toEqual({ value: [1, 'two', { three: 'three' }], path: ['nested', 'array'], apply: ['push', 'anew', 'nelly'] });
    }); Object.assign(state.nested, { attribute: 'changed', anotherAttribute: {} }); $();
  });
});
