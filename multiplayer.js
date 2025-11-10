// multiplayer.js
let players = [];
let currentPlayerIndex = 0;
let isDiceMode = true;
let gameStarted = false;

// DOM
const startScreen = document.getElementById('startScreen');
const gameScreen = document.getElementById('gameScreen');
const diceArea = document.getElementById('diceArea');
const toggleDiceBtn = document.getElementById('toggleDice');
const resetBtn = document.getElementById('resetGame');
const saveBtn = document.getElementById('saveNote');

// Startskærm
const playerCountSelect = document.getElementById('playerCount');
const playerNameInput = document.getElementById('playerName');
const addPlayerBtn = document.getElementById('addPlayerBtn');
const playerList = document.getElementById('playerList');
const startGameBtn = document.getElementById('startGameBtn');
const modeBoxes = document.querySelectorAll('.mode-box');

// --- MODE VALG MED BOKSE ---
modeBoxes.forEach(box => {
  box.addEventListener('click', () => {
    modeBoxes.forEach(b => b.classList.remove('active'));
    box.classList.add('active');
    isDiceMode = box.dataset.mode === 'dice'; // <--- TILFØJ DENNE LINJE
  });
});

// --- Tilføj spiller ---
addPlayerBtn.addEventListener('click', addPlayer);
startGameBtn.addEventListener('click', startGame);

function addPlayer() {
  const name = playerNameInput.value.trim();
  if (!name) return alert('Indtast et navn!');
  if (players.some(p => p.name === name)) return alert('Navn findes allerede!');
  if (players.length >= playerCountSelect.value) return alert('Max spillere nået!');

  players.push({ name, scores: {} });
  playerNameInput.value = '';
  renderPlayerList();
  startGameBtn.disabled = players.length < 2;
}

function renderPlayerList() {
  playerList.innerHTML = '';
  players.forEach((p, i) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${p.name}</span>
      <button onclick="(() => { players.splice(${i}, 1); renderPlayerList(); startGameBtn.disabled = players.length < 2; })()">Fjern</button>
    `;
    playerList.appendChild(li);
  });
}

// --- Startskærm ---
addPlayerBtn.addEventListener('click', addPlayer);
startGameBtn.addEventListener('click', startGame);

function addPlayer() {
  const name = playerNameInput.value.trim();
  if (!name) return alert('Indtast et navn!');
  if (players.some(p => p.name === name)) return alert('Navn findes allerede!');
  if (players.length >= playerCountSelect.value) return alert('Max spillere nået!');

  players.push({ name, scores: {} });
  playerNameInput.value = '';
  renderPlayerList();
  startGameBtn.disabled = players.length < 2;
}

function renderPlayerList() {
  playerList.innerHTML = '';
  players.forEach((p, i) => {
    const li = document.createElement('li');
    li.textContent = p.name;
    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Fjern';
    removeBtn.onclick = () => {
      players.splice(i, 1);
      renderPlayerList();
      startGameBtn.disabled = players.length < 2;
    };
    li.appendChild(removeBtn);
    playerList.appendChild(li);
  });
}

// --- Start spil ---
function startGame() {
  if (players.length < 2) return;
  gameStarted = true;

  const activeBox = document.querySelector('.mode-box.active');
  isDiceMode = activeBox ? activeBox.dataset.mode === 'dice' : true;

  startScreen.style.display = 'none';
  gameScreen.style.display = 'block';
  resetBtn.style.display = 'inline-block';
  saveBtn.style.display = 'inline-block';

  buildScoreTable();
  updateTotals();

  if (isDiceMode) {
    diceArea.style.display = 'block';
    startNewRound(); // Kalder renderDice()
  } else {
    diceArea.style.display = 'none';
    enableManualInput();
  }
}

function buildScoreTable() {
  document.documentElement.style.setProperty('--n-players', players.length);
  const thead = document.querySelector('#scoreTable thead tr');
  const tbody = document.querySelector('#scoreTable tbody');

  // Ryd gamle spiller-kolonner (fra index 1 til end-1, behold Handling)
  Array.from(thead.children).slice(1, -1).forEach(th => th.remove());
  Array.from(tbody.querySelectorAll('tr')).forEach(row => {
    Array.from(row.children).slice(1, -1).forEach(td => td.remove());
  });

  // Beregn kolonnebredde
  const totalCols = players.length + 2;
  const colWidth = `${100 / totalCols}%`;

  // Få reference til Handling-kolonne
  const handlingTh = thead.children[1]; // Index 1 = Handling

  // Tilføj kolonne per spiller (insert before Handling)
  players.forEach((player, i) => {
    // Header
    const th = document.createElement('th');
    th.textContent = player.name;
    th.className = 'player-header';
    th.style.width = colWidth;
    if (i === currentPlayerIndex) th.classList.add('current');
    thead.insertBefore(th, handlingTh);

    // Celler i hver række
    tbody.querySelectorAll('tr').forEach(row => {
      const handlingTd = row.children[1];
      if (!handlingTd) return; // Skip section rows (de har kun 1 child)

      const td = document.createElement('td');
      td.className = 'score';
      td.style.width = colWidth;
      td.dataset.playerIndex = i;

      if (row.dataset.cat) {
        td.dataset.cat = row.dataset.cat;
        if (player.scores[row.dataset.cat] !== undefined) {
          td.textContent = player.scores[row.dataset.cat];
          td.classList.add('filled');
        }
      }

      // Total-rækker
      if (row.textContent.includes('Sum')) td.id = `sum-${i}`;
      if (row.textContent.includes('Bonus')) td.id = `bonus-${i}`;
      if (row.textContent.includes('Øvre total')) td.id = `upperTotal-${i}`;
      if (row.textContent.includes('Nedre total')) td.id = `lowerTotal-${i}`;
      if (row.textContent.includes('TOTAL')) td.id = `grandTotal-${i}`;

      row.insertBefore(td, handlingTd);
    });
  });

  // Opdater colspan på section-rækker (Øvre del, Nedre del)
  tbody.querySelectorAll('td.section').forEach(td => {
    td.colSpan = players.length + 2;
  });

  updateCurrentPlayerHighlight();
  if (isDiceMode && rollsLeft < 3) updatePossibleScores();
}

function updateCurrentPlayerHighlight() {
  document.querySelectorAll('.player-header').forEach((th, i) => {
    th.classList.toggle('current', i === currentPlayerIndex);
  });
}

// --- Nyt spil ---
resetBtn.addEventListener('click', () => {
  location.reload(); // Nem genstart
});

// --- Terninger ---
function startNewRound() {
  currentDice = [1,1,1,1,1];
  locked = [false,false,false,false,false];
  rollsLeft = 3;
  document.getElementById('rollsLeft').textContent = rollsLeft;
  renderDice(); // ALTID KALDES
  updatePossibleScores();
}

function renderDice() {
  const container = document.getElementById('diceContainer');
  container.innerHTML = '';
  currentDice.forEach((val, i) => {
    const die = document.createElement('div');
    die.className = `die ${locked[i] ? 'locked' : ''}`;
    die.textContent = val;
    die.onclick = () => toggleDieLock(i);
    container.appendChild(die);
  });
}

function toggleDieLock(i) {
  if (rollsLeft === 3) return;
  locked[i] = !locked[i];
  renderDice();
}

document.getElementById('rollBtn').addEventListener('click', () => {
  if (rollsLeft <= 0) return;
  rollsLeft--;
  document.getElementById('rollsLeft').textContent = rollsLeft;

  currentDice = currentDice.map((v, i) => locked[i] ? v : Math.floor(Math.random() * 6) + 1);

  document.querySelectorAll('.die').forEach((die, i) => {
    if (!locked[i]) die.classList.add('rolling');
    setTimeout(() => die.classList.remove('rolling'), 500);
  });

  setTimeout(() => {
    renderDice();
    updatePossibleScores();
  }, 500);
});

function updatePossibleScores() {
  if (rollsLeft === 3) return;

  document.querySelectorAll('tr[data-cat]').forEach(row => {
    const cat = row.dataset.cat;
    const player = players[currentPlayerIndex];
    if (player.scores[cat] !== undefined) return;

    const score = categories[cat](currentDice);
    const btn = row.querySelector('.fill');
    if (btn && !btn.disabled) {
      btn.textContent = `Udfyld (${score})`;
      btn.style.background = '#28a745';
    }
  });
}

// --- Manuel indtastning ---
function enableManualInput() {
  document.querySelectorAll('[data-cat]').forEach(row => {
    const cat = row.dataset.cat;
    const player = players[currentPlayerIndex];
    if (player.scores[cat] !== undefined) return;

    const scoreCell = row.querySelector('.score');
    scoreCell.contentEditable = true;
    scoreCell.style.background = '#f0f0f0';
    scoreCell.onblur = () => {
      const val = parseInt(scoreCell.textContent) || 0;
      player.scores[cat] = val;
      scoreCell.contentEditable = false;
      scoreCell.style.background = '';
      row.querySelector('.fill').disabled = true;
      row.querySelector('.fill').textContent = 'Done';
      updateTotals();
      nextPlayer();
    };
  });
}

// --- UDFYLD-KNAP VISER POINT ---
document.querySelectorAll('.fill').forEach(btn => {
  btn.replaceWith(btn.cloneNode(true)); // Fjern gamle listeners
});

// --- KLIK PÅ UDFYLD-KNAP ---
document.querySelector('#scoreTable').addEventListener('click', (e) => {
  const btn = e.target.closest('.fill');
  if (!btn || !isDiceMode || rollsLeft === 3) return;

  const row = btn.closest('tr');
  const cat = row.dataset.cat;
  if (!cat) return;

  const player = players[currentPlayerIndex];
  if (player.scores[cat] !== undefined) return;

  const score = categories[cat](currentDice);
  player.scores[cat] = score;

  // Find spillerens score-celle: kolonne = 1 + currentPlayerIndex
  const scoreCell = row.cells[1 + currentPlayerIndex];
  scoreCell.textContent = score;
  scoreCell.classList.add('filled');

  btn.disabled = true;
  btn.textContent = 'Done';
  btn.style.background = '#aaa';

  updateTotals();
  nextPlayer();
});


// --- Skift spiller ---
function nextPlayer() {
  currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
  updateCurrentPlayerHighlight();

  if (isDiceMode) {
    startNewRound();
    buildScoreTable(); // Opdater mulige scores
  } else {
    enableManualInput();
  }

  // Tjek vinder
  if (players.every(p => Object.keys(p.scores).length === Object.keys(categories).length)) {
    showWinner();
  }
}

function showWinner() {
  const winner = players.reduce((a, b) => {
    const aTotal = getPlayerTotal(a);
    const bTotal = getPlayerTotal(b);
    return aTotal > bTotal ? a : b;
  });
  alert(`Spillet er slut! Vinder: ${winner.name} med ${getPlayerTotal(winner)} point!`);
}

// --- Totaler ---
function updateTotals() {
  players.forEach((player, i) => {
    const upper = ['ones','twos','threes','fours','fives','sixes'];
    const upperSum = upper.reduce((s, c) => s + (player.scores[c] || 0), 0);
    const bonus = upperSum >= 63 ? 50 : 0;

    const lower = ['onePair','twoPairs','threeKind','fourKind','smallStraight','largeStraight','house','chance','yatzy'];
    const lowerTotal = lower.reduce((s, c) => s + (player.scores[c] || 0), 0);
    const grandTotal = upperSum + bonus + lowerTotal;

    // Opdater celler
    document.getElementById(`sum-${i}`).textContent = upperSum;
    document.getElementById(`bonus-${i}`).textContent = bonus;
    document.getElementById(`upperTotal-${i}`).textContent = upperSum + bonus;
    document.getElementById(`lowerTotal-${i}`).textContent = lowerTotal;
    document.getElementById(`grandTotal-${i}`).textContent = grandTotal;
  });
}

function getPlayerTotal(player) {
  const upper = ['ones','twos','threes','fours','fives','sixes'];
  const upperSum = upper.reduce((s, c) => s + (player.scores[c] || 0), 0);
  const bonus = upperSum >= 63 ? 50 : 0;
  const lower = ['onePair','twoPairs','threeKind','fourKind','smallStraight','largeStraight','house','chance','yatzy'];
  const lowerTotal = lower.reduce((s, c) => s + (player.scores[c] || 0), 0);
  return upperSum + bonus + lowerTotal;
}

// --- Toggle ---
toggleDiceBtn.addEventListener('click', () => {
  if (isDiceMode && rollsLeft < 3) {
    alert('Udfyld en kategori først!');
    return;
  }
  isDiceMode = !isDiceMode;
  diceArea.style.display = isDiceMode ? 'block' : 'none';
  toggleDiceBtn.textContent = isDiceMode ? 'Manual Mode' : 'Spil med terninger';

  if (isDiceMode) {
    startNewRound();
  } else {
    enableManualInput();
  }
});

// --- Gem som note ---
saveBtn.addEventListener('click', () => {
  const data = {
    date: new Date().toLocaleString(),
    mode: isDiceMode ? 'Terninger' : 'Manuel',
    players: players.map(p => ({
      name: p.name,
      scores: p.scores,
      total: getPlayerTotal(p)
    }))
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `yatzy-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
});