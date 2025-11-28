// Dynamic Puzzle Generator - Creates unlimited unique puzzles

// Math puzzle generator
const generateMathPuzzles = (count, difficulty) => {
  const puzzles = [];
  
  for (let i = 0; i < count; i++) {
    if (difficulty === 'easy') {
      const a = Math.floor(Math.random() * 20) + 1;
      const b = Math.floor(Math.random() * 20) + 1;
      const ops = ['+', '-', '×', '÷'];
      const op = ops[i % 4];
      
      let answer, question;
      if (op === '+') {
        answer = a + b;
        question = `What is ${a} + ${b}?`;
      } else if (op === '-') {
        answer = Math.abs(a - b);
        question = `What is ${Math.max(a, b)} - ${Math.min(a, b)}?`;
      } else if (op === '×') {
        answer = a * b;
        question = `What is ${a} × ${b}?`;
      } else {
        const divisor = Math.floor(Math.random() * 10) + 1;
        answer = divisor;
        question = `What is ${divisor * a} ÷ ${a}?`;
      }
      
      const options = [
        answer - 2,
        answer - 1,
        answer,
        answer + 1
      ].filter(x => x >= 0).sort(() => Math.random() - 0.5);
      
      puzzles.push({
        q: question,
        a: String(answer),
        o: options.map(String)
      });
    } else if (difficulty === 'medium') {
      const a = Math.floor(Math.random() * 50) + 10;
      const b = Math.floor(Math.random() * 50) + 10;
      const answer = a + b;
      const options = [answer - 3, answer - 1, answer, answer + 2].sort(() => Math.random() - 0.5);
      
      puzzles.push({
        q: `What is ${a} + ${b}?`,
        a: String(answer),
        o: options.map(String)
      });
    } else {
      const a = Math.floor(Math.random() * 20) + 5;
      const answer = a * a;
      const options = [answer - 4, answer - 2, answer, answer + 3].sort(() => Math.random() - 0.5);
      
      puzzles.push({
        q: `What is ${a}²?`,
        a: String(answer),
        o: options.map(String)
      });
    }
  }
  
  return puzzles;
};

// Logic puzzle generator
const generateLogicPuzzles = (count, difficulty) => {
  const puzzles = [];
  const templates = {
    easy: [
      { q: 'If all {A} are {B}, and some {B} are {C}, then:', a: 'Some {A} might be {C}', o: ['All {A} are {C}', 'Some {A} might be {C}', 'No {A} are {C}', 'All {C} are {A}'] },
      { q: 'If {X} is taller than {Y}, and {Y} is taller than {Z}, then:', a: '{X} is taller than {Z}', o: ['{Z} is tallest', '{X} is taller than {Z}', '{Y} is tallest', 'They are equal'] }
    ],
    medium: [
      { q: 'If it takes {N} workers {M} hours to build a wall, how long for {N*2} workers?', a: '{M/2} hours', o: ['{M/2} hours', '{M} hours', '{M*2} hours', '{M*4} hours'] }
    ],
    hard: [
      { q: 'You have {N} items, one is different. Using a balance {M} times, can you find it?', a: 'Yes', o: ['Yes', 'No', 'Maybe', 'Need more info'] }
    ]
  };
  
  const items = ['roses', 'cats', 'dogs', 'birds', 'trees', 'cars'];
  const properties = ['flowers', 'animals', 'pets', 'plants', 'vehicles', 'red', 'blue', 'tall', 'fast'];
  const names = ['John', 'Mike', 'Sam', 'Alex', 'Chris', 'Pat'];
  
  for (let i = 0; i < count; i++) {
    const template = templates[difficulty][i % templates[difficulty].length];
    const puzzle = JSON.parse(JSON.stringify(template));
    
    puzzle.q = puzzle.q
      .replace('{A}', items[i % items.length])
      .replace('{B}', properties[i % properties.length])
      .replace('{C}', properties[(i + 1) % properties.length])
      .replace('{X}', names[i % names.length])
      .replace('{Y}', names[(i + 1) % names.length])
      .replace('{Z}', names[(i + 2) % names.length])
      .replace('{N}', String(Math.floor(Math.random() * 10) + 2))
      .replace('{M}', String(Math.floor(Math.random() * 5) + 2));
    
    puzzle.a = puzzle.a
      .replace('{A}', items[i % items.length])
      .replace('{C}', properties[(i + 1) % properties.length])
      .replace('{X}', names[i % names.length])
      .replace('{Z}', names[(i + 2) % names.length])
      .replace('{M/2}', String(Math.floor(Math.random() * 3) + 1));
    
    puzzle.o = puzzle.o.map(opt => 
      opt
        .replace('{A}', items[i % items.length])
        .replace('{C}', properties[(i + 1) % properties.length])
        .replace('{X}', names[i % names.length])
        .replace('{Y}', names[(i + 1) % names.length])
        .replace('{Z}', names[(i + 2) % names.length])
        .replace('{M/2}', String(Math.floor(Math.random() * 3) + 1))
        .replace('{M}', String(Math.floor(Math.random() * 5) + 2))
        .replace('{M*2}', String(Math.floor(Math.random() * 10) + 4))
        .replace('{M*4}', String(Math.floor(Math.random() * 20) + 8))
    );
    
    puzzles.push(puzzle);
  }
  
  return puzzles;
};

// Pattern puzzle generator
const generatePatternPuzzles = (count, difficulty) => {
  const puzzles = [];
  
  for (let i = 0; i < count; i++) {
    if (difficulty === 'easy') {
      const start = Math.floor(Math.random() * 10) + 1;
      const step = Math.floor(Math.random() * 5) + 1;
      const sequence = [start, start + step, start + step * 2, start + step * 3];
      const answer = start + step * 4;
      const options = [answer - 2, answer - 1, answer, answer + 1].sort(() => Math.random() - 0.5);
      
      puzzles.push({
        q: `What comes next: ${sequence.join(', ')}, ?`,
        a: String(answer),
        o: options.map(String)
      });
    } else if (difficulty === 'medium') {
      const start = 2;
      const sequence = [start];
      for (let j = 0; j < 4; j++) {
        sequence.push(sequence[sequence.length - 1] * 2);
      }
      const answer = sequence[sequence.length - 1] * 2;
      const options = [answer - 4, answer - 2, answer, answer + 2].sort(() => Math.random() - 0.5);
      
      puzzles.push({
        q: `What comes next: ${sequence.join(', ')}, ?`,
        a: String(answer),
        o: options.map(String)
      });
    } else {
      // Fibonacci-like
      const a = Math.floor(Math.random() * 3) + 1;
      const b = Math.floor(Math.random() * 3) + 1;
      const sequence = [a, b];
      for (let j = 0; j < 3; j++) {
        sequence.push(sequence[sequence.length - 1] + sequence[sequence.length - 2]);
      }
      const answer = sequence[sequence.length - 1] + sequence[sequence.length - 2];
      const options = [answer - 2, answer - 1, answer, answer + 1].sort(() => Math.random() - 0.5);
      
      puzzles.push({
        q: `What comes next: ${sequence.join(', ')}, ?`,
        a: String(answer),
        o: options.map(String)
      });
    }
  }
  
  return puzzles;
};

// Word puzzle generator
const generateWordPuzzles = (count, difficulty) => {
  const puzzles = [];
  const categories = {
    fruits: ['Apple', 'Banana', 'Orange', 'Grape', 'Mango'],
    animals: ['Dog', 'Cat', 'Bird', 'Fish', 'Lion'],
    colors: ['Red', 'Blue', 'Green', 'Yellow', 'Purple'],
    objects: ['Chair', 'Table', 'Car', 'Book', 'Phone']
  };
  
  for (let i = 0; i < count; i++) {
    const catKeys = Object.keys(categories);
    const mainCat = catKeys[i % catKeys.length];
    const oddCat = catKeys[(i + 1) % catKeys.length];
    
    const options = [
      ...categories[mainCat].slice(0, 3),
      categories[oddCat][0]
    ].sort(() => Math.random() - 0.5);
    
    puzzles.push({
      q: 'Which word is the odd one out?',
      a: categories[oddCat][0],
      o: options
    });
  }
  
  return puzzles;
};

// Riddle puzzle generator
const generateRiddlePuzzles = (count, difficulty) => {
  const riddles = [
    { q: 'What has hands but cannot clap?', a: 'Clock', o: ['Clock', 'Watch', 'Person', 'Robot'] },
    { q: 'What gets wet while drying?', a: 'Towel', o: ['Towel', 'Sponge', 'Cloth', 'Paper'] },
    { q: 'What has keys but no locks?', a: 'Keyboard', o: ['Piano', 'Keyboard', 'Map', 'Door'] },
    { q: 'What has a neck but no head?', a: 'Bottle', o: ['Bottle', 'Shirt', 'Giraffe', 'Vase'] },
    { q: 'What can run but never walks?', a: 'Water', o: ['Water', 'River', 'Clock', 'Car'] }
  ];
  
  const puzzles = [];
  for (let i = 0; i < count; i++) {
    puzzles.push(riddles[i % riddles.length]);
  }
  
  return puzzles;
};

// Visual puzzle generator
const generateVisualPuzzles = (count, difficulty) => {
  const puzzles = [];
  const shapes = [
    { name: 'triangle', sides: 3 },
    { name: 'square', sides: 4 },
    { name: 'pentagon', sides: 5 },
    { name: 'hexagon', sides: 6 },
    { name: 'octagon', sides: 8 }
  ];
  
  for (let i = 0; i < count; i++) {
    const shape = shapes[i % shapes.length];
    const answer = shape.sides;
    const options = [answer - 1, answer, answer + 1, answer + 2].sort(() => Math.random() - 0.5);
    
    puzzles.push({
      q: `How many sides does a ${shape.name} have?`,
      a: String(answer),
      o: options.map(String)
    });
  }
  
  return puzzles;
};

// Memory puzzle generator
const generateMemoryPuzzles = (count, difficulty) => {
  const puzzles = [];
  const items = ['CAT', 'DOG', 'BIRD', 'FISH', 'LION', 'TIGER', 'BEAR', 'WOLF'];
  
  for (let i = 0; i < count; i++) {
    const length = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 5;
    const sequence = [];
    for (let j = 0; j < length; j++) {
      sequence.push(items[(i + j) % items.length]);
    }
    
    const position = Math.floor(Math.random() * length);
    const answer = sequence[position];
    const options = [sequence[0], sequence[1], sequence[2], items[(i + length) % items.length]].slice(0, 4);
    
    puzzles.push({
      q: `Remember: ${sequence.join(', ')}. What was ${['first', 'second', 'third', 'fourth', 'fifth'][position]}?`,
      a: answer,
      o: options
    });
  }
  
  return puzzles;
};

// Crypto puzzle generator
const generateCryptoPuzzles = (count, difficulty) => {
  const puzzles = [];
  
  for (let i = 0; i < count; i++) {
    if (difficulty === 'easy') {
      const word = ['CAT', 'DOG', 'BAT', 'RAT', 'HAT'][i % 5];
      const reversed = word.split('').reverse().join('');
      const options = [reversed, word, word.split('').sort().join(''), word.split('').sort(() => Math.random() - 0.5).join('')];
      
      puzzles.push({
        q: `Reverse: ${word}`,
        a: reversed,
        o: options
      });
    } else if (difficulty === 'medium') {
      const word = ['ABC', 'DEF', 'GHI', 'JKL'][i % 4];
      const shifted = word.split('').map(c => String.fromCharCode(c.charCodeAt(0) + 1)).join('');
      const options = [word, shifted, word.split('').reverse().join(''), word.toLowerCase()];
      
      puzzles.push({
        q: `Caesar cipher +1: ${word}`,
        a: shifted,
        o: options
      });
    } else {
      const num = Math.floor(Math.random() * 16);
      const binary = num.toString(2);
      const options = [String(num - 1), String(num), String(num + 1), String(num + 2)].sort(() => Math.random() - 0.5);
      
      puzzles.push({
        q: `Binary: ${binary}`,
        a: String(num),
        o: options
      });
    }
  }
  
  return puzzles;
};

// Master generator function
export const generatePuzzles = (category, count, difficulty = 'easy') => {
  switch (category) {
    case 'math':
      return generateMathPuzzles(count, difficulty);
    case 'logic':
      return generateLogicPuzzles(count, difficulty);
    case 'pattern':
      return generatePatternPuzzles(count, difficulty);
    case 'word':
      return generateWordPuzzles(count, difficulty);
    case 'riddle':
      return generateRiddlePuzzles(count, difficulty);
    case 'visual':
      return generateVisualPuzzles(count, difficulty);
    case 'memory':
      return generateMemoryPuzzles(count, difficulty);
    case 'crypto':
      return generateCryptoPuzzles(count, difficulty);
    default:
      return generateMathPuzzles(count, difficulty);
  }
};

export default {
  generatePuzzles
};
