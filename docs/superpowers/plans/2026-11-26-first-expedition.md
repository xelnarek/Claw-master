# Claw Quest — first expedition implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax.

**Goal:** Turn the current endless-wave prototype into a readable first expedition with five curated stages, better touch controls, persistent upgrades and differentiated 2D presentation.

**Architecture:** Keep the existing single-file Canvas 2D game and add a small deterministic stage catalog, a local profile object and explicit UI states for camp/upgrades/stage-clear. Expose a test-only API only when the URL includes `?test=1`; exercise real state transitions with a Node VM smoke harness.

**Tech Stack:** HTML Canvas 2D, vanilla JavaScript, localStorage, Node.js 22 smoke test, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-26-first-expedition-design.md`

## Global Constraints
- Preserve portrait Android/PWA support and offline operation.
- Keep turn-based combat; do not reintroduce auto-fire.
- Keep the project dependency-free.
- Do not copy proprietary graphics or code from Claw Master.
- Persist progression locally; never reset permanent coins/upgrades when starting a run.

## Review Focus
- Corrupt or unavailable localStorage must fall back to a valid starter profile.
- A defeated stage must not award completion rewards repeatedly.
- A bomb/area attack that clears the last enemy must still reach stage-clear state.
- Touch targets must remain inside their intended regions at 450×800 logical resolution.
- A dying enemy must not be selectable or chosen as the next attacker.

---

### Task 1: Stage catalog and persistent profile

**Files:**
- Modify: `index.html`
- Test: `scripts/gameplay-smoke.mjs`

**Interfaces:**
- Produce `stageCatalog`, `loadProfile()`, `saveProfile()`, `gainCoins(amount)`, `gainXp(amount)`, `startRun(stage)`, `spawnStageWave()`, `completeStage()`, `advanceStage()`, `purchaseUpgrade(kind)`.
- Test API: `window.__CLAW_TEST_API__` only for `?test=1`.

- [ ] Add the stage catalog and profile persistence assertions to the smoke test.
- [ ] Run the smoke test and observe its expected failure before adding production behavior.
- [ ] Implement a validated profile with coins, XP, hero level, three upgrade ranks, unlocked stage, and best score/stage.
- [ ] Implement five curated opening stages and a scaled endless fallback after stage 5.
- [ ] Implement completion rewards, unlocks and XP level-ups.
- [ ] Run the complete validation workflow and gameplay smoke test.

### Task 2: Combat balance, enemy roster and turn feedback

**Files:**
- Modify: `index.html`
- Test: `scripts/gameplay-smoke.mjs`

**Interfaces:**
- Extend `spawnEnemy(typeOverride)` for deterministic stage composition.
- Keep `combatAttack()`, `combatDefend()`, `combatSkill()`, and `resolveEnemyTurn()` as turn entry points.

- [ ] Add checks for stage 1's slime-only tutorial encounter, stage 2's bat introduction, turn handoff, and enemy intent state.
- [ ] Run smoke tests and observe the expected failures.
- [ ] Add a distinct porcupine enemy, readable intent markers, softer stage 1–2 damage/HP, and cooldown state driven by `update(dt)`.
- [ ] Make shield a damage buffer rather than a timer; ensure dying enemies cannot attack.
- [ ] Run validation and review all first-five-stage enemy compositions.

### Task 3: Mobile controls and claw rewards

**Files:**
- Modify: `index.html`
- Test: `scripts/gameplay-smoke.mjs`

- [ ] Add tests for direct tap positioning, drag positioning, direction buttons and persistent claw rewards.
- [ ] Run smoke tests and observe the expected failures.
- [ ] Make cabinet taps set the claw X position directly; retain drag and direction buttons as fine control.
- [ ] Add precision upgrade effect and make reward categories distinct for coins, damage, healing, shield and area damage.
- [ ] Confirm button hitboxes do not overlap combat or cabinet regions.

### Task 4: Camp UI, permanent upgrades and stage-clear screen

**Files:**
- Modify: `index.html`
- Test: `scripts/gameplay-smoke.mjs`

- [ ] Add tests for permanent upgrade purchase, insufficient funds, stage rewards and one-time completion.
- [ ] Run smoke tests and observe the expected failures.
- [ ] Add a camp upgrade panel for attack, vitality and claw precision.
- [ ] Add stage-clear results and a next-stage action.
- [ ] Show persistent coins, hero level, XP progress, unlocked stage and best record in the camp.

### Task 5: Biome palette and first-level visual polish

**Files:**
- Modify: `index.html`, `sw.js`, `README.md`, `scripts/validate.mjs`

- [ ] Add assertions for stage title/biome rendering, new enemy renderer and cache version.
- [ ] Run smoke tests and observe the expected failures.
- [ ] Give stages 1–5 distinct, readable palettes and add visual feedback for objectives, enemy intent and stage transitions.
- [ ] Increase the clarity and touch size of combat actions without reducing the claw play area.
- [ ] Bump the service-worker cache version and update README controls/progression.
- [ ] Run the full validation suite, inspect CI output, and verify the latest Pages deployment commit.
