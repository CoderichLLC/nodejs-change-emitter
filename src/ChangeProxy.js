const proto = {};
const $actor = Symbol('actor');
const $pathmatch = Symbol.for('pathmatch');

function act(o) {
  return Object.defineProperty(o, $actor, { value: this, configurable: true });
}

module.exports = class ChangeProxy {
  #paths;
  #emitter;

  constructor(obj, emitter, paths = []) {
    if (Object.getPrototypeOf(obj) === proto) return obj;

    this.#paths = paths;
    this.#emitter = emitter;

    const state = Object.defineProperties(this.#iterate(obj), {
      $: { value: act },
      $id: { value: Symbol('id') },
    });

    return new Proxy(state, {
      get: (target, prop, rec) => {
        const value = Reflect.get(target, prop, state);

        if (value === act || typeof value !== 'function' || typeof prop === 'symbol') return value;

        return (...args) => {
          if (/^(push|pop|shift|unshift|splice|sort|reverse|add|set|clear|delete|remove)/.test(prop)) {
            args = this.#iterate(args);
            const retVal = value.apply(state, args);
            const actor = target[$actor]; delete target[$actor];
            const path = this.#paths.map(el => el.toString());
            const event = { actor, target: rec, oldVal: target, newVal: target, path, apply: [prop, ...args] };
            this.#emitter.emit(path.join('/'), event, $pathmatch);
            this.#emitter.emit(state.$id, event);
            return retVal;
          }

          return value.apply(state, args);
        };
      },
      set: (target, prop, value, rec) => {
        const actor = target[$actor]; delete target[$actor];
        const oldVal = target[prop];
        const retVal = Reflect.set(target, prop, this.#resolve(this.#paths.concat(prop), value));
        const newVal = target[prop];
        const path = this.#paths.concat(prop).map(el => el.toString());
        const event = { actor, target: rec, oldVal, newVal, path };
        this.#emitter.emit(path.join('/'), event, $pathmatch);
        this.#emitter.emit(state.$id, event);
        return retVal;
      },
      deleteProperty: (target, prop, newVal) => {
        const actor = target[$actor]; delete target[$actor];
        const oldVal = target[prop];
        const retVal = Reflect.deleteProperty(target, prop);
        const path = this.#paths.concat(prop).map(el => el.toString());
        const event = { actor, target, oldVal, newVal, path };
        this.#emitter.emit(path.join('/'), event, $pathmatch);
        this.#emitter.emit(state.$id, event);
        return retVal;
      },
      getPrototypeOf: () => {
        return proto;
      },
    });
  }

  #iterate(mixed) {
    if (mixed == null) return mixed;
    if (typeof mixed === 'object') return this.#transform(mixed);
    return mixed;
  }

  #resolve(key, value) {
    if (value == null) return value;
    return typeof value === 'object' ? new ChangeProxy(value, this.#emitter, key) : value;
  }

  #transform(obj) {
    if (Array.isArray(obj)) {
      obj.forEach((el, i) => {
        const $el = this.#resolve(this.#paths.concat({ toString: () => obj.indexOf($el) }), el);
        obj[i] = $el;
      });
    } else {
      Object.entries(obj).forEach(([key, value]) => (obj[key] = this.#resolve(this.#paths.concat(key), value)));
    }

    return obj;
  }
};
