# FANTASY_PRESIDENT — Architecture Specification

**Project:** Fantasy President
**Type:** Narrative-driven 2D adventure game with Web3 monetization
**Version:** 1.0
**Status:** Architecture Draft

---

## 1. Architecture Overview

### 1.1 System Diagram

```
┌─────────────────────────────────────────────┐
│  Browser (Player)                            │
│  ┌───────────────────────────────────────┐  │
│  │  Canvas Renderer (2D Game Engine)     │  │
│  │  ┌──────────────────────────────┐    │  │
│  │  │  State Machine (game.js)     │    │  │
│  │  │  - Flags: { elven_alliance,  │    │  │
│  │  │    dragon_slain, dark_cult_tier }│    │  │
│  │  │  - Stats: { treasury, military,│    │  │
│  │  │    approval, arcane_favor }   │    │  │
│  │  │  - Scenarios: array of cards  │    │  │
│  │  └──────────────────────────────┘    │  │
│  │  ┌──────────────────────────────┐    │  │
│  │  │  Wallet Modal (Web3 UI)       │    │  │
│  │  │  - $1–$3 USDC paywall         │    │  │
│  │  │  - Tier-2 / Supporter Badge   │    │  │
│  │  └──────────────────────────────┘    │  │
│  └───────────────────────────────────────┘  │
│                      │                       │
│                      ▼                       │
│  ┌───────────────────────────────────────┐  │
│  │  STORY_BIBLE.md (single source of truth) │  │
│  └───────────────────────────────────────┘  │
│                      │                       │
│                      ▼                       │
│  ┌───────────────────────────────────────┐  │
│  │  Monthly Auto-Updater (cron job)      │  │
│  │  - Audit continuity                   │  │
│  │  - Append scenarios & flags           │  │
│  │  - Update STORY_BIBLE.md              │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### 1.2 Tech Stack
- **Language:** Vanilla JavaScript (ES6+), HTML5 Canvas
- **Rendering:** 2D Canvas with custom renderer
- **State Management:** Global `GAME` object with flag/state system
- **Persistence:** Browser localStorage (per-session) + GitHub Pages (deploy)
- **Web3 Wallet:** USDC direct transfer via in-game modal
- **Hosting:** GitHub Pages (subfolder or new repo)

---

## 2. Story Bible (STORY_BIBLE.md)

Create `STORY_BIBLE.md` in the repository root with the following structure:

```markdown
# FANTASY_PRESIDENT — Story Bible

## World Lore
[High-level world setting, magic system, political landscape]

## Faction Histories
- [Faction Name]: [History, goals, alignment]
- [Faction Name]: [History, goals, alignment]

## Active Plot Threads
- [Thread Name]: [Current status, open questions]

## Character Arcs
- [Character Name]: [Initial state → Final state]
```

---

## 3. State Flag & Stat System (game.js)

### 3.1 Global Flags (tag/flag system)

```javascript
GAME.flags = {
  elven_alliance: false,          // Faction keyed
  dragon_slain: false,            // Major story beat
  dark_cult_tier: 0,              // 0=none, 1=awakened, 2=on_fire
  treasury: 0,                    // Gold/wealth accumulator
  military: 0,                    // Army strength
  approval: 0,                    // Pop approval %
  arcane_favor: 0,                // Magic/arcane power
  world_state: 'prelude',         // prelude | rising | shadow | crown
  choice_sensitivity: 0,          // Decision weight multiplier
  completed_arc: 0,               // 0=none, 1=arc1, 2=arc2, 3=arc3
  donations_received: 0,          // Total USDC collected from paywalls
  scenarios_completed: 0,         // Total scenarios played
  chapter2_unlocked: false,       // Soberizer for supper badge
  player_name: 'President',       // Set by narrative choice
  last_state_hash: null,          // For continuity audit
  dead_end_paths: [],             // Paths that lead to game over
  gate_states: {                   // Gate unlocks per scenario
    elven_gate: false,
    dragon_gate: false,
    cult_gate: false
  }
};
```

### 3.2 Numeric Stat Bounds

| Stat | Min | Max | Increment | Description |
|-----|-----|-----|-----------|-------------|
| treasury | 0 | ∞ | +10, +50 on events | Gold/wealth accumulator |
| military | 0 | 1000 | +5, +20 on events | Army readiness |
| approval | 0 | 100 | +5 to +25 | Pop approval % |
| arcane_favor | 0 | 300 | +10, +30 on events | Magic power level |

**Bounds Enforcement:**
- Stats must not exceed max (clamp on modification)
- Negative stats are invalid (prevent subtraction below 0)
- Stat thresholds trigger events (e.g., approval > 80 = popular mood, < 20 = crisis)

### 3.3 Scenario Pacing Check-ins

The donation-gated web3 modal triggers automatically:
- Every 10 to 20 scenarios completed (`GAME.scenarios_completed % 10 === 0` OR `scenario_id % 20 === 0`)
- OR when player reaches a major cliffhanger (flag set)
- Display modal: "Chapter 2 Access / Supporter Badge" with $1-$3 USDC options

**Gating Logic:**
```javascript
function checkDonationPaywall() {
  const shouldTrigger =
    GAME.scenarios_completed % 10 === 0 ||
    (GAME.scenarios_completed > 0 && GAME.scenarios_completed % 20 === 0) ||
    GAME.flags.completed_arc >= 2 ||
    GAME.flags.dragon_slain;

  if (shouldTrigger && !GAME.flags.chapter2_unlocked) {
    openWalletModal('$1 - $3 USDC for Chapter 2 Access');
  }
}
```

---

## 4. Subagent Pre-Production Phase

### Subagent A — Narrative & Worldbuilding

**Goal:** Draft 40 scenarios spanning 3 distinct narrative arcs.

**Deliverables:**
1. Full narrative arcs (20 scenarios per arc):
   - **Arc I: The Rising Crisis** (10 scenarios) — Building tension
   - **Arc II: The Shadow Alliance** (15 scenarios) — Turning point
   - **Arc III: The Crown's Legacy** (15 scenarios) — Resolution
2. Flag dependency mapping for each scenario
3. Storyline continuity document
4. State flag references for each branch

**Output Format:**
```markdown
## Arc I: The Rising Crisis — Scenarios 1–10
### Scenario 1: [Title]
- **Flags triggered:** [list]
- **Stats modified:** [stats and values]
- **End condition:** [success/failure/go to next]
- **Narrative text:** [Dialogue, descriptions, consequences]
- **Dependencies:** [Flags/choices required from previous scenarios]
```

### Subagent B — Systems & Game Balance

**Goal:** Map state-flag triggers alongside numeric stat bounds and define scenario pacing.

**Deliverables:**
1. State-flag trigger table (flag → scenario → effect)
2. Numeric stat bounds with increment rules
3. Scenario pacing check-in schedule (every 10-20 choices)
4. Donation-gated unlock logic
5. Game-over conditions (failed states)

**Output Format:**
```markdown
## State Flag Triggers

| Flag | Type | Threshold | Effect |
|------|------|-----------|--------|
| elven_alliance | boolean | true | Unlock elven faction dialogue |
| treasury > 100 | number | 100 | Unlock gold-mining scenario |
| approval < 20 | number | 20 | Trigger crisis event |

## Donation Gate
| Trigger | Cost | Reward |
|---------|------|--------|
| Every 10 scenarios | $1 USDC | Chapter 3 preview |
| Every 20 scenarios | $3 USDC | Supporter Badge + early content |

## Game-Over Conditions
- treasury < 0 (bankruptcy)
- approval < 0 (rebellion)
- arcane_favor < 0 (magic collapse)
- fatal flag combination (e.g., dragon_slain AND approval < 10)
```

### Subagent C — Continuity & Audit Spec

**Goal:** Design the prompt template for the monthly automated updater.

**Deliverables:**
1. Complete prompt template (fully self-contained)
2. Auto-updater workflow specification
3. Verification checklist

---

## 5. Automated Monthly Update Protocol

### 5.1 Protocol Flow

Before generating new cards or storyline expansions, the automated updater MUST:

**a. Read STORY_BIBLE.md**
- Parse: world lore, factions, factions, plot threads, character arcs
- Extract: existing scenario array from game.js

**b. Perform a Continuity Audit**
- Verify all new choices align with established lore
- Verify all new choices use existing state flags
- Verify new branches don't conflict with game-over conditions
- Cross-reference: flag consistency check
- Output: Continuity audit report (pass/fail, warnings)

**c. Append New Scenarios**
- Add new scenarios to the card deck (game.js)
- Add new corresponding narrative flags to `GAME.flags`
- Extend donation-gated expansion chapters if needed
- Maintain flag/choice consistency

**d. Update STORY_BIBLE.md**
- Append new lore beats to world lore
- Update character arcs
- Add new plot threads
- Mark old threads as resolved/paused

### 5.2 Auto-Updater Prompt Template (Subagent C Output)

```
You are the Automated Monthly Story Auditor for the Fantasy President game.

STEP 1: READ THE STORY BIBLE
- Read STORY_BIBLE.md in the repo root
- Extract: world_lore, factions, factions, plot_threads, character_arcs

STEP 2: PARSE THE CURRENT STATE
- Read game.js
- Extract: SCENARIOS array, flags structure, stats system

STEP 3: CONTINUITY AUDIT
- Review all new story ideas proposed
- Check each against: established lore, available flags, game-over conditions
- Verify flag consistency (no undefined flags used)
- Verify stat bounds (no out-of-range values)
- Output: Audit report (list of issues found)

STEP 4: APPEND SCENARIOS
- Add new scenarios to the card deck
- Follow format: { id, title, text, flags, stats, choices, outcome }
- Ensure flag consistency (only use defined flags)
- Ensure stat bounds respected

STEP 5: UPDATE STORY BIBLE
- Append new lore beats to world lore
- Update factions, plot_threads, character_arcs
- Mark resolved threads as "resolved: true"

STEP 6: COMMIT & PUSH
- Commit STORY_BIBLE.md, game.js, and any new files
- Push to origin/main
- Report: scenarios added, continuity findings, next planned arcs
```

### 5.3 Auto-Updater Runbook

```bash
# Monthly cron job executes at 00:00 on the 1st
1. clone <repo> (or fetch latest)
2. read STORY_BIBLE.md
3. parse game.js scenarios
4. run continuity audit
5. generate new scenarios
6. update STORY_BIBLE.md
7. commit and push
8. log to monthly-report.md
```

---

## 6. File Structure

```
fantasy-president/
├── index.html                 # Game entry
├── game.js                    # Game logic (state machine, flags, canvas)
├── style.css                  # UI styling
├── STORY_BIBLE.md             # World lore, factions, plot threads, arcs
├── scenarios.json             # Scenario deck (JSON format)
├── README.md                  # Project documentation
├── package.json               # Project metadata (optional)
├── .gitignore                 # Git ignore file
├── monthly-update.sh          # Auto-updater cron script (optional)
```

---

## 7. Deliverable Checklist

- [ ] STORY_BIBLE.md created with full world lore and faction histories
- [ ] game.js updated with flag/state system
- [ ] Subagent A: Narrative arc drafts (40 scenarios across 3 arcs)
- [ ] Subagent B: Systems & game balance mapping
- [ ] Subagent C: Continuity audit prompt template
- [ ] Auto-updater cron job configured
- [ ] STORY_BIBLE.md updated after each auto-run
- [ ] Web3 wallet integration ($1-$3 USDC paywall)
- [ ] 10–20 scenario donation gating working

---

## 8. Reference Implementation

### Game Flag Example
```javascript
GAME = {
  flags: {
    elven_alliance: false,
    dragon_slain: false,
    dark_cult_tier: 0,
    treasury: 0,
    military: 0,
    approval: 0,
    arcane_favor: 0,
    world_state: 'prelude',
    player_name: 'President',
    last_state_hash: null,
    dead_end_paths: [],
    gate_states: { elven_gate: false, dragon_gate: false, cult_gate: false }
  },
  stats: { treasury: 0, military: 0, approval: 0, arcane_favor: 0 },
  scenarios: [],
  dialog: [],
  npc: { x: 10, y: 8, name: 'President', dialogue: [] },
  player: { x: 0, y: 0, hp: 100, maxHp: 100, name: 'President' },
  gameState: 'title', // title | playing | dialogue | wallet | gameover
  keys: {},
  moveQueue: [],
  saveKey: 'fantasy_president_save',
  money: 0,
  chapter2Unlocked: false,
  scenariosCompleted: 0,
  totalDonations: 0
};
```

### Scenario Card Format
```javascript
{
  id: 'sc_015',
  title: 'The Council Conspiracy',
  text: 'The council meets in secret...',
  flags: { dark_cult_tier: 1 },
  stats: { treasury: 0, military: 50, approval: -5, arcane_favor: 5 },
  choices: {
    'A': 'X',
    'B': 'y',
    'C': 'z'
  },
  outcome: {
    text: 'After the meeting...',
    next: 'sc_016',
    stats: { treasury: -50, military: 30, approval: -10, arcane_favor: 5 }
  },
  dependencies: { flags: { elven_alliance: true }, stats: { treasury: 50 } }
}
```

---

## 9. Next Steps

1. Present this spec for review
2. Generate code from spec
3. Implement STORY_BIBLE.md and auto-updater
4. Run monthly auto-updater for testing
5. Verify live game and Web3 integration

---

*Architecture Document — FANTASY_PRESIDENT v1.0*
