const ChangeEmitter = require('../src/ChangeEmitter');

describe('ChangeEmitter', () => {
  const target = expect.any(Object);

  const { proxy, emitter } = new ChangeEmitter({
    turn: 0,
    nested: {
      nullValue: null,
      undefinedValue: undefined,
      attribute: 'value',
      deeply: { attribute: 'value' },
      array: [1, 'two', { three: 'three', four: 4, array: [1, 2, 3] }],
      toSplice: [{ name: 'a', hp: 1 }, { name: 'b', hp: 1 }, { name: 'c', hp: 1 }],
      map: new Map(),
      date: new Date(),
      // get getter() { return 'get me'; },
    },
  });

  test('Bug fixes', () => {
    proxy.brandy = proxy.nested; // Creating new attribute pointing to existing proxy object
    // let listener;
    // emitter.on('nested/toSplice/*/hp', listener = ({ path }) => {
    //   proxy.nested.toSplice.splice(path.at(2), 1);
    // });
    // proxy.nested.toSplice
    // listener.off('nested/toSplice/*/hp');
  });

  test('proxy.turn', (done) => {
    emitter.once('turn', (event) => {
      expect(event).toEqual({ target, oldVal: 0, newVal: 1, path: ['turn'] });
    }); proxy.turn++;

    emitter.once('turn', (event) => {
      expect(event).toEqual({ target, oldVal: 1, newVal: 10, path: ['turn'] });
    }); proxy.turn = 10;

    emitter.once('turn', (event) => {
      expect(event).toEqual({ target, oldVal: 10, newVal: undefined, path: ['turn'] });
      done();
    }); delete proxy.turn;
  });

  test('proxy.newAttribute', (done) => {
    emitter.once('newAttribute', (event) => {
      expect(event).toEqual({ target, oldVal: undefined, newVal: 5, path: ['newAttribute'] });
      done();
    }); proxy.newAttribute = 5;
  });

  // test('proxy.getter', (done) => {
  //   emitter.once('nested/getter', (event) => {
  //     expect(event).toEqual({ oldVal: 'get me', newVal: 'got me', path: ['nested', 'getter'] });
  //     done();
  //   }); proxy.nested.getter = 'got me';
  // });

  test('proxy.nested.attribute', (done) => {
    emitter.once('nested/attribute', (event) => {
      expect(event).toEqual({ target, oldVal: 'value', newVal: 'rich', path: ['nested', 'attribute'] });
    }); proxy.nested.attribute = 'rich';

    emitter.once('**', (event) => {
      expect(event).toEqual({ target, oldVal: 'value', newVal: 1, path: ['nested', 'deeply', 'attribute'] });
    }); proxy.nested.deeply.attribute = 1;

    emitter.once('**', (event) => {
      expect(event).toEqual({ target, oldVal: undefined, newVal: { another: { level: { deep: 1 } } }, path: ['nested', 'deeply', 'newAttribute'] });
    }); proxy.nested.deeply.newAttribute = { another: { level: { deep: 1 } } };

    emitter.once('**', (event) => {
      expect(event).toEqual({ target, oldVal: 1, newVal: -4, path: ['nested', 'deeply', 'newAttribute', 'another', 'level', 'deep'] });
    }); proxy.nested.deeply.newAttribute.another.level.deep -= 5;

    emitter.once('**', (event) => {
      expect(event).toEqual({ target, oldVal: 4, newVal: 5, path: ['nested', 'array', 2, 'four'] });
      done();
    }); proxy.nested.array[2].four++;
  });

  test('proxy.nested.array functions', (done) => {
    emitter.once('**', (event) => {
      expect(event).toEqual({ target, oldVal: proxy.nested.array, newVal: proxy.nested.array, path: ['nested', 'array'], apply: ['push', 'anew', 'nelly'] });
    }); proxy.nested.array.push('anew', 'nelly');
    expect(proxy.nested.array.length).toBe(5);

    emitter.once('**', (event) => {
      expect(event).toEqual({ target, oldVal: proxy.nested.array, newVal: proxy.nested.array, path: ['nested', 'array'], apply: ['splice', 1, 1] });
    }); proxy.nested.array.splice(1, 1);
    expect(proxy.nested.array.length).toBe(4);

    emitter.once('**', (event) => {
      expect(event).toEqual({ target, oldVal: 5, newVal: 6, path: ['nested', 'array', 1, 'four'] });
    }); proxy.nested.array[1].four++;

    emitter.once('**', (event) => {
      expect(event).toEqual({ target, oldVal: 3, newVal: '3', path: ['nested', 'array', 1, 'array', '2'] });
      done();
    }); proxy.nested.array[1].array[2] = '3';
  });

  test('proxy.nested.{map|date} functions', (done) => {
    emitter.once('**', (event) => {
      expect(event).toEqual({ target, oldVal: expect.any(Map), newVal: expect.any(Map), path: ['nested', 'map'], apply: ['set', 'key', 'value'] });
    }); proxy.nested.map.set('key', 'value');
    expect(proxy.nested.map.size).toBe(1);

    emitter.once('**', (event) => {
      expect(event).toEqual({ target, oldVal: expect.any(Date), newVal: expect.any(Date), path: ['nested', 'date'], apply: ['setHours', 0, 0, 0, 0] });
      done();
    }); proxy.nested.date.setHours(0, 0, 0, 0);
  });

  test('Object.assign', (done) => {
    let count = 0, listener;

    emitter.on('**', listener = (event) => {
      switch (count++) {
        case 0: {
          expect(event).toEqual({ target, oldVal: 'rich', newVal: 'changed', path: ['nested', 'attribute'] });
          break;
        }
        default: {
          expect(event).toEqual({ target, oldVal: undefined, newVal: {}, path: ['nested', 'anotherAttribute'] });
          emitter.off('**', listener);
          done();
          break;
        }
      }
    }); Object.assign(proxy.nested, { attribute: 'changed', anotherAttribute: {} });
  });

  test('Direct object $id', (done) => {
    proxy.nested.hero = { hp: 10, ma: 10 };

    emitter.once(proxy.nested.hero.$id, (event) => {
      expect(event).toEqual({ target, oldVal: 10, newVal: 20, path: ['nested', 'hero', 'hp'] });
      done();
    });

    proxy.nested.hero.hp = 20;
  });

  test('Actors', (done) => {
    const { nested } = proxy;

    emitter.once('nested/attribute', (event) => {
      expect(event).toEqual({ actor: proxy.nested.deeply, target, oldVal: 'changed', newVal: 'acted', path: ['nested', 'attribute'] });
    }); proxy.nested.deeply.$(proxy.nested).attribute = 'acted';

    emitter.once('nested/attribute', (event) => {
      expect(event).toEqual({ target, oldVal: 'acted', newVal: 'boring', path: ['nested', 'attribute'] });
    }); proxy.nested.attribute = 'boring';

    emitter.once('brand', (event) => {
      expect(event).toEqual({ actor: nested, target, oldVal: undefined, newVal: 'new', path: ['brand'] });
    }); nested.$(proxy).brand = 'new';

    emitter.once('nested/map', (event) => {
      expect(event).toEqual({ actor: proxy.nested.date, target, oldVal: expect.any(Map), newVal: expect.any(Map), path: ['nested', 'map'], apply: ['set', 'actor', 'date'] });
      done();
    }); proxy.nested.date.$(proxy.nested.map).set('actor', 'date');
  });
});
