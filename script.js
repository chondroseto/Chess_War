// Simple Chess - basic legal moves, turns, capture, promotion. No castling/en passant/check.

/** Utilities **/
const files = ["a","b","c","d","e","f","g","h"];
const ranks = [8,7,6,5,4,3,2,1];

function inBounds(f, r) { return f >= 0 && f < 8 && r >= 0 && r < 8; }
function algebraic(fileIdx, rankIdx) { return `${files[fileIdx]}${ranks[rankIdx]}`; }
function fromAlgebraic(sq) {
  const f = files.indexOf(sq[0]);
  const r = ranks.indexOf(Number(sq[1]));
  return { f, r };
}

/** Game State **/
// Piece codes: 'P','N','B','R','Q','K' for white, lowercase for black
let board = [];
let turn = 'w'; // 'w' or 'b'
let selected = null; // {f,r}
let legal = new Set(); // of "f,r"
// Occupy/area control state
let occupy = []; // array[8][8] of { owner: 'w'|'b'|null, holdW: number, holdB: number }
let coins = { w: 0, b: 0 };
// Shop state
let buyMode = null; // null or { piece: 'P'|'N'|'B'|'R'|'Q' } or { missile: true }
const PRICES = { P: 1, N: 3, B: 3, R: 5, Q: 9, MISSILE: 4 };

function setupInitial() {
  board = Array.from({ length: 8 }, () => Array(8).fill(null));
  const back = ['R','N','B','Q','K','B','N','R'];
  // White at rank 1,2 (array bottom), Black at rank 8,7 (array top). Our ranks array is [8..1], so index 7 is rank 1
  board[7] = back.map(x => x);
  board[6] = Array(8).fill('P');
  board[1] = Array(8).fill('p');
  board[0] = back.map(x => x.toLowerCase());
  turn = 'w';
  selected = null;
  legal.clear();
  // init occupy grid
  occupy = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => ({ owner: null, holdW: 0, holdB: 0 })));
  coins = { w: 0, b: 0 };
}

/** Rendering **/
const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const resetBtn = document.getElementById('resetBtn');
const cancelBuyBtn = document.getElementById('cancelBuy');
const buyMissileBtn = document.getElementById('buyMissile');

function pieceToChar(p) {
  // Unicode chess symbols
  switch (p) {
    case 'K': return '♔';
    case 'Q': return '♕';
    case 'R': return '♖';
    case 'B': return '♗';
    case 'N': return '♘';
    case 'P': return '♙';
    case 'k': return '♚';
    case 'q': return '♛';
    case 'r': return '♜';
    case 'b': return '♝';
    case 'n': return '♞';
    // Use the same pawn shape for black as white per request
    case 'p': return '♙';
    default: return '';
  }
}

function isWhite(p) { return p && p === p.toUpperCase(); }
function isBlack(p) { return p && p === p.toLowerCase(); }

function render() {
  boardEl.innerHTML = '';
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const sq = document.createElement('div');
      sq.className = `square ${(f + r) % 2 === 0 ? 'light' : 'dark'}`;
      sq.dataset.f = String(f);
      sq.dataset.r = String(r);
      const p = board[r][f];
      if (p) {
        const span = document.createElement('span');
        span.className = `piece ${isWhite(p) ? 'white' : 'black'}`;
        span.textContent = pieceToChar(p);
        sq.appendChild(span);
      }
      // ownership color
      const own = occupy?.[r]?.[f]?.owner;
      if (own === 'w') sq.classList.add('own-w');
      if (own === 'b') sq.classList.add('own-b');
      // buy placement highlights
      if (buyMode && isPlaceableSquare(f, r)) {
        sq.classList.add('placeable');
      }
      // missile targeting highlights
      if (buyMode && buyMode.missile && isTargetableMissile(f, r)) {
        sq.classList.add('targetable');
      }
      if (selected && selected.f === f && selected.r === r) {
        sq.classList.add('selected');
      }
      if (legal.has(`${f},${r}`)) {
        sq.classList.add('highlight');
      }
      sq.addEventListener('click', onSquareClick);
      boardEl.appendChild(sq);
    }
  }
  statusEl.textContent = `Turn: ${turn === 'w' ? 'White' : 'Black'}`;
  const coinW = document.getElementById('coinW');
  const coinB = document.getElementById('coinB');
  if (coinW) coinW.textContent = `P1 Coins: ${coins.w}`;
  if (coinB) coinB.textContent = `P2 Coins: ${coins.b}`;
}

/** Move Generation **/
function genMoves(f, r) {
  const p = board[r][f];
  if (!p) return [];
  const moves = [];
  const side = isWhite(p) ? 'w' : 'b';
  const forward = side === 'w' ? -1 : 1; // because rank 0 is top (8), rank 7 is bottom (1)

  function pushIfEmpty(ff, rr) {
    if (inBounds(ff, rr) && board[rr][ff] === null) moves.push([ff, rr]);
  }
  function pushIfEnemy(ff, rr) {
    if (!inBounds(ff, rr)) return;
    const t = board[rr][ff];
    if (t && ((side === 'w' && isBlack(t)) || (side === 'b' && isWhite(t)))) moves.push([ff, rr]);
  }
  function slide(dfs, drs) {
    for (let i = 0; i < dfs.length; i++) {
      const df = dfs[i], dr = drs[i];
      let ff = f + df, rr = r + dr;
      while (inBounds(ff, rr)) {
        if (board[rr][ff] === null) {
          moves.push([ff, rr]);
        } else {
          // stop at first piece; include if enemy
          const t = board[rr][ff];
          if ((side === 'w' && isBlack(t)) || (side === 'b' && isWhite(t))) moves.push([ff, rr]);
          break;
        }
        ff += df; rr += dr;
      }
    }
  }

  switch (p.toLowerCase()) {
    case 'p': {
      // single step
      pushIfEmpty(f, r + forward);
      // double on start rank
      const startRank = side === 'w' ? 6 : 1;
      if (r === startRank && board[r + forward]?.[f] === null) {
        pushIfEmpty(f, r + 2 * forward);
      }
      // captures
      pushIfEnemy(f - 1, r + forward);
      pushIfEnemy(f + 1, r + forward);
      break;
    }
    case 'n': {
      const steps = [[1,2],[2,1],[2,-1],[1,-2],[-1,-2],[-2,-1],[-2,1],[-1,2]];
      for (const [df, dr] of steps) {
        const ff = f + df, rr = r + dr;
        if (!inBounds(ff, rr)) continue;
        const t = board[rr][ff];
        if (!t || (side === 'w' ? isBlack(t) : isWhite(t))) moves.push([ff, rr]);
      }
      break;
    }
    case 'b': {
      slide([1,1,-1,-1],[1,-1,1,-1]);
      break;
    }
    case 'r': {
      slide([1,-1,0,0],[0,0,1,-1]);
      break;
    }
    case 'q': {
      slide([1,1,-1,-1,1,-1,0,0],[1,-1,1,-1,0,0,1,-1]);
      break;
    }
    case 'k': {
      for (let df = -1; df <= 1; df++) {
        for (let dr = -1; dr <= 1; dr++) {
          if (df === 0 && dr === 0) continue;
          const ff = f + df, rr = r + dr;
          if (!inBounds(ff, rr)) continue;
          const t = board[rr][ff];
          if (!t || (side === 'w' ? isBlack(t) : isWhite(t))) moves.push([ff, rr]);
        }
      }
      break;
    }
  }

  return moves;
}

/** Interaction **/
function onSquareClick(e) {
  const f = Number(e.currentTarget.dataset.f);
  const r = Number(e.currentTarget.dataset.r);
  const p = board[r][f];

  // Buying placement click
  if (buyMode) {
    if (buyMode.missile) {
      if (isTargetableMissile(f, r)) {
        fireMissileAt(f, r);
      }
      return;
    } else if (isPlaceableSquare(f, r)) {
      placeBoughtPiece(f, r);
    } else {
      // clicking elsewhere cancels selection/does nothing
      return;
    }
    return;
  }

  // If clicking a piece of current side, (re)select and show moves
  if (p && ((turn === 'w' && isWhite(p)) || (turn === 'b' && isBlack(p)))) {
    selected = { f, r };
    legal = new Set(genMoves(f, r).map(([ff, rr]) => `${ff},${rr}`));
    render();
    return;
  }

  // If square is a legal target, move there
  if (selected && legal.has(`${f},${r}`)) {
    const { f: sf, r: sr } = selected;
    const moving = board[sr][sf];
    board[r][f] = moving;
    board[sr][sf] = null;

    // Pawn promotion: auto promote to queen on last rank
    if (moving === 'P' && r === 0) board[r][f] = 'Q';
    if (moving === 'p' && r === 7) board[r][f] = 'q';

    // Switch turn
    turn = turn === 'w' ? 'b' : 'w';

    // End-of-turn: update occupy holds for all squares where units are standing, then add coins
    updateOccupyEndOfTurn();
    accrueCoins();

    selected = null;
    legal.clear();
    render();
    return;
  }

  // Otherwise clear selection
  selected = null;
  legal.clear();
  render();
}

resetBtn.addEventListener('click', () => { setupInitial(); render(); });
if (cancelBuyBtn) cancelBuyBtn.addEventListener('click', () => { buyMode = null; render(); });
if (buyMissileBtn) buyMissileBtn.addEventListener('click', () => {
  const price = PRICES.MISSILE;
  const currentCoins = turn === 'w' ? coins.w : coins.b;
  if (currentCoins < price) return;
  buyMode = { missile: true };
  selected = null;
  legal.clear();
  render();
});
document.querySelectorAll('.shop-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const piece = btn.getAttribute('data-piece');
    const price = PRICES[piece];
    const currentCoins = turn === 'w' ? coins.w : coins.b;
    if (currentCoins < price) return;
    buyMode = { piece };
    selected = null;
    legal.clear();
    render();
  });
});

// Init
setupInitial();
render();

/** Occupy System **/
function updateOccupyEndOfTurn() {
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const piece = board[r][f];
      const cell = occupy[r][f];
      if (piece === null) {
        // No one standing: reset holds
        cell.holdW = 0;
        cell.holdB = 0;
        continue;
      }
      if (isWhite(piece)) {
        cell.holdB = 0;
        cell.holdW = Math.min(2, cell.holdW + 1);
        if (cell.holdW >= 2) cell.owner = 'w';
      } else {
        cell.holdW = 0;
        cell.holdB = Math.min(2, cell.holdB + 1);
        if (cell.holdB >= 2) cell.owner = 'b';
      }
    }
  }
}

function accrueCoins() {
  let addW = 0, addB = 0;
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const owner = occupy[r][f].owner;
      if (owner === 'w') addW++;
      else if (owner === 'b') addB++;
    }
  }
  coins.w += addW;
  coins.b += addB;
}

/** Shop helpers **/
function isPlaceableSquare(f, r) {
  // must be empty and owned by current player
  if (board[r][f] !== null) return false;
  const cell = occupy[r][f];
  const ownerNeeded = turn;
  return cell.owner === ownerNeeded;
}

function placeBoughtPiece(f, r) {
  const pieceBase = buyMode.piece; // uppercase for white
  const price = PRICES[pieceBase];
  if (turn === 'w') {
    if (coins.w < price) return;
    board[r][f] = pieceBase; // white
    coins.w -= price;
  } else {
    if (coins.b < price) return;
    board[r][f] = pieceBase.toLowerCase(); // black
    coins.b -= price;
  }
  buyMode = null;
  // End turn immediately after buying/placing
  turn = turn === 'w' ? 'b' : 'w';
  updateOccupyEndOfTurn();
  accrueCoins();
  render();
}

function isTargetableMissile(f, r) {
  const cell = occupy[r][f];
  return !!cell.owner; // any owned square (either player)
}

function fireMissileAt(f, r) {
  const price = PRICES.MISSILE;
  if (turn === 'w') {
    if (coins.w < price) return;
    coins.w -= price;
  } else {
    if (coins.b < price) return;
    coins.b -= price;
  }
  // Destroy area: remove ownership, reset holds, destroy piece if any
  occupy[r][f].owner = null;
  occupy[r][f].holdW = 0;
  occupy[r][f].holdB = 0;
  board[r][f] = null;

  buyMode = null;
  // End turn after firing
  turn = turn === 'w' ? 'b' : 'w';
  updateOccupyEndOfTurn();
  accrueCoins();
  render();
}


