const EventEmitter = require('events');
const PicoMatch = require('picomatch');

module.exports = class PathEmitter extends EventEmitter {
  #matchMap = new Map();

  constructor(changeEmitter) {
    super();

    this.on('newListener', (event, listener) => {
      if (!this.#matchMap.has(event)) this.#matchMap.set(event, PicoMatch(event));
    });

    changeEmitter.on('change', (event) => {
      const path = event.path.join('/');
      this.eventNames().filter(name => this.#matchMap.get(name)?.(path)).forEach(name => this.emit(name, event));
    });
  }
};
