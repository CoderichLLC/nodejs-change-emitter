const $pathmatch = Symbol.for('pathmatch');

module.exports = class ChangeProxy {
  #path;
  #prop;
  #index;
  #emitter;

  constructor(obj, emitter, paths = []) {
    this.#path = paths;
    this.#emitter = emitter;
    this.#index = { toString: () => this.#prop };

    const state = this.#iterate(obj);

    return new Proxy(state, {
      get: (target, prop, rec) => {
        this.#prop = prop;

        const value = Reflect.get(target, prop, state);

        if (typeof value !== 'function' || typeof prop === 'symbol') return value;

        return (...args) => {
          const retVal = value.apply(state, args);

          if (/^(push|pop|shift|unshift|splice|sort|reverse|add|set|clear|delete|remove)/.test(prop)) {
            const path = this.#path.map(el => el.toString());
            const event = { oldVal: target, newVal: target, path, apply: [prop, ...args] };
            this.#emitter.emit(target, event);
            this.#emitter.emit(path.join('/'), event, $pathmatch);
          }

          return retVal;
        };
      },
      set: (target, prop, newVal) => {
        const oldVal = target[prop];
        const retVal = Reflect.set(target, prop, this.#resolve(this.#path.concat(prop), newVal));
        const path = this.#path.concat(prop).map(el => el.toString());
        const event = { oldVal, newVal, path };
        this.#emitter.emit(target, event);
        this.#emitter.emit(path.join('/'), event, $pathmatch);
        return retVal;
      },
      deleteProperty: (target, prop, newVal) => {
        const oldVal = target[prop];
        const retVal = Reflect.deleteProperty(target, prop);
        const path = this.#path.concat(prop).map(el => el.toString());
        const event = { oldVal, newVal, path };
        this.#emitter.emit(target, event);
        this.#emitter.emit(path.join('/'), event, $pathmatch);
        return retVal;
      },
    });
  }

  #iterate(mixed) {
    return ChangeProxy.map(mixed, (value, i) => {
      if (typeof value === 'object') return value === mixed ? this.#transform(value) : this.#resolve(this.#path.concat(this.#index), value);
      return value;
    });
  }

  #resolve(key, value) {
    return typeof value === 'object' ? new ChangeProxy(value, this.#emitter, key) : value;
  }

  #transform(obj) {
    Object.entries(obj).forEach(([key, value]) => (obj[key] = this.#resolve(this.#path.concat(key), value)));
    return obj;
  }

  static map(mixed, fn) {
    if (mixed == null) return mixed;
    if (Array.isArray(mixed)) return mixed.map((...args) => fn(...args));
    return fn(mixed);
  }
};
