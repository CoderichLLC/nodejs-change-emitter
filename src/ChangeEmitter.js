const EventEmitter = require('events');

const $id = Symbol.for('id');

module.exports = class ChangeEmitter {
  #path;
  #index;
  #emitter;

  constructor(obj, path = [], emitter = new EventEmitter(), internal = false) {
    let $prop;
    this.#path = path;
    this.#emitter = emitter;
    this.#index = { toString: () => $prop };

    const state = Object.defineProperty(this.#iterate(obj), $id, { value: Symbol('') });

    const proxy = new Proxy(state, {
      get: (target, prop, rec) => {
        $prop = prop;

        const value = Reflect.get(target, prop, state);

        if (typeof value !== 'function' || typeof prop === 'symbol') return value;

        return (...args) => {
          const retVal = value.apply(state, args);

          if (/^(push|pop|shift|unshift|splice|sort|reverse|add|set|clear|delete|remove)/.test(prop)) {
            const event = { oldVal: target, newVal: target, path: path.map(el => el.toString()), apply: [prop, ...args] };
            this.#emitter.emit(target[$id], event);
            this.#emitter.emit('change', event);
          }

          return retVal;
        };
      },
      set: (target, prop, newVal) => {
        const oldVal = target[prop];
        const retVal = Reflect.set(target, prop, this.#resolve(path.concat(prop), newVal));
        const event = { oldVal, newVal, path: path.concat(prop).map(el => el.toString()) };
        this.#emitter.emit(target[$id], event);
        this.#emitter.emit('change', event);
        return retVal;
      },
      deleteProperty: (target, prop, newVal) => {
        const oldVal = target[prop];
        const retVal = Reflect.deleteProperty(target, prop);
        const event = { oldVal, newVal, path: path.concat(prop).map(el => el.toString()) };
        this.#emitter.emit(target[$id], event);
        this.#emitter.emit('change', event);
        return retVal;
      },
    });

    return internal ? proxy : { proxy, emitter };
  }

  #resolve(key, value) {
    return typeof value === 'object' ? new ChangeEmitter(value, key, this.#emitter, true) : value;
  }

  #iterate(mixed) {
    return ChangeEmitter.map(mixed, (value, i) => {
      if (typeof value === 'object') return value === mixed ? this.#transform(value) : this.#resolve(this.#path.concat(this.#index), value);
      return value;
    });
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
