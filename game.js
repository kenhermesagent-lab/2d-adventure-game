// EnvSync Adventure — Chapter 1
// Vanilla JS + HTML5 Canvas

const GAME = {
  width: 960,
  height: 640,
  tileSize: 40,
  cols: 24,
  rows: 16,
  player: null,
  npc: null,
  enemies: [],
  items: [],
  dialogue: null,
  gameState: 'title', // title, playing, dialogue, wallet, gameover
  keys: {},
  touchX: 0,
  touchY: 0,
  moveQueue: [],
  saveKey: 'envsync_adventure_save',
  money: 0,
  chapter: 1,
  chapter2Unlocked: false
};

const TILES = {
  grass: 0,
  path: 1,
  water: 2,
  forest: 3,
  building: 4,
  wall: 5,
  door: 6,
  flag: 7
};

const COLORS = {
  grass: '#3a7d44',
  path: '#b8a06a',
  water: '#3a7a9a',
  forest: '#2d5a3a',
  building: '#5a4a3a',
  wall: '#2a2a2a',
  door: '#c4a84a',
  flag: '#c4a84a',
  tileColor: '#2a3a2a'
};

const ASSETS = {
  player: { sprite: [] },
  npc: { sprite: [] },
  enemy: []
};

// Player state
GAME.player = {
  x: 6,
  y: 6,
  speed: 2.0,
  radius: 12,
  hp: 100,
  maxHp: 100,
  dialogue: null,
  hasKey: false,
  chapter1Completed: false
};

// NPC
GAME.npc = {
  x: 10,
  y: 8,
  radius: 12,
  name: 'Elder Mira',
  dialogue: [
    'Welcome to the village of Brannford. The land is dark and the roads are unsafe.',
    'I need a brave soul to venture into the Thornwood forest. Something is lurking in the shadows.',
    'Bring me a glowing flower from the deep forest. Then I can light the way forward.',
    'The Chapter 2 quest awaits beyond the Thornwood. Are you brave enough?',
    'You have courage. The next chapter will test your will.'
  ],
  visitors: 0,
  questGiven: false,
  isTalking: false
};

// Initialize game
function initGame() {
  GAME.player = {
    x: 6,
    y: 6,
    speed: 2.0,
    radius: 12,
    hp: 100,
    maxHp: 100,
    dialogue: null,
    hasKey: false,
    chapter1Completed: false
  };

  GAME.npc = {
    x: 10,
    y: 8,
    radius: 12,
    name: 'Elder Mira',
    dialogue: [
      'Welcome to the village of Brannford. The land is dark and the roads are unsafe.',
      'I need a brave soul to venture into the Thornwood forest. Something is lurking in the shadows.',
      'Bring me a glowing flower from the deep forest. Then I can light the way forward.',
      'The Chapter 2 quest awaits beyond the Thornwood. Are you brave enough?',
      'You have courage. The next chapter will test your will.'
    ],
    visitors: 0,
    questGiven: false,
    isTalking: false
  };

  GAME.gameState = 'title';
  GAME.dialogue = null;
  GAME.money = 0;
  GAME.chapter2Unlocked = false;
  GAME.moveQueue = [];
  GAME.keys = {};

  const canvas = document.getElementById('game');
  canvas.width = GAME.width;
  canvas.height = GAME.height;
  GAME.ctx = canvas.getContext('2d');

  setupInput();
  setupTouchControls();
  setupWalletModal();
  loadSave();
  startTitle();
  render();
}

// Input setup
function setupInput() {
  document.addEventListener('keydown', (e) => {
    GAME.keys[e.key.toLowerCase()] = true;
    if (e.key === ' ' || e.key === 'up') {
      e.preventDefault();
    }
  });

  document.addEventListener('keyup', (e) => {
    GAME.keys[e.key.toLowerCase()] = false;
  });
}

// Touch controls setup
function setupTouchControls() {
  const container = document.getElementById('game-container');
  const touchZone = document.createElement('div');
  touchZone.id = 'touch-zone';
  touchZone.innerHTML = `
        <div id="dpad">
          <div class="dpad-dir" data-dir="up"></div>
          <div class="dpad-dir" data-dir="down"></div>
          <div class="dpad-dir" data-dir="left"></div>
          <div class="dpad-dir" data-dir="right"></div>
        </div>
        <div id="action-zone">
          <button class="action-btn" data-action="interact">Talk</button>
        </div>
      `;
  container.appendChild(touchZone);

  const dpad = document.getElementById('dpad');
  const actionZone = document.getElementById('action-zone');
  const actionBtn = actionZone.querySelector('[data-action="interact"]');

  dpad.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    const dir = touch.target.dataset.dir;
    if (dir) {
      GAME.moveQueue.push(dir);
    }
  });

  dpad.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const dir = touch.target.dataset.dir;
    if (dir) {
      GAME.moveQueue.push(dir);
    }
  });

  dpad.addEventListener('touchend', () => {
    GAME.moveQueue = [];
  });

  actionZone.addEventListener('click', (e) => {
    if (GAME.npc && GAME.npc.isVisible) {
      startDialogue();
    }
  });

  actionZone.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (GAME.npc && GAME.npc.isVisible) {
      startDialogue();
    }
  });
}

function setupWalletModal() {
  const closeBtn = document.getElementById('close-modal');
  const confirmBtn = document.getElementById('confirm-pay');
  const selectedPrice = document.getElementById('selected-price');
  const walletAmount = document.getElementById('wallet-amount');

  let selectedAmount = 3;

  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeWalletModal();
  });

  document.getElementById('wallet-modal').addEventListener('click', (e) => {
    e.stopPropagation();
  });

  document.querySelectorAll('.price-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.price-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedAmount = parseInt(btn.dataset.amount);
    });
  });

  confirmBtn.addEventListener('click', () => {
    const amount = selectedAmount;
    const wallet = '0x4F4a51f49054440084752e10385DD74eb4Cd9C67';
    closeWalletModal();
    showThanks(amount, wallet);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeWalletModal();
    }
  });
}

function closeWalletModal() {
  document.getElementById('wallet-modal').classList.add('hidden');
  GAME.gameState = 'playing';
}

function showThanks(amount, wallet) {
  const overlay = document.createElement('div');
  overlay.id = 'game-overlay';
  overlay.innerHTML = `
        <div class="menu-title">Thank you!</div>
        <div class="menu-subtitle">Supporter badge unlocked</div>
        <div class="option-btn" style="font-size:14px;">
          <code style="color:#34d399;">0x4F4a51f49054440084752e10385DD74eb4Cd9C67</code>
        </div>
        <div class="option-btn" style="font-size:14px;">
          Chapter 2 Access: GRANTED
        </div>
        <div class="option-btn" style="font-size:14px;margin-top:8px;">
          <label style="color:#888;">Your amount: <strong style="color:#fff;">$${amount}</strong></label>
        </div>
        <div class="option-btn" style="font-size:14px;margin-top:8px;">
          <label style="color:#888;">Transaction: <strong style="color:#34d399;">DISPATCHED</strong></label>
        </div>
        <button class="option-btn" id="close-thanks" style="margin-top:16px;">Return to World</button>
      `;
  document.getElementById('game-container').appendChild(overlay);

  overlay.querySelector('#close-thanks').addEventListener('click', () => {
    overlay.remove();
    GAME.gameState = 'title';
    loadSave();
    startTitle();
  });
}

function startTitle() {
  GAME.gameState = 'title';
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const w = GAME.width;
  const h = GAME.height;

  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#fff';
  ctx.font = '32px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('EnvSync Adventure', w / 2, 200);

  ctx.fillStyle = '#888';
  ctx.font = '18px "Courier New", monospace';
  ctx.fillText('Chapter 1 — Brannford', w / 2, 240);

  ctx.fillStyle = '#34d399';
  ctx.font = '20px "Courier New", monospace';
  ctx.fillText('Press SPACE to start', w / 2, 320);
}

function loadSave() {
  try {
    const saved = localStorage.getItem('envsync_adventure_save');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.money) GAME.money = data.money;
      if (data.chapter2Unlocked) GAME.chapter2Unlocked = data.chapter2Unlocked;
      if (data.chapter1Completed) GAME.player.chapter1Completed = true;
    }
  } catch (e) {
    // no saved state
  }
}

function saveGame() {
  const data = {
    money: GAME.money,
    chapter2Unlocked: GAME.chapter2Unlocked,
    chapter1Completed: GAME.player.chapter1Completed
  };
  localStorage.setItem('envsync_adventure_save', JSON.stringify(data));
}

function main() {
  if (GAME.gameState === 'title') {
    // Title screen handled separately
    return;
  }

  if (GAME.gameState === 'dialogue' && GAME.dialogue) {
    handleDialogue();
    return;
  }

  if (GAME.gameState === 'wallet') {
    return;
  }

  update();
  draw();
  requestAnimationFrame(main);
}

function update() {
  if (GAME.gameState !== 'playing') return;

  const speed = GAME.player.speed;

  if (GAME.moveQueue.length > 0) {
    const dir = GAME.moveQueue.shift();
    const dx = dir === 'right' ? 1 : dir === 'left' ? -1 : 0;
    const dy = dir === 'down' ? 1 : dir === 'up' ? -1 : 0;
    movePlayer(dx, dy);
  }

  // Auto-move with continuous keys
  const keys = GAME.keys;
  let dx = 0;
  let dy = 0;
  if (keys['arrowright'] || keys['d']) dx = 1;
  if (keys['arrowleft'] || keys['a']) dx = -1;
  if (keys['arrowdown'] || keys['s']) dy = 1;
  if (keys['arrowup'] || keys['w']) dy = -1;

  if (dx !== 0 || dy !== 0) {
    movePlayer(dx, dy);
  }

  // NPC interaction
  if (GAME.npc && Math.hypot(GAME.player.x - GAME.npc.x, GAME.player.y - GAME.npc.y) < 1.5) {
    if (GAME.keys['e'] || GAME.keys[' ']) {
      startDialogue();
    }
  }
}

function movePlayer(dx, dy) {
  const newX = Math.floor((GAME.player.x + dx + GAME.cols) % GAME.cols);
  const newY = Math.floor((GAME.player.y + dy + GAME.rows) % GAME.rows);

  const tile = getTile(newX, newY);
  if (tile !== TILES.wall && tile !== TILES.building) {
    GAME.player.x = newX;
    GAME.player.y = newY;
    updateCamera();
  }
}

function getTile(x, y) {
  if (x < 0 || x >= GAME.cols || y < 0 || y >= GAME.rows) {
    return TILES.wall;
  }
  return TILES.grass;
}

function updateCamera() {
  const canvas = document.getElementById('game');
  const cx = GAME.player.x * GAME.tileSize + GAME.tileSize / 2;
  const cy = GAME.player.y * GAME.tileSize + GAME.tileSize / 2;
  const halfW = canvas.width / 2;
  const halfH = canvas.height / 2;

  const targetX = cx - halfW;
  const targetY = cy - halfH;

  const clampedX = Math.max(0, Math.min(GAME.cols * GAME.tileSize - canvas.width, targetX));
  const clampedY = Math.max(0, Math.min(GAME.rows * GAME.tileSize - canvas.height, targetY));

  canvas.style.transform = `translate3d(${clampedX}px, ${clampedY}px, 0)`;
}

function draw() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const offsetX = canvas.style.transform ? parseFloat(canvas.style.transform.replace('px, 0px, 0px)', '')) : 0;

  // Clear
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw tiles
  for (let y = 0; y < GAME.rows; y++) {
    for (let x = 0; x < GAME.cols; x++) {
      const tileType = getTile(x, y);
      const sx = x * GAME.tileSize - offsetX;
      const sy = y * GAME.tileSize - offsetY;

      ctx.fillStyle = COLORS.grass;
      ctx.fillRect(sx, sy, GAME.tileSize, GAME.tileSize);

      // Simple tile decorations
      if (tileType === TILES.grass) {
        ctx.fillStyle = '#4a8a5a';
        ctx.fillRect(sx, sy + 30, GAME.tileSize, GAME.tileSize - 30);
      } else if (tileType === TILES.path) {
        ctx.fillStyle = '#b8a06a';
        ctx.fillRect(sx + 4, sy + 4, GAME.tileSize - 8, GAME.tileSize - 8);
      }
    }
  }

  // Draw items grid
  const itemGrid = [
    { x: 12, y: 10, type: 'flower' },
    { x: 12, y: 10, type: 'flower' }
  ];

  // Draw NPC
  if (GAME.npc) {
    const npcX = GAME.npc.x * GAME.tileSize + GAME.tileSize / 2;
    const npcY = GAME.npc.y * GAME.tileSize + GAME.tileSize / 2;
    const sx = npcX - offsetX;
    const sy = npcY - offsetY;

    ctx.fillStyle = '#4a9a6a';
    ctx.beginPath();
    ctx.arc(sx, sy, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ddd';
    ctx.font = '14px "Courier New", monospace';
    ctx.fillText('Elder Mira', sx - 30, sy - 10);
  }

  // Draw player
  const px = GAME.player.x * GAME.tileSize + GAME.tileSize / 2;
  const py = GAME.player.y * GAME.tileSize + GAME.tileSize / 2;
  const sx = px - offsetX;
  const sy = py - offsetY;

  ctx.fillStyle = '#60a0ff';
  ctx.beginPath();
  ctx.arc(sx, sy, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.font = '14px "Courier New", monospace';
  ctx.fillText('You', sx - 20, sy + 18);

  // Draw UI
  drawUI();
}

function drawUI() {
  const ctx = document.getElementById('game').getContext('2d');
  const canvas = document.getElementById('game');
  const offsetX = canvas.style.transform ? parseFloat(canvas.style.transform.replace('px, 0px, 0px)', '')) : 0;
  const offsetY = 0;

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(10, 10, 200, 50);

  ctx.fillStyle = '#ddd';
  ctx.font = '14px "Courier New", monospace';
  ctx.fillText('HP: ' + GAME.player.hp + '%', 20, 35);
  ctx.fillText('Chapter 1', 20, 55);
  ctx.fillText('Money: $' + GAME.money, 20, 75);
}

function startDialogue() {
  if (GAME.dialogue !== null) {
    GAME.gameState = 'playing';
    return;
  }

  GAME.dialogue = {
    speaker: 'Elder Mira',
    lines: GAME.npc.dialogue,
    currentLine: 0,
    options: [
      { text: 'I need help again... (talk)', action: 'next' },
      { text: 'What can you do for me?', action: 'next' },
      { text: 'I am ready to help.', action: 'next' },
      { text: 'Goodbye.', action: 'close' }
    ],
    currentOption: 0,
    finished: false
  };

  GAME.gameState = 'dialogue';
  showDialogue();
}

function showDialogue() {
  const container = document.getElementById('dialogue-box');
  const textEl = document.getElementById('dialogue-text');
  const optionsEl = document.getElementById('dialogue-options');

  const d = GAME.dialogue;

  if (d.finished) {
    container.innerHTML = `
          <div>
            <p style="color:#888;margin:0;">Thank you for your time, ${GAME.npc.name}.</p>
            <p style="color:#888;margin:4px 0;">The path forward is clear. The world needs heroes.</p>
          </div>
        `;
    container.style.display = 'block';
    return;
  }

  textEl.textContent = d.speaker + ': ' + d.lines[d.currentLine];
  optionsEl.innerHTML = '';

  d.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'dialogue-option';
    btn.textContent = opt.text;
    btn.addEventListener('click', () => {
      if (i === 0) {
        // talk
        if (d.currentLine < d.lines.length - 1) {
          d.currentLine++;
          showDialogue();
        } else {
          d.finished = true;
          showDialogue();
        }
      } else if (i === 1) {
        // help
        d.currentLine = Math.min(d.currentLine + 1, d.lines.length - 1);
        showDialogue();
      } else if (i === 2) {
        // ready to help
        d.currentLine = 0;
        finishDialogue();
      } else if (i === 3) {
        closeDialogue();
      }
    });
    optionsEl.appendChild(btn);
  });

  container.style.display = 'block';
}

function finishDialogue() {
  // Give the player a quest item if they want
  GAME.player.questGiven = true;
  GAME.gameState = 'playing';
  closeDialogue();
  showChapterComplete();
}

function showChapterComplete() {
  const overlay = document.getElementById('game-container');
  if (overlay.querySelector('.chapter-complete')) return;

  const div = document.createElement('div');
  div.className = 'chapter-complete';
  div.innerHTML = `
      <div class="menu-title">Chapter 1 Complete!</div>
      <div class="menu-subtitle">You have shown great courage, Elder Mira.</div>
      <p style="color:#888;font-size:14px;margin-bottom:16px;">
        The path to Chapter 2 is now open. Your journey continues.
      </p>
      <div class="option-btn" style="font-size:18px;">
        See Chapter 2
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </div>
      <div class="option-btn" style="margin-top:8px;font-size:14px;">
        <label style="color:#888;">Donate: <strong style="color:#34d399;">$1-$3 USDC</strong></label>
        <div class="price-options" style="margin-top:12px;">
          <button class="price-btn" data-amount="1">$1 (Stretch)</button>
          <button class="price-btn" data-amount="3">$3 (Supporter Badge)</button>
        </div>
        <div class="wallet-address" style="margin-top:8px;">
          <span class="label">Pay via wallet:</span>
          <code class="mono">0x4F4a51f49054440084752e10385DD74eb4Cd9C67</code>
        </div>
        <div class="modal-actions" style="margin-top:12px;">
          <button class="btn-secondary" style="margin-right:8px;">Cancel</button>
          <button class="btn-primary" id="confirm-pay">Confirm &amp; Unlock</button>
        </div>
      </div>
  `;
  document.getElementById('game-container').appendChild(div);

  div.querySelector('.option-btn').addEventListener('click', () => {
    div.remove();
    GAME.gameState = 'playing';
    loadSave();
  });

  div.querySelectorAll('.price-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const amount = parseInt(btn.dataset.amount);
      div.querySelectorAll('.price-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  div.querySelector('#confirm-pay').addEventListener('click', () => {
    const amount = document.querySelector('.price-btn.active')?.dataset.amount || '3';
    div.querySelectorAll('.price-btn').forEach(b => b.classList.remove('active'));
    div.querySelectorAll('.price-btn').forEach(b => b.classList.add('active'));
  });

  setTimeout(() => {
    div.querySelector('#confirm-pay').addEventListener('click', () => {
      const amount = div.querySelector('.price-btn.active')?.dataset.amount || '3';
      div.remove();
      GAME.gameState = 'wallet';
      showThanks(amount, '0x4F4a51f49054440084752e10385DD74eb4Cd9C67');
    });
  }, 100);
}

function closeDialogue() {
  GAME.dialogue = null;
  const container = document.getElementById('dialogue-box');
  container.style.display = 'none';
}

function render() {
  draw();
  requestAnimationFrame(render);
}

// Start
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    GAME.gameState = 'playing';
    startTitle();
    main();
  }, 100);
});
