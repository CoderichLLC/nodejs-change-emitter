const ChangeEmitter = require('../src/ChangeEmitter');

describe('ChangeEmitter', () => {
  const { proxy, emitter } = new ChangeEmitter({
    turn: 0,
    nested: {
      attribute: 'value',
      deeply: { attribute: 'value' },
      array: [1, 'two', { three: 'three', four: 4, array: [1, 2, 3] }],
      map: new Map(),
      date: new Date(),
    },
  });

  test('proxy.turn', (done) => {
    emitter.once('turn', (event) => {
      expect(event).toEqual({ oldVal: 0, newVal: 1, path: ['turn'] });
    }); proxy.turn++;

    emitter.once('turn', (event) => {
      expect(event).toEqual({ oldVal: 1, newVal: 10, path: ['turn'] });
    }); proxy.turn = 10;

    emitter.once('turn', (event) => {
      expect(event).toEqual({ oldVal: 10, newVal: undefined, path: ['turn'] });
      done();
    }); delete proxy.turn;
  });

  test('proxy.newAttribute', (done) => {
    emitter.once('newAttribute', (event) => {
      expect(event).toEqual({ oldVal: undefined, newVal: 5, path: ['newAttribute'] });
      done();
    }); proxy.newAttribute = 5;
  });

  test('proxy.nested.attribute', (done) => {
    emitter.once('nested/attribute', (event) => {
      expect(event).toEqual({ oldVal: 'value', newVal: 'rich', path: ['nested', 'attribute'] });
    }); proxy.nested.attribute = 'rich';

    emitter.once('**', (event) => {
      expect(event).toEqual({ oldVal: 'value', newVal: 1, path: ['nested', 'deeply', 'attribute'] });
    }); proxy.nested.deeply.attribute = 1;

    emitter.once('**', (event) => {
      expect(event).toEqual({ oldVal: undefined, newVal: { another: { level: { deep: 1 } } }, path: ['nested', 'deeply', 'newAttribute'] });
    }); proxy.nested.deeply.newAttribute = { another: { level: { deep: 1 } } };

    emitter.once('**', (event) => {
      expect(event).toEqual({ oldVal: 1, newVal: -4, path: ['nested', 'deeply', 'newAttribute', 'another', 'level', 'deep'] });
    }); proxy.nested.deeply.newAttribute.another.level.deep -= 5;

    emitter.once('**', (event) => {
      expect(event).toEqual({ oldVal: 4, newVal: 5, path: ['nested', 'array', '2', 'four'] });
      done();
    }); proxy.nested.array[2].four++;
  });

  test('proxy.nested.array functions', (done) => {
    emitter.once('**', (event) => {
      expect(event).toEqual({ oldVal: proxy.nested.array, newVal: proxy.nested.array, path: ['nested', 'array'], apply: ['push', 'anew', 'nelly'] });
    }); proxy.nested.array.push('anew', 'nelly');
    expect(proxy.nested.array.length).toBe(5);

    emitter.once('**', (event) => {
      expect(event).toEqual({ oldVal: proxy.nested.array, newVal: proxy.nested.array, path: ['nested', 'array'], apply: ['splice', 1, 1] });
    }); proxy.nested.array.splice(1, 1);
    expect(proxy.nested.array.length).toBe(4);

    emitter.once('**', (event) => {
      expect(event).toEqual({ oldVal: 5, newVal: 6, path: ['nested', 'array', '1', 'four'] });
      done();
    }); proxy.nested.array[1].four++;
  });

  test('proxy.nested.{map|date} functions', (done) => {
    emitter.once('**', (event) => {
      expect(event).toEqual({ oldVal: expect.any(Map), newVal: expect.any(Map), path: ['nested', 'map'], apply: ['set', 'key', 'value'] });
    }); proxy.nested.map.set('key', 'value');
    expect(proxy.nested.map.size).toBe(1);

    emitter.once('**', (event) => {
      expect(event).toEqual({ oldVal: expect.any(Date), newVal: expect.any(Date), path: ['nested', 'date'], apply: ['setHours', 0, 0, 0, 0] });
      done();
    }); proxy.nested.date.setHours(0, 0, 0, 0);
  });

  test('Object.assign', (done) => {
    let count = 0, listener;

    emitter.on('**', listener = (event) => {
      switch (count++) {
        case 0: {
          expect(event).toEqual({ oldVal: 'rich', newVal: 'changed', path: ['nested', 'attribute'] });
          break;
        }
        default: {
          expect(event).toEqual({ oldVal: undefined, newVal: {}, path: ['nested', 'anotherAttribute'] });
          emitter.off('**', listener);
          done();
          break;
        }
      }
    }); Object.assign(proxy.nested, { attribute: 'changed', anotherAttribute: {} });
  });

  test('Direct object', (done) => {
    proxy.nested.hero = { hp: 10, ma: 10 };

    emitter.once(proxy.nested.hero, (event) => {
      expect(event).toEqual({ oldVal: 10, newVal: 20, path: ['nested', 'hero', 'hp'] });
      done();
    });

    proxy.nested.hero.hp = 20;
  });
});
