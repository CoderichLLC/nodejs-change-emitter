const State = require('../src/State');

describe('State', () => {
  let $;
  const state = new State({
    turn: 0,
    nested: {
      attribute: 'value',
      deeply: { attribute: 'value' },
      array: [1, 2, 3],
      // array: [1, 'two', { three: 'three' }],
      date: new Date(),
    },
  });

  test('state.turn', (done) => {
    $ = state((event) => {
      expect(event).toEqual({ prev: 0, path: ['turn'], value: 1 });
    }); state.turn++; $();

    $ = state((event) => {
      expect(event).toEqual({ prev: 1, path: ['turn'], value: 10 });
    }); state.turn = 10; $();

    $ = state((event) => {
      expect(event).toEqual({ prev: 10, path: ['turn'], value: undefined });
      done();
    }); delete state.turn; $();
  });

  test('state.newAttribute', (done) => {
    $ = state((event) => {
      expect(event).toEqual({ prev: undefined, path: ['newAttribute'], value: 5 });
      done();
    }); state.newAttribute = 5; $();
  });

  test('state.nested.attribute', (done) => {
    $ = state((event) => {
      expect(event).toEqual({ prev: 'value', path: ['nested', 'attribute'], value: 'rich' });
    }); state.nested.attribute = 'rich'; $();

    $ = state((event) => {
      expect(event).toEqual({ prev: 'value', path: ['nested', 'deeply', 'attribute'], value: 1 });
    }); state.nested.deeply.attribute = 1; $();

    $ = state((event) => {
      expect(event).toEqual({ prev: undefined, path: ['nested', 'deeply', 'newAttribute'], value: { another: { level: { deep: 1 } } } });
    }); state.nested.deeply.newAttribute = { another: { level: { deep: 1 } } }; $();

    $ = state((event) => {
      expect(event).toEqual({ prev: 1, path: ['nested', 'deeply', 'newAttribute', 'another', 'level', 'deep'], value: -4 });
      done();
    }); state.nested.deeply.newAttribute.another.level.deep -= 5; $();
  });

  test('state.nested.array', (done) => {
    console.log(state.nested.date.setHours(0, 0, 0, 0));
    console.log(JSON.stringify(state.nested));
    console.log(JSON.stringify(state.nested.date));
    done();

    // $ = state((event) => {
    //   console.log(event);
    //   done();
    //   // expect(event).toEqual({ prev: undefined, path: ['nested', 'array', 'length', '3'], value: 'value' });
    //   // done();
    // });
    // // state.nested.date.setHours(0, 0, 0, 0);
    // state.nested.array.push('one');
    // $();
  });
});
