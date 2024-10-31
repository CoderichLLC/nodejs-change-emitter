const EventEmitter = require('events');

module.exports = class ChangeEmitter {
  #path;
  #emitter;

  constructor(obj, path = [], emitter = new EventEmitter(), internal = false) {
    this.#path = path;
    this.#emitter = emitter;

    const state = this.#iterate(obj);

    const proxy = new Proxy(state, {
      get: (target, prop, rec) => {
        const value = Reflect.get(target, prop, state);
        if (typeof value !== 'function' || typeof prop === 'symbol') return value;
        return (...args) => {
          if (/^(push|pop|shift|unshift|splice|sort|reverse|add|set|clear|delete|remove)/.test(prop)) this.#broadcast({ value: target, path, apply: [prop, ...args] });
          return value.apply(state, args);
        };
      },
      set: (target, prop, value) => {
        this.#broadcast({ value: target[prop], path: path.concat(prop), assign: value });
        return Reflect.set(target, prop, this.#resolve(path.concat(prop), value));
      },
      deleteProperty: (target, prop, value) => {
        this.#broadcast({ value: target[prop], path: path.concat(prop), assign: value });
        return Reflect.deleteProperty(target, prop);
      },
    });

    return internal ? proxy : { proxy, emitter };
  }

  #resolve(key, value) {
    return typeof value === 'object' ? new ChangeEmitter(value, key, this.#emitter, true) : value;
  }

  #iterate(mixed) {
    return ChangeEmitter.map(mixed, (value, i) => {
      if (Array.isArray(value)) return this.#resolve(this.#path.concat(i), value);
      if (typeof value === 'object') return value === mixed ? this.#transform(value) : this.#resolve(this.#path.concat(i), value);
      return value;
    });
  }

  #transform(obj) {
    Object.entries(obj).forEach(([key, value]) => (obj[key] = this.#resolve(this.#path.concat(key), value)));
    return obj;
  }

  #broadcast(event) {
    this.#emitter.emit('change', event);
  }

  static map(mixed, fn) {
    if (mixed == null) return mixed;
    if (Array.isArray(mixed)) return mixed.map((...args) => fn(...args));
    return fn(mixed);
  }

  // const typeMap = {
  //   '[object Array]': 'Array',
  //   '[object Date]': 'Date',
  //   '[object RegExp]': 'RegExp',
  //   '[object Set]': 'Set',
  //   '[object Map]': 'Map',
  //   '[object WeakMap]': 'WeakMap',
  //   '[object WeakSet]': 'WeakSet',
  //   '[object Object]': 'Object',
  //   '[object Error]': 'Error',
  //   '[object Promise]': 'Promise',
  //   '[object Symbol]': 'Symbol',
  //   '[object String]': 'String',
  //   '[object Number]': 'Number',
  //   '[object Boolean]': 'Boolean',
  //   '[object BigInt]': 'BigInt',
  //   '[object Function]': 'Function',
  //   '[object Math]': 'Math',
  //   '[object JSON]': 'JSON',
  //   '[object Intl]': 'Intl',
  // };

  // static getType(obj) {
  //   if (obj === null) return 'null';
  //   if (typeof obj === 'undefined') return 'undefined';
  //   if (typeof obj === 'function') return 'Function';
  //   return typeMap[Object.prototype.toString.call(obj)];
  // }

  // static needsContext(obj) {
  //   // Handle null and non-objects
  //   if (obj === null || typeof obj !== 'object') return false;

  //   // Check specific types and their methods
  //   switch (Object.prototype.toString.call(obj)) {
  //     case '[object Array]': return false; // Array methods don't require context (e.g., push, pop)
  //     case '[object String]': case '[object Number]': case '[object Boolean]': return false; // Primatives are context-independent
  //     case '[object Math]': case '[object JSON]': return false; // Static methods on Math and JSON are context-independent
  //     case '[object Symbol]': return false; // Static methods are context-independent
  //     case '[object Function]': return false; // Functions are generally context-independent if not defined as methods

  //     case '[object Date]': return true; // Date methods like setHours require context
  //     case '[object RegExp]': return true; // RegExp methods like exec require context
  //     case '[object Object]': return true; // Generic objects may have methods requiring context
  //     case '[object Set]': case '[object Map]': case '[object WeakSet]': case '[object WeakMap]': return true; // Methods can depend on the context

  //     default: return true; // Fallback for other object types (e.g., custom classes)
  //   }
  // }
};
