// game-logic.js
const categories = {
  ones: (dice) => dice.filter(d => d === 1).reduce((a, b) => a + b, 0),
  twos: (dice) => dice.filter(d => d === 2).reduce((a, b) => a + b, 0),
  threes: (dice) => dice.filter(d => d === 3).reduce((a, b) => a + b, 0),
  fours: (dice) => dice.filter(d => d === 4).reduce((a, b) => a + b, 0),
  fives: (dice) => dice.filter(d => d === 5).reduce((a, b) => a + b, 0),
  sixes: (dice) => dice.filter(d => d === 6).reduce((a, b) => a + b, 0),

  onePair: (dice) => {
    const pair = findHighestPair(dice);
    return pair ? pair * 2 : 0;
  },

  twoPairs: (dice) => {
    const counts = countDice(dice);
    const pairs = Object.entries(counts)
      .filter(([_, count]) => count >= 2)
      .map(([val]) => +val)
      .sort((a, b) => b - a);
    if (pairs.length >= 2) {
      return pairs[0] * 2 + pairs[1] * 2;
    }
    return 0;
  },

  threeKind: (dice) => {
    const three = findNKind(dice, 3);
    return three ? three * 3 : 0;
  },

  fourKind: (dice) => {
    const four = findNKind(dice, 4);
    return four ? four * 4 : 0;
  },

  smallStraight: (dice) => isExactStraight(dice, [1,2,3,4,5]) ? 15 : 0,
  largeStraight: (dice) => isExactStraight(dice, [2,3,4,5,6]) ? 20 : 0,

  house: (dice) => {
    const counts = countDice(dice);
    const vals = Object.keys(counts).map(Number);
    if (vals.length !== 2) return 0;
    const [a, b] = vals.sort((x, y) => counts[y] - counts[x]);
    if (counts[a] === 3 && counts[b] === 2) return a * 3 + b * 2;
    if (counts[a] === 2 && counts[b] === 3) return b * 3 + a * 2;
    return 0;
  },

  chance: (dice) => dice.reduce((a, b) => a + b, 0),
  yatzy: (dice) => hasNKind(dice, 5) ? 50 : 0,
};

// Hjælpefunktioner
function findHighestPair(dice) {
  const counts = countDice(dice);
  for (let i = 6; i >= 1; i--) if (counts[i] >= 2) return i;
  return null;
}

function findNKind(dice, n) {
  const counts = countDice(dice);
  for (let i = 6; i >= 1; i--) if (counts[i] >= n) return i;
  return null;
}

function countDice(dice) {
  return dice.reduce((acc, d) => {
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {});
}

function isExactStraight(dice, seq) {
  const sorted = [...dice].sort((a, b) => a - b);
  return sorted.every((v, i) => v === seq[i]);
}

function hasNKind(dice, n) {
  const counts = countDice(dice);
  return Object.values(counts).some(c => c >= n);
}