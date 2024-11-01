const ChangeEmitter = require('./src/ChangeEmitter');

const { emitter, proxy: largeNestedObject } = new ChangeEmitter({
  level1: {
    number: 42,
    string: 'hello',
    boolean: true,
    date: new Date(),
    regex: /pattern/gi,
    nullValue: null,
    undefinedValue: undefined,
    array: [],
    map: new Map(),
    set: new Set(),
    nested: {},
  },
});

emitter.setMaxListeners(100);

Array.from(new Array(1)).forEach(() => {
  emitter.on('**', () => {
  });
});

console.time('Populate Large Object');

// Populate large arrays
for (let i = 0; i < 10000; i++) {
  largeNestedObject.level1.array.push({
    index: i,
    text: `Item ${i}`,
    date: new Date(Date.now() - i * 1000),
    values: [Math.random(), Math.random(), Math.random()],
  });
}

// Populate large Map and Set
for (let i = 0; i < 1000; i++) {
  largeNestedObject.level1.map.set(`key${i}`, { value: i, flag: i % 2 === 0 });
  largeNestedObject.level1.set.add(i);
}

// Create deeply nested structure
let currentLevel = largeNestedObject.level1.nested;
for (let level = 2; level <= 10; level++) {
  currentLevel[`level${level}`] = {
    array: Array.from({ length: 1000 }, (_, i) => ({
      text: `Level ${level} - Item ${i}`,
      number: i * level,
      func: () => `Level ${level} - Func ${i}`,
    })),
    nested: {},
  };
  currentLevel = currentLevel[`level${level}`].nested;
}

console.timeEnd('Populate Large Object');

// Function to modify all levels of the large object
function modifyDeeply(obj) {
  for (let i = 0; i < 1000; i++) {
    // Modify properties at the top level
    obj.level1.number += i;
    obj.level1.string += `_${i}`;
    obj.level1.boolean = !obj.level1.boolean;
    obj.level1.date = new Date(obj.level1.date.getTime() + 1000);
    obj.level1.regex = new RegExp(obj.level1.regex.source + i, 'gi');
    obj.level1.array.push({ index: i, text: `New Item ${i}`, values: [i, i + 1] });

    // Modify Map and Set at level 1
    obj.level1.map.set(`newKey${i}`, { added: true, index: i });
    obj.level1.set.add(`New Set Item ${i}`);

    // Modify deeply nested levels
    let currentLevel = obj.level1.nested;
    let levelCounter = 2;
    while (currentLevel) {
      if (currentLevel[`level${levelCounter}`]) {
        const levelArray = currentLevel[`level${levelCounter}`].array;

        // Modify existing items in the array
        levelArray.forEach((item, idx) => {
          item.number += idx;
          item.text = `${item.text}_mod${i}`;
          item.newProp = Math.random() * i; // Adding new property
        });

        // Push new items into the array
        levelArray.push({
          text: `Level ${levelCounter} - New Item ${i}`,
          number: i,
          func: () => `Level ${levelCounter} - New Func ${i}`
        });

        // Remove some items from the array
        if (levelArray.length > 500) {
          levelArray.splice(0, 50);
        }

        // Add or modify properties
        currentLevel[`level${levelCounter}`].newProp = `Level ${levelCounter} - New Prop ${i}`;
        levelCounter++;
        currentLevel = currentLevel[`level${levelCounter}`]?.nested;
      } else {
        break;
      }
    }
  }

  // Delete some properties and items in Set and Map
  for (let j = 0; j < 500; j++) {
    obj.level1.array.pop();
    obj.level1.map.delete(`newKey${j}`);
    obj.level1.set.delete(`New Set Item ${j}`);
  }
}
// Execute the modification function on largeNestedObject
console.time('Modifying Large Object');
modifyDeeply(largeNestedObject);
console.timeEnd('Modifying Large Object');
