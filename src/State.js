module.exports = class State {
  #path;
  #listeners = [];

  constructor(state = {}, path = []) {
    this.#path = path;

    const needsContext = State.needsContext(state);

    const $state = Object.defineProperty(this.#iterate(state), '$', {
      value: (...args) => this.#subscribe(...args),
      configurable: true,
    });

    return new Proxy($state, {
      get: (target, prop, rec) => {
        const value = Reflect.get(target, prop, rec);
        if (typeof value !== 'function' || typeof prop === 'symbol') return value;
        if (/^(set|clear|delete|add)/.test(prop)) this.#broadcast({ prev: target, path, value, method: prop });
        return value.bind($state);

        // if (typeof value !== 'function' || typeof prop === 'symbol') return value;
        // return needsContext ? (...args) => {
        //   value = value.apply($state, args);
        //   if (/^(set|clear|delete|add)/.test(prop)) this.#broadcast({ prev: target, path, value, method: prop });
        //   return value;
        // } : value;
      },
      set: (target, prop, value) => {
        this.#broadcast({ prev: target[prop], path: path.concat(prop), value });
        return Reflect.set(target, prop, this.#resolve(path.concat(prop), value));
      },
      deleteProperty: (target, prop, value) => {
        this.#broadcast({ prev: target[prop], path: path.concat(prop), value });
        return Reflect.deleteProperty(target, prop);
      },
    });
  }

  #resolve(key, value) {
    if (typeof value === 'object') {
      value = new State(value, key);
      value.$(event => this.#broadcast(event));
    }
    return value;
  }

  #iterate(mixed) {
    return State.map(mixed, (value, i) => {
      if (Array.isArray(value)) return this.#resolve(this.#path.concat(i), value);
      if (typeof value === 'object') return this.#transform(value);
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

  static needsContext(obj) {
    // Handle null and non-objects
    if (obj === null || typeof obj !== 'object') return false;

    // Check specific types and their methods
    switch (Object.prototype.toString.call(obj)) {
      case '[object Array]': return false; // Array methods don't require context (e.g., push, pop)
      case '[object String]': case '[object Number]': case '[object Boolean]': return false; // Primatives are context-independent
      case '[object Math]': case '[object JSON]': return false; // Static methods on Math and JSON are context-independent
      case '[object Symbol]': return false; // Static methods are context-independent
      case '[object Function]': return false; // Functions are generally context-independent if not defined as methods

      case '[object Date]': return true; // Date methods like setHours require context
      case '[object RegExp]': return true; // RegExp methods like exec require context
      case '[object Object]': return true; // Generic objects may have methods requiring context
      case '[object Set]': case '[object Map]': case '[object WeakSet]': case '[object WeakMap]': return true; // Methods can depend on the context

      default: return true; // Fallback for other object types (e.g., custom classes)
    }
  }
};
