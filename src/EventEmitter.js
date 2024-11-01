const EventEmitter = require('events');
const PicoMatch = require('picomatch');

const $pathmatch = Symbol.for('pathmatch');

module.exports = class extends EventEmitter {
  #matchMap = new Map();

  constructor(changeEmitter) {
    super();

    this.on('newListener', (event, listener) => {
      this.#matchMap.set(event, (() => {
        try {
          return PicoMatch(event);
        } catch (e) {
          return () => false;
        }
      })());
    });
  }

  emit(eventName, event, flag, ...rest) {
    if (flag === $pathmatch) return this.eventNames().filter(name => this.#matchMap.get(name)?.(eventName)).map(name => super.emit(name, event)).length > 0;
    return super.emit(eventName, event, flag, ...rest);
  }
};
