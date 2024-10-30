const { isPlainObject } = require('@coderich/util');

module.exports = class State {
  #path;
  #listeners = [];

  constructor(state = {}, path = []) {
    this.#path = path;

    const $state = this.#iterate(state);

    const subscribe = Object.defineProperties(fn => this.#subscribe(fn), {
      toJSON: {
        value: () => $state.toJSON?.apply($state) ?? $state,
        // value: () => $state.toJSON?.() ?? $state,
        configurable: true,
      },
    });

    return new Proxy(subscribe, {
      get: (target, prop, rec) => {
        target = prop === 'toJSON' ? subscribe : $state;
        return Reflect.get(target, prop, rec);
        // const value = Reflect.get(target, prop, rec);
        // return typeof value === 'function' && value.bind ? value.bind($state) : value;
      },
      set: (target, prop, value) => {
        this.#broadcast({ prev: $state[prop], path: path.concat(prop), value });
        return Reflect.set($state, prop, this.#resolve(path.concat(prop), value));
      },
      // apply: (target, thisArg, args) => {
      //   return target.apply($state, args);
      //   // console.log(thisArg);
      //   // return Reflect.apply(target, thisArg, args);
      // },
      deleteProperty: (target, prop, value) => {
        this.#broadcast({ prev: $state[prop], path: path.concat(prop), value });
        return Reflect.deleteProperty($state, prop);
      },
      has: (target, prop) => {
        return Reflect.has($state, prop);
      },
      ownKeys: (target) => {
        return Reflect.ownKeys($state);
      },
      getPrototypeOf: (target) => {
        return Reflect.getPrototypeOf($state);
      },
      getOwnPropertyDescriptor: (target, prop) => {
        return Reflect.getOwnPropertyDescriptor($state, prop);
      },
    });
  }

  #call(value, $this) {
  }

  #resolve(key, value) {
    if (typeof value === 'object') {
      value = new State(value, key);
      value(event => this.#broadcast(event));
    }
    return value;
  }

  #iterate(mixed) {
    return State.map(mixed, (value, i) => {
      if (Array.isArray(value)) return this.#resolve(this.#path.concat(i), value);
      if (isPlainObject(value)) return this.#transform(value);
      return value;
    });
  }

  #transform(obj) {
    Object.entries(obj).forEach(([key, value]) => (obj[key] = this.#resolve(this.#path.concat(key), value)));
    return obj;
  }

  #subscribe(fn) {
    return this.#listeners.push(fn) && (() => this.#unsubscribe(fn));
  }

  #unsubscribe(fn) {
    return this.#listeners.splice(this.#listeners.indexOf(fn), 1);
  }

  #broadcast(event) {
    this.#listeners.forEach(fn => fn(event));
  }

  static map(mixed, fn) {
    if (mixed == null) return mixed;
    if (Array.isArray(mixed)) return mixed.map((...args) => fn(...args));
    return fn(mixed);
  }
};
