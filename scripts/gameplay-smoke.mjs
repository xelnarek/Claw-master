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
const canvas = {
  width: 450,
  height: 800,
  getContext: () => context,
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 450, height: 800 }),
  addEventListener: (name, callback) => listeners.set("canvas:" + name, callback),
  setPointerCapture: () => {}
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
  location: { search: "?test=1" },
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
  setTimeout() { return 1; },
  clearTimeout() {},
  Math, Date, JSON, Number, String, Array, Object, Set, Map,
  performance: { now: () => 0 }
};
vm.runInNewContext(gameScript, sandbox, { timeout: 1500 });
const game = window.__CLAW_TEST_API__;
assert.ok(game, "test API must be exposed only when ?test=1 is present");
assert.equal(game.state.screen, "title", "game should boot into a playable title screen");
game.interact(225, 693);
assert.equal(game.state.screen, "game", "touching the main start button should enter the game");
assert.ok(game.state.enemies.length > 0, "starting from the title screen should spawn enemies");

game.startRun(1);
assert.equal(game.state.stage, 1, "new run should begin on stage 1");
assert.equal(game.stageCatalog[0].title, "Polana Początku");
assert.ok(game.state.enemies.length > 0, "stage 1 should spawn a curated first encounter");
assert.ok(game.state.enemies.every(enemy => enemy.type === "slime"), "stage 1 should teach target selection against slimes");

const firstEnemy = game.state.enemies[game.state.selectedEnemy];
const hpBeforeAttack = firstEnemy.hp;
game.combatAttack();
assert.equal(firstEnemy.hp, hpBeforeAttack, "combat is locked until the claw phase is completed");
game.state.machinePrizes = [{ id: "test-coin", type: "coin", x: 310, y: 700, phase: 0 }];
game.deployClaw();
assert.equal(game.state.turn, "claw");
assert.equal(game.state.clawUsedThisTurn, true);
game.deployClaw();
assert.equal(game.state.turn, "claw", "a second claw deployment must be rejected");
game.update(1);
game.update(1);
assert.equal(game.state.turn, "player-action");
game.combatAttack();
assert.ok(firstEnemy.hp < hpBeforeAttack);
assert.equal(game.state.turn, "enemy");
game.resolveEnemyTurn();
assert.equal(game.state.turn, "player");
assert.equal(game.state.clawUsedThisTurn, false);
game.state.machinePrizes = [{ id: "test-xp", type: "xp", x: 310, y: 700, phase: 0 }];
game.deployClaw();
game.update(1);
game.update(1);
assert.equal(game.state.turn, "player-action");
const hpBeforeGuard = game.state.hp;
game.combatDefend();
game.resolveEnemyTurn();
assert.equal(hpBeforeGuard - game.state.hp, 1, "65% guard should reduce a 4-damage slime hit to 1");
assert.equal(game.state.clawUsedThisTurn, false);

const levelBeforeDraft = game.profile.level;
game.gainXp(levelBeforeDraft * 30);
assert.equal(game.profile.level, levelBeforeDraft + 1, "XP threshold should grant a hero level");
assert.equal(game.state.levelChoices.length, 3, "each level should offer three skill choices");
assert.equal(new Set(game.state.levelChoices.map(skill => skill.id)).size, 3, "skill choices should not contain duplicates");
const chosenSkill = game.state.levelChoices[0];
assert.equal(game.chooseAbility(0), true, "choosing one skill should be accepted");
assert.equal(game.state.runSkills[chosenSkill.id], 1, "chosen skill should be added to the current run build");
assert.equal(game.state.levelChoices, null, "skill draft should close after one selection");


assert.equal(game.purchaseUpgrade("attack"), false, "upgrade should reject insufficient funds");
const coinsBefore = game.profile.coins;
game.reward("coin");
assert.ok(game.profile.coins > coinsBefore, "claw coin prize should add persistent currency");
assert.ok(store.has("clawQuestProfileV1"), "profile should persist to local storage");

const oldDamage = game.state.damage;
game.profile.coins += 100;
game.saveProfile();
assert.equal(game.purchaseUpgrade("attack"), true, "attack upgrade should be purchasable with enough coins");
assert.equal(game.state.damage, oldDamage + 1, "permanent attack upgrade should immediately update run damage");

const clearWave = () => {
  for (const enemy of game.state.enemies) {
    if (!enemy.dying) enemy.hp = 0;
  }
  game.update(0.5);
  game.update(0.5);
};
clearWave();
assert.equal(game.state.stageWave, 2, "clearing stage 1 wave 1 should spawn its second wave");
assert.equal(game.state.enemies.length, 2, "stage 1 wave 2 should have two tutorial slimes");
clearWave();
assert.equal(game.state.stageCleared, true, "clearing the final encounter should open stage completion");
assert.ok(game.profile.unlockedStage >= 2, "clearing stage 1 should unlock stage 2");
const coinsAfterCompletion = game.profile.coins;
assert.equal(game.completeStage(), false, "stage reward must only be granted once");
assert.equal(game.profile.coins, coinsAfterCompletion, "re-entering stage completion must not duplicate coins");
game.advanceStage();
assert.equal(game.state.stage, 2, "next-stage action should load stage 2");
assert.ok(game.state.enemies.every(enemy => enemy.type === "slime"),
  "stage 2 opening wave should be an easy warm-up before bats appear");
clearWave();
assert.ok(game.state.enemies.some(enemy => enemy.type === "bat"),
  "stage 2 wave 2 should introduce the bat enemy");

const clawBefore = game.state.clawX;
game.interact(174, 600);
assert.equal(game.state.clawX, 174, "tapping the cabinet should position the claw directly");
game.moveClaw(1);
assert.ok(game.state.clawX > 174, "direction control should keep moving the claw");
const savedCoins = game.profile.coins;
game.startRun(1);
assert.equal(game.state.coins, savedCoins, "starting a new run must keep saved coins");
assert.equal(game.state.damage, 4 + game.profile.attackRank, "permanent attack rank must survive a new run");

console.log("PASS: first-stage onboarding encounter");
console.log("PASS: one claw grab per turn, combat phase lock and 65% defend reduction");
console.log("PASS: three-choice level-up draft and run skill application");
console.log("PASS: claw rewards persist between runs");
console.log("PASS: permanent upgrade purchase and stat application");
console.log("PASS: stage waves progress to one-time stage-clear rewards");
console.log("PASS: stage 2 introduces bats in its second encounter");
console.log("PASS: direct touch positioning and directional claw controls");
console.log("PASS: saved currency and permanent stats survive a new run");
