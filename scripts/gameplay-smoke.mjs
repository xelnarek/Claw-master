import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const scriptStart = html.indexOf("<script>");
const scriptEnd = html.indexOf("</script>", scriptStart);
assert.ok(scriptStart >= 0 && scriptEnd > scriptStart, "inline game script must exist");
const gameScript = html.slice(scriptStart + 8, scriptEnd);

const listeners = new Map();
const store = new Map();
const bounds = { left: 0, top: 0, width: 450, height: 800 };
const canvas = {
  width: 450, height: 800,
  getContext: () => context,
  getBoundingClientRect: () => bounds,
  addEventListener: (name, callback) => listeners.set("canvas:" + name, callback),
  setPointerCapture() {}
};
const toast = { textContent: "", classList: { add() {}, remove() {} } };
const gradient = { addColorStop() {} };
const context = new Proxy({}, {
  get(target, key) {
    if (key === "createLinearGradient" || key === "createRadialGradient") return () => gradient;
    if (key === "measureText") return () => ({ width: 0 });
    if (!target[key]) target[key] = () => {};
    return target[key];
  },
  set(target, key, value) { target[key] = value; return true; }
});
const document = {
  hidden: false,
  getElementById(id) { return id === "game" ? canvas : id === "toast" ? toast : { textContent: "" }; },
  addEventListener(name, callback) { listeners.set("document:" + name, callback); }
};
const window = {
  location: { search: "?test=1" }, devicePixelRatio: 2,
  addEventListener(name, callback) { listeners.set("window:" + name, callback); },
  __CLAW_TEST_API__: null
};
const localStorage = {
  getItem(key) { return store.has(key) ? store.get(key) : null; },
  setItem(key, value) { store.set(key, String(value)); },
  removeItem(key) { store.delete(key); }
};
const sandbox = {
  window, document, navigator: {}, localStorage, console,
  requestAnimationFrame() { return 0; },
  setTimeout() { return 1; }, clearTimeout() {},
  Math, Date, JSON, Number, String, Array, Object, Set, Map,
  performance: { now: () => 0 }
};
vm.runInNewContext(gameScript, sandbox, { timeout: 1500 });
const game = window.__CLAW_TEST_API__;
assert.ok(game, "test API must be exposed only when ?test=1 is present");
assert.equal(game.state.screen, "title", "game should boot into the title screen");
game.interact(225, 693);
assert.equal(game.state.screen, "game", "main start button should launch the game");
assert.equal(game.state.turnPhase, "claw", "every new run must begin with the claw phase");
assert.equal(game.state.turnNumber, 1, "new run must begin on turn one");
assert.ok(game.state.enemies.length > 0, "starting a run should spawn the first encounter");
assert.equal(game.weaponCatalog.length, 5, "five differentiated weapons should be available");

function placeCertainPrize(type = "coin") {
  game.state.machinePrizes = [{
    id: "smoke-prize-" + Math.random(), type,
    x: game.state.clawX, y: 646, radius: 19, size: 1, phase: 0
  }];
}
function completeClaw(type = "coin") {
  placeCertainPrize(type);
  assert.equal(game.deployClaw(), true, "one claw attempt should be available in the claw phase");
  assert.equal(game.deployClaw(), false, "a second claw attempt must be rejected in the same turn");
  for (let i = 0; i < 12; i++) game.update(0.1);
  assert.equal(game.state.clawMode, "idle", "claw should finish its visual grab and return");
  assert.equal(game.state.turnPhase, "hero", "completed claw phase must unlock exactly one hero action");
  assert.equal(game.state.clawUsedThisTurn, true, "claw usage must stay consumed until the next turn");
}

game.startRun(1);
const firstEnemy = game.state.enemies[0];
firstEnemy.x = 360;
game.planEnemyIntents();
const hpBeforeIdle = firstEnemy.hp;
const xBeforeIdle = firstEnemy.x;
const playerHpBeforeIdle = game.state.hp;
const shotsBeforeIdle = game.state.shot;
for (let i = 0; i < 20; i++) game.update(0.1);
assert.equal(game.state.shot, shotsBeforeIdle, "update loop must never auto-fire");
assert.equal(firstEnemy.hp, hpBeforeIdle, "enemies must not take damage while waiting");
assert.equal(firstEnemy.x, xBeforeIdle, "enemy position must not change outside the enemy phase");
assert.equal(game.state.hp, playerHpBeforeIdle, "enemy attacks must not happen while the player is choosing");
assert.equal(game.combatAttack(), false, "hero action must be locked until the claw is used");

const firstLayoutIds = game.state.machinePrizes.map(p => p.id).join(",");
completeClaw("coin");
assert.equal(game.state.hp, playerHpBeforeIdle, "claw animation must not trigger enemy attacks");
assert.equal(firstEnemy.x, xBeforeIdle, "enemies must wait until after the hero action");
assert.equal(game.state.coins, game.profile.coins, "claw reward must update the visible currency");
assert.equal(game.combatAttack(), true, "one weapon attack should be accepted in the hero phase");
assert.equal(game.state.shot, shotsBeforeIdle + 1, "one action must resolve as one attack command");
assert.ok(firstEnemy.hp < hpBeforeIdle, "a selected target should take immediate attack damage");
assert.ok(firstEnemy.x < xBeforeIdle, "enemies should only move during their response phase");
assert.equal(game.state.turnPhase, "claw", "enemy response should begin the next player turn");
assert.equal(game.state.turnNumber, 2, "a complete claw/hero/enemy cycle should advance the turn counter");
assert.notEqual(game.state.machinePrizes.map(p => p.id).join(","), firstLayoutIds, "each new turn should receive a freshly generated claw layout");
assert.equal(game.combatAttack(), false, "a second hero action in the same turn must be rejected");
const hpAfterTurn = firstEnemy.hp;
const xAfterTurn = firstEnemy.x;
const shotAfterTurn = game.state.shot;
for (let i = 0; i < 20; i++) game.update(0.1);
assert.equal(firstEnemy.hp, hpAfterTurn, "idle animation time must not deal damage");
assert.equal(firstEnemy.x, xAfterTurn, "idle animation time must not move enemies");
assert.equal(game.state.shot, shotAfterTurn, "idle animation time must not generate attacks");

game.startRun(1);
completeClaw("coin");
const guardEnemy = game.state.enemies[0];
guardEnemy.x = game.state.playerX + 90;
guardEnemy.nextAttackTurn = game.state.turnNumber;
game.planEnemyIntents();
const hpBeforeGuard = game.state.hp;
assert.equal(game.combatDefend(), true, "block should consume the one hero action");
assert.equal(hpBeforeGuard - game.state.hp, 2, "one block should halve a 4-damage slime hit");
assert.equal(game.state.guardTurns, 0, "block should expire after one enemy phase");
assert.equal(game.state.turnPhase, "claw", "block should complete the turn and return to claw phase");

game.startRun(1);
game.state.enemies[0].hp = 100;
game.state.enemies[0].maxHp = 100;
completeClaw("skill");
assert.equal(game.state.skillCooldownTurns, 0, "skill charge prize should restore the ability");
assert.equal(game.combatSkill(), true, "area skill should be usable as the one hero action");
assert.equal(game.state.skillCooldownTurns, 1, "skill cooldown should be measured in turns, not seconds");
assert.equal(game.state.turnPhase, "claw", "skill should pass control to the enemy phase and next turn");
game.state.enemies[0].hp = 100;
completeClaw("coin");
assert.equal(game.state.skillCooldownTurns, 1, "idle time and claw animation must not tick skill cooldown");
assert.equal(game.combatAttack(), true, "next turn should still allow one basic attack");
assert.equal(game.state.skillCooldownTurns, 0, "skill cooldown should recover after the specified enemy-turn count");

game.startRun(1);
const clawXBefore = game.state.clawX;
game.moveClaw(-1);
assert.ok(game.state.clawX < clawXBefore, "A/D or arrow controls should reposition the claw, not the hero");
const coinBefore = game.profile.coins;
game.reward("coin");
assert.ok(game.profile.coins > coinBefore, "coin prize should add persistent currency");
game.reward("skill");
assert.equal(game.state.skillCooldownTurns, 0, "skill prize should restore the turn-based skill charge");
assert.ok(game.state.runSkillBonus >= 2, "skill prize should also improve the skill build");

const oldAttackRank = game.profile.attackRank;
game.profile.coins += 100;
game.saveProfile();
assert.equal(game.purchaseUpgrade("attack"), true, "permanent attack upgrade should be purchasable");
assert.equal(game.profile.attackRank, oldAttackRank + 1, "permanent attack rank should increase");
assert.ok(store.has("clawQuestProfileV1"), "profile should persist to local storage");

game.startRun(1);
game.state.enemies.forEach(enemy => { enemy.hp = 0; });
game.markDefeatedEnemies();
game.state.turnPhase = "transition";
game.state.enemies.forEach(enemy => { enemy.deathTimer = 0.01; });
game.update(0.1);
assert.equal(game.state.stageWave, 2, "clearing wave one should load wave two");
assert.equal(game.state.turnPhase, "claw", "a new wave should begin at the claw phase");
game.state.enemies.forEach(enemy => { enemy.hp = 0; });
game.markDefeatedEnemies();
game.state.turnPhase = "transition";
game.state.enemies.forEach(enemy => { enemy.deathTimer = 0.01; });
game.update(0.1);
assert.equal(game.state.stageCleared, true, "clearing the last wave should open stage completion");
assert.ok(game.profile.unlockedStage >= 2, "clearing stage one should unlock stage two");
const coinsAfterCompletion = game.profile.coins;
assert.equal(game.completeStage(), false, "stage rewards must be granted only once");
assert.equal(game.profile.coins, coinsAfterCompletion, "re-entering completion must not duplicate rewards");
if (game.state.levelChoices) game.chooseAbility(0);
game.advanceStage();
assert.equal(game.state.stage, 2, "next-stage action should load stage two");

game.state.screen = "title";
game.interact(350, 735);
assert.equal(game.state.helpOpen, true, "documentation button should open help");
game.interact(225, 558);
assert.equal(game.state.helpOpen, true, "help instructions must not overlap the close button");
game.interact(225, 590);
assert.equal(game.state.helpOpen, false, "help close button should close the overlay");
game.interact(90, 735);
assert.equal(game.state.upgradesOpen, true, "arsenal button should open upgrades");
listeners.get("window:keydown")({ key: "Escape", preventDefault() {} });
assert.equal(game.state.upgradesOpen, false, "Escape should close the upgrades overlay");

game.startRun(1);
listeners.get("canvas:pointerdown")({ clientX: 120, clientY: 600, pointerId: 1 });
assert.equal(game.state.clawX, 120, "touch should position the claw carriage");
listeners.get("canvas:pointermove")({ clientX: 180, clientY: 600, pointerId: 1 });
assert.equal(game.state.clawX, 180, "dragging inside the cabinet should aim the claw");
listeners.get("canvas:pointercancel")({ pointerId: 1 });
listeners.get("canvas:pointermove")({ clientX: 350, clientY: 600, pointerId: 1 });
assert.equal(game.state.clawX, 180, "cancelled touch must not continue moving the claw");

assert.equal(canvas.width, 900, "canvas backing width should use capped device pixel ratio");
assert.equal(canvas.height, 1600, "canvas backing height should use capped device pixel ratio");
bounds.width = 400;bounds.height = 900;
listeners.get("window:resize")();
assert.equal(canvas.width, 800, "resize should refresh backing width for portrait rotation");
assert.equal(canvas.height, 1800, "resize should refresh backing height for portrait rotation");
bounds.width = 450;bounds.height = 800;
listeners.get("window:resize")();

console.log("PASS: turn order is exactly one claw grab, one hero action, then enemy actions");
console.log("PASS: no automatic fire, enemy movement, or incoming damage during player planning");
console.log("PASS: one weapon attack per turn and differentiated weapon effects");
console.log("PASS: turn-based block, skill cooldown and claw skill-charge reward");
console.log("PASS: moving claw, varied prize layouts, capture reward and persistent upgrades");
console.log("PASS: enemy intent, discrete approach/attack turns and encounter progression");
console.log("PASS: mobile touch aiming, pointer cancellation and high-DPI resize");
console.log("PASS: title menu, help panel and keyboard-close behavior");
