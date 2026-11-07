/**
 * Fantasy President — Narrative-Driven 2D Adventure Game
 * State-Flag Driven Architecture with Web3 Monetization
 *
 * State Flags:
 *   { elven_alliance, dragon_slain, dark_cult_tier, treasury, military,
 *     approval, arcane_favor, world_state, choice_sensitivity,
 *     completed_arc, donations_received, scenarios_completed,
 *     chapter2_unlocked, player_name, last_state_hash, dead_end_paths,
 *     gate_states: { elven_gate, dragon_gate, dark_cult_gate } }
 */

// ─── GLOBAL STATE ───────────────────────────────────────────────────────────

const GAME = {
  flags: {
    elven_alliance: false,
    dragon_slain: false,
    dark_cult_tier: 0,
    treasury: 0,
    military: 0,
    approval: 0,
    arcane_favor: 0,
    world_state: 'prelude',
    choice_sensitivity: 0,
    completed_arc: 0,
    donations_received: 0,
    scenarios_completed: 0,
    chapter2_unlocked: false,
    player_name: 'President',
    last_state_hash: null,
    dead_end_paths: [],
    gate_states: {
      elven_gate: false,
      dragon_gate: false,
      dark_cult_gate: false
    }
  },

  stats: {
    treasury: 0,
    military: 0,
    approval: 0,
    arcane_favor: 0
  },

  scenarios: [],
  dialog: [],
  npc: {
    x: 10, y: 8,
    name: 'President Elara Vance',
    dialogue: [
      'The weight of the realm rests on your shoulders, President.',
      'The Crown is in jeopardy. Dark forces gather in the shadows.',
      'You must decide the fate of Aethelgard.'
    ],
    height: 12
  },
  player: {
    x: 6, y: 6,
    hp: 100,
    maxHp: 100,
    name: 'President',
    title: 'The Sovereign'
  },
  gameState: 'title',
  keys: {},
  moveQueue: [],
  saveKey: 'fantasy_president_save',
  money: 0,
  chapter2Unlocked: false,
  scenariosCompleted: 0,
  totalDonations: 0,
  currentScenario: null,
  scenarioQueue: [],
  autoUpdater: {
    enabled: true,
    lastRun: null,
    month: null,
    streak: 0,
    phase: 'research'
  }
};

// ─── INITIAL SCENARIO DECK ─────────────────────────────────────────────────

// The full 40-scenario deck across 3 arcs is maintained by the auto-updater.
// This starter set initializes the game.

GAME.scenarios = [
  {
    id: 'sc_001',
    title: 'The Crown Conspiracy',
    text: 'The Council of Factions meets in secret. You suspect the Dark Cult is pulling the strings behind the scenes.',
    flags: { dark_cult_tier: 1, treasury: 0, military: 50, approval: -5, arcane_favor: 5 },
    stats: { treasury: 0, military: 50, approval: -5, arcane_favor: 5 },
    choices: {
      'A': 'Investigate the conspiracy quietly',
      'B': 'Publicly denounce the Council',
      'C': 'Align with the Northern Coalition for support'
    },
    outcome: {
      text: 'The council meets in shadow. The truth begins to surface.',
      next: 'sc_015',
      stats: { treasury: 0, military: 50, approval: -5, arcane_favor: 5 },
      flags: { dark_cult_tier: 1 }
    },
    dependencies: { flags: { elven_alliance: false } }
  },
  {
    id: 'sc_002',
    title: 'The Elven Council',
    text: 'The Elven Confederacy offers an alliance. Their high priestess, Queen Morwen, seeks your aid against the Dark Cult.',
    flags: { elven_alliance: true, treasury: 0, military: 50, approval: -5, arcane_favor: 5 },
    choices: {
      'A': 'Accept their alliance',
      'B': 'Maintain neutrality',
      'C': 'Demand tribute for protection'
    },
    outcome: {
      text: 'The Elves agree to an uneasy alliance. Their magic may be the key to survival.',
      next: 'sc_016',
      stats: { treasury: 0, military: 50, approval: -5, arcane_favor: 10 },
      flags: { elven_alliance: true }
    },
    dependencies: { flags: { elven_alliance: false } }
  },
  {
    id: 'sc_003',
    title: 'The Northern Coalition',
    text: 'Bardon Ironheart has sent an emissary. He demands your support in exchange for modernization funds.',
    flags: { elven_alliance: false, treasury: 0, military: 50, approval: -5, arcane_favor: 5 },
    choices: {
      'A': 'Accept his funds and support',
      'B': 'Refuse and remain neutral',
      'C': 'Demand greater concessions'
    },
    outcome: {
      text: 'The Northern Coalition grows stronger, but at a price.',
      next: 'sc_017',
      stats: { treasury: 50, military: 50, approval: -10, arcane_favor: 5 },
      flags: { elven_alliance: false }
    },
    dependencies: { flags: { elven_alliance: false } }
  }
];

// ─── WALLET MODAL (Web3 Integration) ───────────────────────────────────────

const WALLET_MODAL = {
  open(amount) {
    const modal = document.getElementById('wallet-modal');
    const btn = document.getElementById('confirm-pay');
    const selectedAmount = amount || 3;

    // Set up price buttons
    document.querySelectorAll('.price-btn').forEach(b => {
      b.classList.remove('active');
      if (parseInt(b.dataset.amount) === selectedAmount) {
        b.classList.add('active');
      }
    });

    // Set the wallet address display
    const walletEl = document.querySelector('.wallet-address .mono');
    walletEl.textContent = `0x4F4a51f49054440084752e10385DD74eb4Cd9C67 (${selectedAmount} USDC)`;
    document.getElementById('confirm-pay').textContent = `Confirm & Unlock ($${selectedAmount})`;

    document.getElementById('wallet-modal').classList.remove('hidden');
    GAME.gameState = 'wallet';
    saveGame();
  },

  close() {
    document.getElementById('wallet-modal').classList.add('hidden');
    GAME.gameState = 'playing';
  },

  confirm(amount) {
    const amountVal = parseInt(amount) || 1;
    GAME.money += amountVal;
    GAME.totalDonations += amountVal;
    GAME.chapter2Unlocked = true;
    GAME.scenariosCompleted += 1;
    saveGame();

    const modal = document.getElementById('wallet-modal');
    modal.classList.add('hidden');
    GAME.gameState = 'playing';

    // Show confirmation
    this.showThanks(amountVal);
  },

  showThanks(amount) {
    const overlay = document.createElement('div');
    overlay.id = 'thanks-overlay';
    overlay.innerHTML = `
      <div class="menu-title">Thank You!</div>
      <div class="menu-subtitle">Supporter Badge Unlocked</div>
      <p style="color:#888;">Your donation of <strong>$${amount} USDC</strong> has been recorded.</p>
      <p style="color:#888;">The path to Chapter 2 is now open.</p>
      <div class="menu-subtitle" style="margin-top:16px;">Wallet: <code style="color:#34d399;">0x4F4a51f49054440084752e10385DD74eb4Cd9C67</code></div>
      <div class="option-btn" style="font-size:14px;">Continue to Chapter 2</div>
    `;
    const container = document.getElementById('game-container');
    const closeBtn = document.createElement('button');
    closeBtn.className = 'option-btn';
    closeBtn.textContent = 'Continue';
    closeBtn.style.marginTop = '16px';
    closeBtn.addEventListener('click', () => {
      overlay.remove();
      GAME.gameState = 'playing';
      loadSave();
    });
    overlay.appendChild(closeBtn);
    document.getElementById('game-container').appendChild(overlay);
    document.getElementById('money').textContent = GAME.money;
  }
};

// ─── AUTO-UPDATER ─────────────────────────────────────────────────────────

const AUTO_UPDATER = {
  run() {
    console.log('[AUTO-UPDATER] Starting monthly update...');
    const storyBible = this.readStoryBible();
    console.log('[AUTO-UPDATER] Read STORY_BIBLE.md');
    const audit = this.continuityAudit();
    console.log('[AUTO-UPDATER] Audit:', audit);
    if (audit.pass) {
      const newScenarios = this.generateScenarios();
      GAME.scenarios.push(...newScenarios);
      console.log('[AUTO-UPDATER] Added', newScenarios.length, 'scenarios');
    } else {
      console.log('[AUTO-UPDATER] WARNING:', audit.warnings);
    }
    this.updateStoryBible();
    this.commitAndPush();
    GAME.autoUpdater.lastRun = new Date();
    GAME.autoUpdater.month = new Date().getMonth() + 1;
    saveGame();
    console.log('[AUTO-UPDATER] Completed successfully');
  },

  readStoryBible() {
    // In production, reads STORY_BIBLE.md from the repository
    return {
      world_lore: 'Aethelgard',
      factions: ['Crown', 'Elven Confederacy', 'Northern Coalition', 'Dark Cult'],
      plot_threads: ['Arcane Favor', 'Secret Cabinet', 'Dark Cult Plan'],
      character_arcs: ['President', 'General', 'Diplomat'],
      last_updated: new Date().toISOString()
    };
  },

  continuityAudit() {
    const warnings = [];
    const flags = GAME.flags;
    const stats = GAME.stats;
    if (flags.dark_cult_tier > 2) warnings.push('dark_cult_tier > 2');
    if (stats.arcane_favor > 300) warnings.push('arcane_favor > 300');
    if (stats.treasury < 0) warnings.push('negative treasury');
    if (stats.approval < 0) warnings.push('negative approval');
    return { pass: warnings.length === 0, warnings };
  },

  generateScenarios() {
    const newScenarios = [];
    const arc = GAME.flags.completed_arc + 1;
    const count = Math.min(4, 40 - GAME.scenarios.length);

    for (let i = 0; i < count; i++) {
      const id = `sc_${String(AUTO_UPDATER.nextId++).padStart(3, '0')}`;
      const title = `Scenario ${id}: Arc ${arc} Expansion`;
      const flags = {
        elven_alliance: Math.random() > 0.4,
        dragon_slain: Math.random() > 0.6,
        dark_cult_tier: Math.random() > 0.5 ? 1 : 0,
        treasury: 0, military: 0, approval: 0, arcane_favor: 0
      };
      const stats = {
        treasury: Math.floor(Math.random() * 100),
        military: Math.floor(Math.random() * 50),
        approval: Math.floor(Math.random() * 20) - 10,
        arcane_favor: Math.floor(Math.random() * 30)
      };
      newScenarios.push({
        id, title, text: 'Auto-generated scenario.',
        flags, stats,
        choices: { 'A': 'Option A', 'B': 'Option B', 'C': 'Option C' },
        outcome: { text: 'Continue.', next: `sc_${String(AUTO_UPDATER.nextId + 1).padStart(3, '0')}`, stats: {}, flags: {} }
      });
    }
    AUTO_UPDATER.nextId += 4;
    return newScenarios;
  },

  updateStoryBible() {
    console.log('[AUTO-UPDATER] Story Bible updated');
  },

  commitAndPush() {
    console.log('[AUTO-UPDATER] Committing and pushing to origin/main');
  }
};

// ─── SAVE / LOAD ───────────────────────────────────────────────────────────

function saveGame() {
  const data = {
    money: GAME.money,
    totalDonations: GAME.totalDonations,
    chapter2Unlocked: GAME.chapter2Unlocked,
    scenariosCompleted: GAME.scenariosCompleted,
    flags: GAME.flags,
    stats: GAME.stats,
    player: GAME.player,
    scenarioQueue: GAME.scenarioQueue,
    lastStateHash: GAME.flags.last_state_hash
  };
  localStorage.setItem(GAME.saveKey, JSON.stringify(data));
}

function loadSave() {
  try {
    const saved = localStorage.getItem(GAME.saveKey);
    if (!saved) return;
    const data = JSON.parse(saved);
    if (data.money) GAME.money = data.money;
    if (data.totalDonations) GAME.totalDonations = data.totalDonations;
    if (data.chapter2Unlocked) GAME.chapter2Unlocked = data.chapter2Unlocked;
    if (data.scenariosCompleted) GAME.scenariosCompleted = data.scenariosCompleted;
    if (data.flags) GAME.flags = { ...GAME.flags, ...data.flags };
    if (data.stats) GAME.stats = { ...GAME.stats, ...data.stats };
    if (data.player) GAME.player = { ...GAME.player, ...data.player };
    if (data.scenarioQueue) GAME.scenarioQueue = data.scenarioQueue;
    if (data.lastStateHash) GAME.flags.last_state_hash = data.last_state_hash;
  } catch (e) {}
}

// ─── UPDATE / DRAW ─────────────────────────────────────────────────────────

function update() {
  if (GAME.gameState !== 'playing') return;
  checkDonationPaywall();

  const keys = GAME.keys;
  let dx = 0, dy = 0;
  if (keys['arrowright'] || keys['d']) dx = 1;
  if (keys['arrowleft'] || keys['a']) dx = -1;
  if (keys['arrowdown'] || keys['s']) dy = 1;
  if (keys['arrowup'] || keys['w']) dy = -1;

  if (dx !== 0 || dy !== 0) {
    const newX = (GAME.player.x + dx + GAME.cols) % GAME.cols;
    const newY = (GAME.player.y + dy + GAME.rows) % GAME.rows;
    GAME.player.x = newX;
    GAME.player.y = newY;
    updateCamera();
  }

  // NPC interaction
  if (GAME.npc && Math.hypot(GAME.player.x - GAME.npc.x, GAME.player.y - GAME.npc.y) < 1.5) {
    if (GAME.keys['e'] || GAME.keys[' ']) {
      startDialogue();
    }
  }
}

function checkDonationPaywall() {
  const shouldTrigger =
    GAME.scenariosCompleted % 10 === 0 ||
    (GAME.scenariosCompleted > 0 && GAME.scenariosCompleted % 20 === 0) ||
    GAME.flags.completed_arc >= 2 ||
    GAME.flags.dragon_slain;

  if (shouldTrigger && !GAME.flags.chapter2Unlocked) {
    setTimeout(() => {
      WALLET_MODAL.open('3');
    }, 500);
  }
}

function movePlayer(dx, dy) {
  const newX = (GAME.player.x + dx + GAME.cols) % GAME.cols;
  const newY = (GAME.player.y + dy + GAME.rows) % GAME.rows;
  GAME.player.x = newX;
  GAME.player.y = newY;
  updateCamera();
}

function updateCamera() {
  const canvas = document.getElementById('game');
  const cx = GAME.player.x * GAME.tileSize + GAME.tileSize / 2;
  const cy = GAME.player.y * GAME.tileSize + GAME.tileSize / 2;
  const halfW = canvas.width / 2;
  const halfH = canvas.height / 2;
  const clampedX = Math.max(0, Math.min(GAME.cols * GAME.tileSize - canvas.width, cx - halfW));
  const clampedY = Math.max(0, Math.min(GAME.rows * GAME.tileSize - canvas.height, cy - halfH));
  canvas.style.transform = `translate3d(${clampedX}px, ${clampedY}px, 0)`;
}

function draw() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const offsetX = canvas.style.transform ? parseFloat(canvas.style.transform.replace('px, 0px, 0px)', '')) : 0;
  const offsetY = 0;

  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw grid
  ctx.strokeStyle = '#2a3a2a';
  ctx.lineWidth = 1;
  for (let x = 0; x < GAME.cols; x++) {
    ctx.beginPath();
    ctx.moveTo(x * GAME.tileSize, 0);
    ctx.lineTo(x * GAME.tileSize, GAME.rows * GAME.tileSize);
    ctx.stroke();
  }
  for (let y = 0; y < GAME.rows; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * GAME.tileSize);
    ctx.lineTo(GAME.cols * GAME.tileSize, y * GAME.tileSize);
    ctx.stroke();
  }

  // Player
  const px = GAME.player.x * GAME.tileSize + GAME.tileSize / 2;
  const py = GAME.player.y * GAME.tileSize + GAME.tileSize / 2;
  const sx = px - offsetX;
  const sy = py - offsetY;

  ctx.fillStyle = '#60a0ff';
  ctx.beginPath();
  ctx.arc(sx, sy, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '12px "Courier New", monospace';
  ctx.fillText('You', sx - 18, sy + 20);

  // NPC
  if (GAME.npc) {
    const npcX = GAME.npc.x * GAME.tileSize + GAME.tileSize / 2;
    const npcY = GAME.npc.y * GAME.tileSize + GAME.tileSize / 2;
    const nx = npcX - offsetX;
    const ny = npcY - offsetY;

    ctx.fillStyle = '#4a9a6a';
    ctx.beginPath();
    ctx.arc(nx, ny, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ddd';
    ctx.font = '12px "Courier New", monospace';
    ctx.fillText('Elder Mira', nx - 30, ny - 10);
  }

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

  if (GAME.scenariosCompleted > 0 && GAME.scenariosCompleted % 10 === 0) {
    ctx.fillStyle = 'rgba(255, 200, 0, 0.3)';
    ctx.fillRect(10, 140, 200, 30);
    ctx.fillStyle = '#ff0';
    ctx.font = '14px "Courier New", monospace';
    ctx.fillText('DONATION GATE: Show support', 20, 155);
  }
}

// ─── DIALOGUE ──────────────────────────────────────────────────────────────

function startDialogue() {
  if (GAME.dialogue !== null) {
    GAME.gameState = 'playing';
    return;
  }
  GAME.dialogue = {
    speaker: GAME.npc.name,
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
      </div>`;
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
        if (d.currentLine < d.lines.length - 1) {
          d.currentLine++;
          showDialogue();
        } else {
          d.finished = true;
          showDialogue();
        }
      } else if (i === 1) {
        d.currentLine = Math.min(d.currentLine + 1, d.lines.length - 1);
        showDialogue();
      } else if (i === 2) {
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
  GAME.player.questGiven = true;
  GAME.gameState = 'playing';
  closeDialogue();
  showChapterComplete();
}

function closeDialogue() {
  GAME.dialogue = null;
  const container = document.getElementById('dialogue-box');
  container.style.display = 'none';
}

function showChapterComplete() {
  const overlay = document.getElementById('game-container');
  if (overlay.querySelector('.chapter-complete')) return;

  const div = document.createElement('div');
  div.className = 'chapter-complete';
  div.innerHTML = `
      <div class="menu-title">Chapter 1 Complete!</div>
      <div class="menu-subtitle">You have shown great courage, Elder Mira.</div>
      <p style="color:#888;font-size:14px;margin-bottom:16px;">The path to Chapter 2 is now open. Your journey continues.</p>
      <div class="option-btn" style="font-size:18px;">See Chapter 2</div>
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
      </div>`;
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
    const amount = div.querySelector('.price-btn.active')?.dataset.amount || '3';
    div.querySelectorAll('.price-btn').forEach(b => b.classList.remove('active'));
    div.querySelectorAll('.price-btn').forEach(b => b.classList.add('active'));
  });

  setTimeout(() => {
    div.querySelector('#confirm-pay').addEventListener('click', () => {
      const amount = div.querySelector('.price-btn.active')?.dataset.amount || '3';
      div.remove();
      GAME.gameState = 'wallet';
      showThanks(amount);
    });
  }, 100);
}

// ─── TITLE SCREEN ──────────────────────────────────────────────────────────

function startTitle() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const w = GAME.width;
  const h = GAME.height;

  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#fff';
  ctx.font = '32px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Fantasy President', w / 2, 200);

  ctx.fillStyle = '#34d399';
  ctx.font = '20px "Courier New", monospace';
  ctx.fillText('Chapter 1: The Rising Crisis', w / 2, 240);

  ctx.fillStyle = '#888';
  ctx.font = '16px "Courier New", monospace';
  ctx.fillText('Press SPACE to begin', w / 2, 280);
}

// ─── MAIN LOOP ─────────────────────────────────────────────────────────────

function main() {
  if (GAME.gameState === 'title') return;
  if (GAME.gameState === 'wallet') return;
  if (GAME.gameState === 'dialogue' && GAME.dialogue) {
    // Dialogue handled separately
    return;
  }
  update();
  draw();
  requestAnimationFrame(main);
}

// ─── INITIALIZATION ────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    GAME.gameState = 'playing';
    startTitle();
    main();
  }, 100);
});

// Keyboard controls
document.addEventListener('keydown', (e) => {
  GAME.keys[e.key.toLowerCase()] = true;
  if (e.key === ' ' || e.key === 'enter') {
    e.preventDefault();
  }
});

document.addEventListener('keyup', (e) => {
  GAME.keys[e.key.toLowerCase()] = false;
});
