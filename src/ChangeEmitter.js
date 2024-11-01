const EventEmitter = require('events');
const ChangeProxy = require('./ChangeProxy');

module.exports = class ChangeEmitter {
  constructor(obj) {
    const emitter = new EventEmitter();
    const proxy = new ChangeProxy(obj, emitter);
    return { emitter, proxy };
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
