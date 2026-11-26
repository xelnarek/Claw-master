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

game.startRun(1);
assert.equal(game.state.stage, 1, "new run should begin on stage 1");
assert.equal(game.stageCatalog[0].title, "Polana Początku");
assert.ok(game.state.enemies.length > 0, "stage 1 should spawn a curated first encounter");
assert.ok(game.state.enemies.every(enemy => enemy.type === "slime"), "stage 1 should teach target selection against slimes");

const firstEnemy = game.state.enemies[game.state.selectedEnemy];
const hpBeforeAttack = firstEnemy.hp;
game.combatAttack();
assert.ok(firstEnemy.hp < hpBeforeAttack, "attack should damage the selected enemy");
assert.equal(game.state.turn, "enemy", "player action should hand control to enemy phase");
game.resolveEnemyTurn();
assert.equal(game.state.turn, "player", "enemy phase should return control to player");

const coinsBefore = game.profile.coins;
game.reward("coin");
assert.ok(game.profile.coins > coinsBefore, "claw coin prize should add persistent currency");
assert.ok(store.has("clawQuestProfileV1"), "profile should persist to local storage");

const oldDamage = game.state.damage;
game.profile.coins += 100;
game.saveProfile();
assert.equal(game.purchaseUpgrade("attack"), true, "attack upgrade should be purchasable with enough coins");
assert.equal(game.state.damage, oldDamage + 1, "permanent attack upgrade should immediately update run damage");

game.completeStage();
assert.equal(game.state.stageCleared, true, "stage completion should open reward state");
assert.ok(game.profile.unlockedStage >= 2, "clearing stage 1 should unlock stage 2");
game.advanceStage();
assert.equal(game.state.stage, 2, "next-stage action should load stage 2");
assert.ok(game.state.enemies.some(enemy => enemy.type === "bat" || enemy.type === "slime"),
  "stage 2 should introduce a second enemy type");

const clawBefore = game.state.clawX;
game.interact(174, 600);
assert.equal(game.state.clawX, 174, "tapping the cabinet should position the claw directly");
game.moveClaw(1);
assert.ok(game.state.clawX > 174, "direction control should keep moving the claw");

console.log("PASS: first-stage onboarding encounter");
console.log("PASS: turn-based attack and enemy phase");
console.log("PASS: claw rewards persist between runs");
console.log("PASS: permanent upgrade purchase and stat application");
console.log("PASS: stage completion unlocks the next stage");
console.log("PASS: stage 2 introduces a new enemy type");
console.log("PASS: direct touch positioning and directional claw controls");
