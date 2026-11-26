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
  width: 450,
  height: 800,
  getContext: () => context,
  getBoundingClientRect: () => bounds,
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
  devicePixelRatio: 2,
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
assert.equal(game.state.weaponId, "sidearm", "each run should begin with the service pistol");
assert.equal(game.weaponCatalog.length, 5, "five distinct weapon archetypes should be available");
assert.ok(game.state.enemies.length > 0, "stage 1 should spawn a curated first encounter");
const firstEnemy = game.state.enemies[0];
const hpBeforeAutoFire = firstEnemy.hp;
game.state.fireCooldown = 0;
for (let i = 0; i < 10; i++) game.update(0.1);
assert.ok(game.state.shot > 0, "hero should fire automatically while enemies are active");
assert.ok(firstEnemy.hp < hpBeforeAutoFire, "projectile collision should damage an enemy");
assert.ok(game.state.impacts.length > 0, "successful hits should create visible impact effects");

const xBeforeMove = game.state.playerX;
game.moveHero(1);
assert.ok(game.state.playerX > xBeforeMove, "directional control should move the hero");
game.moveHeroTo(500);
assert.equal(game.state.playerX, 188, "hero movement should stay inside the arena bounds");

assert.equal(game.combatAttack(), true, "burst action should fire when its cooldown is ready");
assert.equal(game.combatAttack(), false, "burst action should respect its cooldown");
assert.equal(game.combatDefend(), true, "guard action should activate during real-time combat");
assert.ok(game.state.guardTimer > 0, "guard should have a timed active window");
const guardTarget = game.state.enemies.find(enemy => !enemy.dying && enemy.hp > 0);
assert.ok(guardTarget, "a living enemy should remain for the guard test");
guardTarget.x = game.state.playerX + 58;
guardTarget.attackCooldown = 0.01;
game.state.playerInvuln = 0;
const hpBeforeGuard = game.state.hp;
game.update(0.02);
assert.equal(hpBeforeGuard - game.state.hp, 1, "guard should reduce a 4-damage slime attack to 1");

game.spawnEnemy("slime");
game.spawnEnemy("bat");
const aoeTargets = game.state.enemies.slice(-2);
const aoeHp = aoeTargets.map(enemy => enemy.hp);
game.state.skillReady = true;
assert.equal(game.combatSkill(), true, "super ability should activate when ready");
assert.ok(aoeTargets.every((enemy, index) => enemy.hp < aoeHp[index]), "super ability should damage all active enemies");
assert.ok(game.state.skillCooldown > 0, "super ability should enter cooldown");

const previousWeapon = game.state.weaponId;
const previousWeaponLevel = game.state.weaponLevel;
game.reward("weapon");
assert.ok(game.state.weaponId !== previousWeapon || game.state.weaponLevel > previousWeaponLevel,
  "claw weapon prize should either swap weapon or increase its level");

game.startRun(1);
game.state.clawX = 310;
game.state.machinePrizes = [{ id: "weapon-drop", type: "weapon", x: 310, y: 700, phase: 0 }];
assert.equal(game.deployClaw(), true, "claw should launch independently of combat turns");
for (let i = 0; i < 14; i++) game.update(0.1);
assert.equal(game.state.clawMode, "idle", "claw should complete its drop and retrieval animation");
assert.notEqual(game.state.weaponId, "sidearm", "capturing a weapon prize should equip a different weapon");
assert.ok(game.state.clawCooldown > 0, "successful retrieval should start the claw cooldown");
assert.equal(game.deployClaw(), false, "claw should reject another grab during cooldown");

const coinsBefore = game.profile.coins;
game.reward("coin");
assert.ok(game.profile.coins > coinsBefore, "claw coin prize should add persistent currency");
assert.ok(store.has("clawQuestProfileV1"), "profile should persist to local storage");
const oldDamageRank = game.profile.attackRank;
game.profile.coins += 100;
game.saveProfile();
assert.equal(game.purchaseUpgrade("attack"), true, "permanent attack upgrade should be purchasable");
assert.equal(game.profile.attackRank, oldDamageRank + 1, "permanent attack rank should persist");

game.startRun(1);
const clearWave = () => {
  for (const enemy of game.state.enemies) enemy.hp = 0;
  game.update(0.1);
  game.update(0.5);
};
clearWave();
assert.equal(game.state.stageWave, 2, "clearing stage 1 wave 1 should spawn its second wave");
assert.equal(game.state.enemies.length, 2, "stage 1 wave 2 should contain two tutorial slimes");
clearWave();
assert.equal(game.state.stageCleared, true, "clearing the final encounter should open stage completion");
assert.ok(game.profile.unlockedStage >= 2, "clearing stage 1 should unlock stage 2");
const coinsAfterCompletion = game.profile.coins;
assert.equal(game.completeStage(), false, "stage reward must only be granted once");
assert.equal(game.profile.coins, coinsAfterCompletion, "re-entering stage completion must not duplicate coins");
if (game.state.levelChoices) game.chooseAbility(0);
game.advanceStage();
assert.equal(game.state.stage, 2, "next-stage action should load stage 2");
assert.ok(game.state.enemies.every(enemy => enemy.type === "slime"), "stage 2 should open with a manageable wave");
clearWave();
assert.ok(game.state.enemies.some(enemy => enemy.type === "bat"), "stage 2 wave 2 should introduce the bat enemy");

game.state.screen = "title";
game.interact(350, 735);
assert.equal(game.state.helpOpen, true, "documentation button should open help");
game.interact(225, 558);
assert.equal(game.state.helpOpen, true, "help instructions must not overlap the close button");
game.interact(225, 590);
assert.equal(game.state.helpOpen, false, "help close button should still close the overlay");

game.interact(90, 735);
assert.equal(game.state.upgradesOpen, true, "arsenal button should open upgrades");
listeners.get("window:keydown")({ key: "Escape", preventDefault() {} });
assert.equal(game.state.upgradesOpen, false, "Escape should close the upgrades overlay");

assert.equal(canvas.width, 900, "canvas backing width should use capped device pixel ratio");
assert.equal(canvas.height, 1600, "canvas backing height should use capped device pixel ratio");
bounds.width = 400;
bounds.height = 900;
listeners.get("window:resize")();
assert.equal(canvas.width, 800, "resize should refresh backing width for portrait rotation");
assert.equal(canvas.height, 1800, "resize should refresh backing height for portrait rotation");
bounds.width = 450;
bounds.height = 800;
listeners.get("window:resize")();

game.startRun(1);
listeners.get("canvas:pointerdown")({ clientX: 120, clientY: 380, pointerId: 1 });
assert.equal(game.state.playerX, 120, "touching the left arena should position the hero");
listeners.get("canvas:pointermove")({ clientX: 180, clientY: 380, pointerId: 1 });
assert.equal(game.state.playerX, 180, "dragging in the arena should move the hero");
listeners.get("canvas:pointercancel")({ pointerId: 1 });
listeners.get("canvas:pointermove")({ clientX: 350, clientY: 380, pointerId: 1 });
assert.equal(game.state.playerX, 180, "cancelled touch must not keep moving the hero");

listeners.get("canvas:pointerdown")({ clientX: 120, clientY: 600, pointerId: 2 });
assert.equal(game.state.clawX, 120, "touch should position the claw in the lower chamber");
listeners.get("canvas:pointermove")({ clientX: 175, clientY: 600, pointerId: 2 });
assert.equal(game.state.clawX, 175, "dragging the claw chamber should position its carriage");
listeners.get("canvas:pointercancel")({ pointerId: 2 });
listeners.get("canvas:pointermove")({ clientX: 350, clientY: 600, pointerId: 2 });
assert.equal(game.state.clawX, 175, "cancelled touch must not keep dragging the claw");

console.log("PASS: automatic fire and projectile-to-enemy collision damage");
console.log("PASS: five weapon archetypes, weapon loot swaps and weapon progression");
console.log("PASS: real-time hero movement, burst action, timed guard and area super");
console.log("PASS: claw pickup animation, weapon reward and independent cooldown");
console.log("PASS: persistent coins and permanent character upgrades");
console.log("PASS: authored waves, stage completion and stage unlock");
console.log("PASS: mobile touch drag, pointer cancellation and high-DPI resize");
console.log("PASS: title menu, help panel and keyboard-close behavior");
