const EventEmitter = require('./EventEmitter');
const ChangeProxy = require('./ChangeProxy');

module.exports = class ChangeEmitter {
  constructor(obj) {
    const emitter = new EventEmitter();
    const proxy = new ChangeProxy(obj, emitter);
    return { emitter, proxy };
  }
};
