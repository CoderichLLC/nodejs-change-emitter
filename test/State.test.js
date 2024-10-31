const ChangeEmitter = require('../src/ChangeEmitter');

describe('ChangeEmitter', () => {
  const { proxy, emitter } = new ChangeEmitter({
    turn: 0,
    nested: {
      attribute: 'value',
      deeply: { attribute: 'value' },
      array: [1, 'two', { three: 'three', four: 4 }],
      map: new Map(),
      date: new Date(),
    },
  });

  test('proxy.turn', (done) => {
    emitter.once('change', (event) => {
      expect(event).toEqual({ value: 0, path: ['turn'], assign: 1 });
    }); proxy.turn++;

    emitter.once('change', (event) => {
      expect(event).toEqual({ value: 1, path: ['turn'], assign: 10 });
    }); proxy.turn = 10;

    emitter.once('change', (event) => {
      expect(event).toEqual({ value: 10, path: ['turn'], assign: undefined });
      done();
    }); delete proxy.turn;
  });

  test('proxy.newAttribute', (done) => {
    emitter.once('change', (event) => {
      expect(event).toEqual({ value: undefined, path: ['newAttribute'], assign: 5 });
      done();
    }); proxy.newAttribute = 5;
  });

  test('proxy.nested.attribute', (done) => {
    emitter.once('change', (event) => {
      expect(event).toEqual({ value: 'value', path: ['nested', 'attribute'], assign: 'rich' });
    }); proxy.nested.attribute = 'rich';

    emitter.once('change', (event) => {
      expect(event).toEqual({ value: 'value', path: ['nested', 'deeply', 'attribute'], assign: 1 });
    }); proxy.nested.deeply.attribute = 1;

    emitter.once('change', (event) => {
      expect(event).toEqual({ value: undefined, path: ['nested', 'deeply', 'newAttribute'], assign: { another: { level: { deep: 1 } } } });
    }); proxy.nested.deeply.newAttribute = { another: { level: { deep: 1 } } };

    emitter.once('change', (event) => {
      expect(event).toEqual({ value: 1, path: ['nested', 'deeply', 'newAttribute', 'another', 'level', 'deep'], assign: -4 });
    }); proxy.nested.deeply.newAttribute.another.level.deep -= 5;

    emitter.once('change', (event) => {
      expect(event).toEqual({ value: proxy.nested.array[2].four, path: ['nested', 'array', 2, 'four'], assign: 5 });
      done();
    }); proxy.nested.array[2].four++;
  });

  test('proxy.nested.{array|map|date} functions', (done) => {
    emitter.once('change', (event) => {
      expect(event).toEqual({ value: proxy.nested.array, path: ['nested', 'array'], apply: ['push', 'anew', 'nelly'] });
    }); proxy.nested.array.push('anew', 'nelly');
    expect(proxy.nested.array.length).toBe(5);

    emitter.once('change', (event) => {
      expect(event).toEqual({ value: expect.any(Map), path: ['nested', 'map'], apply: ['set', 'key', 'value'] });
    }); proxy.nested.map.set('key', 'value');
    expect(proxy.nested.map.size).toBe(1);

    emitter.once('change', (event) => {
      expect(event).toEqual({ value: expect.any(Date), path: ['nested', 'date'], apply: ['setHours', 0, 0, 0, 0] });
      done();
    }); proxy.nested.date.setHours(0, 0, 0, 0);
  });

  test('Object.assign', () => {
    emitter.on('change', (event) => {
      console.log(event);
      // expect(event).toEqual({ value: [1, 'two', { three: 'three' }], path: ['nested', 'array'], apply: ['push', 'anew', 'nelly'] });
    }); Object.assign(proxy.nested, { attribute: 'changed', anotherAttribute: {} });
  });
});
