const PathEmitter = require('../src/PathEmitter');
const ChangeEmitter = require('../src/ChangeEmitter');

describe('PathEmitter', () => {
  let proxy, emitter, changeEmitter;

  beforeAll(() => {
    // First we need a ChangeEmitter
    ({ proxy, emitter: changeEmitter } = new ChangeEmitter({
      turn: 0,
      nested: {
        attribute: 'value',
        deeply: { attribute: 'value' },
        array: [1, 'two', { three: 'three', four: 4 }],
        map: new Map(),
        date: new Date(),
      },
    }));

    // PathEmitter
    emitter = new PathEmitter(changeEmitter);
  });

  test('proxy.turn', (done) => {
    emitter.once('turn', (event) => {
      expect(event).toEqual({ oldVal: 0, newVal: 1, path: ['turn'] });
    }); proxy.turn++;

    emitter.once('*', (event) => {
      expect(event).toEqual({ oldVal: 1, newVal: 2, path: ['turn'] });
    }); proxy.turn++;

    emitter.once('nested/*', (event) => {
      expect(event).toEqual({ oldVal: 'value', newVal: 'ok', path: ['nested', 'attribute'] });
      done();
    }); proxy.nested.attribute = 'ok';
  });
});
