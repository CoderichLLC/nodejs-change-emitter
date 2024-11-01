const $actor = Symbol('actor');
const $pathmatch = Symbol.for('pathmatch');

function act(o) {
  return Object.defineProperty(o, $actor, { value: this, configurable: true });
}

module.exports = class ChangeProxy {
  #paths;
  #prop;
  #index;
  #emitter;

  constructor(obj, emitter, paths = []) {
    this.#paths = paths;
    this.#emitter = emitter;
    this.#index = { toString: () => this.#prop };

    const state = Object.defineProperties(this.#iterate(obj), {
      $: { value: act },
      $id: { value: Symbol('id') },
    });

    return new Proxy(state, {
      get: (target, prop, rec) => {
        this.#prop = prop;
        const actor = target[$actor]; delete target[$actor];
        const value = Reflect.get(target, prop, state);

        if (value === act || typeof value !== 'function' || typeof prop === 'symbol') return value;

        return (...args) => {
          const retVal = value.apply(state, args);

          if (/^(push|pop|shift|unshift|splice|sort|reverse|add|set|clear|delete|remove)/.test(prop)) {
            const path = this.#paths.map(el => el.toString());
            const event = { actor, oldVal: target, newVal: target, path, apply: [prop, ...args] };
            this.#emitter.emit(path.join('/'), event, $pathmatch);
            this.#emitter.emit(state.$id, event);
          }

          return retVal;
        };
      },
      set: (target, prop, newVal) => {
        const actor = target[$actor]; delete target[$actor];
        const oldVal = target[prop];
        const retVal = Reflect.set(target, prop, this.#resolve(this.#paths.concat(prop), newVal));
        const path = this.#paths.concat(prop).map(el => el.toString());
        const event = { actor, oldVal, newVal, path };
        this.#emitter.emit(path.join('/'), event, $pathmatch);
        this.#emitter.emit(state.$id, event);
        return retVal;
      },
      deleteProperty: (target, prop, newVal) => {
        const actor = target[$actor]; delete target[$actor];
        const oldVal = target[prop];
        const retVal = Reflect.deleteProperty(target, prop);
        const path = this.#paths.concat(prop).map(el => el.toString());
        const event = { actor, oldVal, newVal, path };
        this.#emitter.emit(path.join('/'), event, $pathmatch);
        this.#emitter.emit(state.$id, event);
        return retVal;
      },
    });
  }

  #iterate(mixed) {
    if (mixed == null) return mixed;
    if (Array.isArray(mixed)) return mixed.map(value => this.#resolve(this.#paths.concat(this.#index), value));
    if (typeof mixed === 'object') return this.#transform(mixed);
    return mixed;
  }

  #resolve(key, value) {
    if (value == null) return value;
    return typeof value === 'object' ? new ChangeProxy(value, this.#emitter, key) : value;
  }

  #transform(obj) {
    Object.entries(obj).forEach(([key, value]) => (obj[key] = this.#resolve(this.#paths.concat(key), value)));
    return obj;
  }
};
