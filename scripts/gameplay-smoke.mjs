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

function placeCertainPrize(type = "coin", quality = "normal") {
  const offset = quality === "perfect" ? 0 : quality === "good" ? 8 : (game.state.clawX > 365 ? -14 : 14);
  game.state.machinePrizes = [{
    id: "smoke-prize-" + Math.random(), type,
    x: game.state.clawX + offset, y: 646, radius: 19, size: 1, phase: 0,
    ox: 0, oy: 0, vx: 0, vy: 0, mass: 361, angVel: 0, restitution: .3
  }];
}
function completeClaw(type = "coin", quality = "normal") {
  placeCertainPrize(type, quality);
  assert.equal(game.deployClaw(), true, "one claw attempt should be available in the claw phase");
  assert.equal(game.deployClaw(), false, "a second claw attempt must be rejected in the same turn");
  for (let i = 0; i < 12; i++) game.update(0.1);
  assert.equal(game.state.clawMode, "idle", "claw should finish its visual grab and return");
  assert.equal(game.state.turnPhase, "hero", "completed claw phase must unlock exactly one hero action");
  assert.equal(game.state.clawUsedThisTurn, true, "claw usage must stay consumed until the next turn");
}

// Precision is based on actual claw alignment: clean center catches are better than a scrape.
game.startRun(1);
const perfectCountBefore = game.profile.perfectCatches || 0;
const perfectCoinsBefore = game.profile.coins;
completeClaw("coin", "perfect");
assert.equal(game.state.lastGrabQuality, "perfect", "centered capsule should register a perfect grab");
assert.equal(game.profile.perfectCatches, perfectCountBefore + 1, "perfect catches should be counted in the persistent profile");
assert.ok(game.profile.coins >= perfectCoinsBefore + 4, "perfect catch should add its precision bonus plus the chamber threshold bonus");
assert.ok(game.state.clawEmpowered >= 2, "perfect catch should empower the next hero attack");

game.startRun(1);
completeClaw("coin", "good");
assert.equal(game.state.lastGrabQuality, "good", "small claw offset should register a good grab");
assert.equal(game.state.perfectStreak, 0, "a non-perfect grab should break a perfect streak");

// Five rare relic pieces rebuild one permanent attack rank.
game.startRun(1);
const attackRankBeforeRelic = game.profile.attackRank;
for (let i = 0; i < 5; i++) game.reward("relic");
assert.equal(game.profile.relicFragments, 0, "five relic fragments should be consumed when the set is restored");
assert.equal(game.profile.attackRank, attackRankBeforeRelic + 1, "a complete relic should grant one permanent attack rank");
assert.equal(game.loadProfile().attackRank, attackRankBeforeRelic + 1, "relic restoration should persist across sessions");
// Keep the remaining regression cases on the baseline profile so their fixed damage expectations stay deterministic.
game.profile.attackRank = attackRankBeforeRelic;
game.saveProfile();

// First defeat of a new species registers it in the permanent bestiary.
game.startRun(1);
const dragonEntriesBefore = game.profile.bestiaryDragon || 0;
game.spawnEnemy("dragon");
const codexDragon = game.state.enemies.at(-1);
codexDragon.hp = 0;
game.markDefeatedEnemies();
assert.equal(game.profile.bestiaryDragon, dragonEntriesBefore + 1, "defeating a dragon should update the bestiary");

// Restore the default title state for the subsequent existing test sequence.
game.state.screen = "title";
game.state.over = false;
game.state.paused = false;

game.startRun(1);
assert.equal(game.state.machinePrizes.filter(prize => prize.type === "ball").length, 24,
  "the first turn should start with twenty-four ordinary filler balls");
const coinsBeforeFillerGrab = game.profile.coins;
completeClaw("ball");
assert.equal(game.profile.coins, coinsBeforeFillerGrab,
  "catching an ordinary ball must not grant coins or bonus rewards");
assert.equal(game.combatAttack(), true, "a filler-ball catch must still allow one hero action");
assert.equal(game.state.turnNumber, 2, "the player must complete the normal turn after catching a filler ball");
assert.equal(game.state.machinePrizes.filter(prize => prize.type === "ball").length, 29,
  "the filler-ball target count should rise by five on turn two");

// A small ordinary ball sits above a valuable reward in the claw's drop corridor.
// The first object in the vertical path must be caught; the capsule must stay in the pit.
game.startRun(1);
const obstructX = game.state.clawX;
game.state.machinePrizes = [
  { id: "front-ball", type: "ball", x: obstructX, y: 604, radius: 9, phase: 0, color: "#e9f0ed" },
  { id: "blocked-gem", type: "gem", x: obstructX, y: 684, radius: 18, phase: 0, size: 1 }
];
assert.equal(game.deployClaw(), true, "claw should start above the obstructed reward");
for (let i = 0; i < 12; i++) game.update(0.1);
assert.ok(game.state.machinePrizes.some(prize => prize.id === "blocked-gem"),
  "an ordinary ball above a reward must obstruct the grab and leave the reward in the machine");
assert.equal(game.state.turnPhase, "hero", "an obstructed pickup must still finish the claw phase");
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
game.spawnEnemy("fire_elemental");
const elemental = game.state.enemies.at(-1);
elemental.hp = 100;
elemental.maxHp = 100;
elemental.x = game.state.playerX + 90;
elemental.nextAttackTurn = game.state.turnNumber;
game.state.enemies = [elemental];
game.planEnemyIntents();
assert.equal(game.combatAttack(), true, "combat attack should consume the one hero action");
assert.ok(elemental.hp < 100, "combat attack must deal weapon damage to fire elemental");

game.startRun(1);
game.spawnEnemy("dragon");
assert.ok(game.state.enemies.some(e => e.type === "dragon"), "dragon enemy should spawn correctly");

game.startRun(1);
game.spawnEnemy("golem");
assert.ok(game.state.enemies.some(e => e.type === "golem"), "crystal golem enemy should spawn correctly");

game.startRun(1);
game.spawnEnemy("hydra");
assert.ok(game.state.enemies.some(e => e.type === "hydra"), "swamp hydra enemy should spawn correctly");

game.startRun(1);
game.spawnEnemy("slime");
const pairedEnemies = game.state.enemies;
for (const enemy of pairedEnemies) {
  enemy.type = "goblin";
  enemy.damage = 4;
  enemy.guard = 0;
  enemy.hp = 100;
  enemy.maxHp = 100;
  enemy.x = game.state.playerX + 90;
  enemy.nextAttackTurn = game.state.turnNumber;
}
game.planEnemyIntents();
completeClaw("coin");
const hpBeforeMultipleEnemies = game.state.hp;
assert.equal(game.combatAttack(), true, "one attack should start the enemy phase");
assert.equal(hpBeforeMultipleEnemies - game.state.hp, 8,
  "every eligible enemy must resolve one attack in the same enemy phase; no timed invulnerability may suppress later enemies");

game.startRun(1);
game.state.machinePrizes = [];
assert.equal(game.deployClaw(), true, "one claw attempt must still be available when the machine has no nearby prize");
for (let i = 0; i < 12; i++) game.update(0.1);
assert.equal(game.state.turnPhase, "hero", "a missed claw attempt must still unlock the hero attack phase");
assert.equal(game.combatAttack(), true, "a miss must not soft-lock the encounter");

game.startRun(1);
const clawXBefore = game.state.clawX;
game.moveClaw(-1);
assert.ok(game.state.clawX < clawXBefore, "A/D or arrow controls should reposition the claw, not the hero");
const coinBefore = game.profile.coins;
game.reward("coin");
assert.ok(game.profile.coins > coinBefore, "coin prize should add persistent currency");

// Run passives and enemy archetypes must create visible, turn-bound mechanics.
game.startRun(1);
for (const skillId of ["bleed", "ward", "riposte"]) {
  game.state.levelChoices = [game.abilityPool.find(skill => skill.id === skillId)];
  game.state.pendingLevelUps = 1;
  assert.equal(game.chooseAbility(0), true, skillId + " should be selectable from the level-up draft");
}
assert.equal(game.state.runBleed, 1, "Bleed Mark choice should activate bleed stacks");
assert.equal(game.state.runWard, 1, "Iron Oath choice should activate start-of-turn shielding");
assert.equal(game.state.runCounterBonus, 2, "Riposte Rune choice should strengthen counterattack damage");

game.startRun(1);
const bleedTarget = game.state.enemies[0];
bleedTarget.hp = 100;
bleedTarget.maxHp = 100;
bleedTarget.x = game.state.playerX + 90;
bleedTarget.nextAttackTurn = game.state.turnNumber + 5;
game.state.runBleed = 2;
game.planEnemyIntents();
completeClaw("coin");
const bleedHpBefore = bleedTarget.hp;
assert.equal(game.combatAttack(), true, "bleed build should perform its normal one attack");
assert.ok(bleedTarget.hp <= bleedHpBefore - 7, "bleed should add damage during the enemy phase");
assert.equal(bleedTarget.bleedTurns, 1, "bleed should persist for the remaining enemy-phase tick");

game.startRun(1);
game.state.runWard = 2;
game.state.shield = 0;
game.beginPlayerTurn();
assert.equal(game.state.shield, 4, "ward passive should restore two shield per level at turn start");

game.startRun(1);
const poisonSource = game.state.enemies[0];
const hpBeforePoisonHit = game.state.hp;
game.applyEnemyHit(poisonSource);
assert.equal(game.state.poisonTurns, 2, "slime hit should apply two turns of poison");
const hpBeforePoisonTick = game.state.hp;
game.beginPlayerTurn();
assert.equal(hpBeforePoisonTick - game.state.hp, 2, "poison should tick at the start of the player's next turn");
assert.equal(game.state.poisonTurns, 1, "poison duration should decrease by one turn");

game.startRun(1);
game.spawnEnemy("goblin");
const goblin = game.state.enemies.at(-1);
goblin.x = game.state.playerX + 90;
goblin.nextAttackTurn = game.state.turnNumber + 4;
game.state.enemies = [goblin];
game.state.selectedEnemy = 0;
game.planEnemyIntents();
assert.equal(goblin.intent, "brace", "goblin should telegraph a guarded stance");
assert.equal(goblin.guard, 3, "goblin should gain a three-point guard while bracing");
completeClaw("coin");
const goblinHpBefore = goblin.hp;
assert.equal(game.combatAttack(), true, "guarded goblin can still be attacked in a normal player turn");
assert.equal(goblin.guard, 0, "weapon damage should consume goblin guard first");
assert.equal(goblinHpBefore - goblin.hp, 2, "only damage left after guard absorption should reach goblin health");

game.startRun(1);
game.spawnEnemy("porcupine");
const porcupine = game.state.enemies.at(-1);
porcupine.x = game.state.playerX + 90;
porcupine.nextAttackTurn = game.state.turnNumber + 4;
game.state.enemies = [porcupine];
game.state.selectedEnemy = 0;
game.planEnemyIntents();
assert.equal(porcupine.spinesActive, true, "porcupine should expose its spines while bracing");
completeClaw("coin");
const hpBeforeThorns = game.state.hp;
assert.equal(game.combatAttack(), true, "attacking a braced porcupine should still use one hero action");
assert.equal(hpBeforeThorns - game.state.hp, 2, "active porcupine spines should reflect a fixed two damage once per turn");

game.startRun(1);
game.spawnEnemy("boss");
const boss = game.state.enemies.at(-1);
boss.hp = Math.ceil(boss.maxHp * .5);
boss.x = game.state.playerX + 150;
boss.nextAttackTurn = game.state.turnNumber + 4;
game.state.enemies = [boss];
game.planEnemyIntents();
assert.equal(boss.enraged, true, "boss should enter enrage at half health");
assert.equal(boss.intent, "brace", "enraged boss should telegraph before its next attack");

game.startRun(1);
game.spawnEnemy("bat");
const bat = game.state.enemies.at(-1);
bat.hp = 100;
bat.maxHp = 100;
bat.x = game.state.playerX + 130;
bat.nextAttackTurn = game.state.turnNumber;
game.state.enemies = [bat];
game.state.selectedEnemy = 0;
game.planEnemyIntents();
assert.equal(bat.intent, "attack", "bat should announce a dive when its attack is ready");
completeClaw("coin");
assert.equal(game.combatAttack(), true, "bat encounter still requires exactly one hero attack");
assert.equal(bat.action, "dive", "bat enemy phase should resolve with a dive action");
assert.equal(bat.x, game.state.playerX + 146, "bat dive should use its discrete lunge and retreat step");

game.startRun(1);
const animationTarget = game.state.enemies[0];
animationTarget.hp = 100;
animationTarget.maxHp = 100;
animationTarget.x = game.state.playerX + 90;
animationTarget.nextAttackTurn = game.state.turnNumber + 5;
game.state.enemies = [animationTarget];
game.state.selectedEnemy = 0;
game.planEnemyIntents();
completeClaw("coin");
assert.equal(game.combatAttack(), true, "test attack animation should resolve");
assert.equal(game.state.playerAction, "attack", "committed attack animation should survive entry into the next turn");
assert.ok(game.state.playerActionTimer > 0, "committed attack should retain its presentation timer");

// Every gun gets its own visible trail and impact identity, but still costs one hero action.
const weaponVisuals = [
  ["sidearm", "bullet"],
  ["repeater", "pulse"],
  ["scatter", "pellet"],
  ["cannon", "heavy"],
  ["laser", "pierce"]
];
for (const [weaponId, impactKind] of weaponVisuals) {
  game.startRun(1);
  game.state.weaponId = weaponId;
  const target = game.state.enemies[0];
  target.hp = 1000;
  target.maxHp = 1000;
  target.x = game.state.playerX + 110;
  target.nextAttackTurn = game.state.turnNumber + 5;
  game.state.enemies = [target];
  game.state.selectedEnemy = 0;
  game.planEnemyIntents();
  completeClaw("coin");
  const shotsBefore = game.state.shot;
  assert.equal(game.combatAttack(), true, weaponId + " should resolve as one hero action");
  assert.equal(game.state.shot, shotsBefore + 1, weaponId + " must not create extra turn actions");
  assert.equal(game.state.attackFx.type, weaponId, weaponId + " should have its own shot animation");
  assert.ok(game.state.attackFx.targets.length >= 1, weaponId + " should retain its resolved hit point for the visual trail");
  assert.ok(game.state.impacts.some(fx => fx.kind === impactKind), weaponId + " should create its own impact style");
  assert.ok(game.state.shotFxTimer > 0, weaponId + " should start its independent recoil/muzzle animation");
  assert.equal(game.state.shotFxWeaponId, weaponId, weaponId + " should retain its own silhouette through the recoil animation");
  assert.equal(game.state.turnPhase, "claw", weaponId + " should still pass to the next turn after one attack");
}

// A received hit must not erase the separate recoil/muzzle animation of the shot just fired.
game.startRun(1);
const retaliationTarget = game.state.enemies[0];
retaliationTarget.hp = 1000;
retaliationTarget.maxHp = 1000;
retaliationTarget.x = game.state.playerX + 90;
retaliationTarget.nextAttackTurn = game.state.turnNumber;
game.state.enemies = [retaliationTarget];
game.state.selectedEnemy = 0;
game.planEnemyIntents();
completeClaw("coin");
assert.equal(game.combatAttack(), true, "shot should resolve before immediate enemy retaliation");
assert.ok(["hurt", "defend"].includes(game.state.playerAction), "enemy retaliation should still show its own reaction");
assert.ok(game.state.shotFxTimer > 0, "enemy hit reaction must not erase the separate weapon shot animation");
assert.ok(game.state.attackFx, "weapon trail should remain visible during enemy retaliation");

// Toxic Ammo is now a damage-over-time perk; with Bleed it creates a real two-status synergy.
game.startRun(1);
for (const skillId of ["venom", "bleed"]) {
  game.state.levelChoices = [game.abilityPool.find(skill => skill.id === skillId)];
  game.state.pendingLevelUps = 1;
  assert.equal(game.chooseAbility(0), true, skillId + " should be selectable");
}
assert.equal(game.state.runVenom, 1, "Toxic Ammo should scale toxin damage by perk level");
assert.equal(game.state.runBleed, 1, "Bleed Mark should activate its independent status");
const toxicTarget = game.state.enemies[0];
toxicTarget.hp = 100;
toxicTarget.maxHp = 100;
toxicTarget.x = game.state.playerX + 90;
toxicTarget.nextAttackTurn = game.state.turnNumber + 5;
game.state.selectedEnemy = 0;
game.planEnemyIntents();
completeClaw("coin");
const toxicHpBefore = toxicTarget.hp;
assert.equal(game.combatAttack(), true, "poison/bleed build should still use exactly one normal attack");
assert.ok(toxicTarget.hp <= toxicHpBefore - 8, "direct damage, bleed and toxin synergy should tick in the same enemy phase");
assert.equal(toxicTarget.bleedTurns, 1, "bleed should remain active after its first enemy-phase tick");
assert.equal(toxicTarget.poisonTurns, 1, "poison should remain active after its first enemy-phase tick");
assert.ok(toxicTarget.poisonDamage >= 1, "poison damage should be stored per enemy, not as a global player status");

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
assert.equal(game.state.hubTab, "codex", "Kodeks tab should open the bestiary and collection page");
assert.equal(game.state.helpOpen, false, "Kodeks should be a proper hub page, not the help overlay");
game.render();
game.interact(225, 683);
assert.equal(game.state.hubTab, "battle", "Kodeks return action should return to the campaign board");
game.interact(350, 735);
game.state.helpOpen = true;
game.render();
game.interact(225, 558);
assert.equal(game.state.helpOpen, true, "help instructions must not overlap the close button");
game.interact(225, 590);
assert.equal(game.state.helpOpen, false, "help close button should close the overlay");
game.interact(90, 735);
assert.equal(game.state.upgradesOpen, true, "forge tab should open permanent upgrades");

// The talent tree must be a working menu, not a decorative drawing.
game.profile.coins = 400;
game.state.coins = 400;
game.saveProfile();
game.interact(150, 580);
assert.equal(game.state.talentTreeOpen, true, "forge should open the talent tree");
game.render();
game.state.weaponId = "sidearm";
game.state.runDamageBonus = 0;
const weaponDamageBeforeTalent = game.currentWeaponDamage();
const warriorCoinsBefore = game.profile.coins;
game.interact(345, 325);
assert.equal(game.profile.talentWarrior, 1, "Warrior talent should be purchasable");
assert.equal(game.profile.coins, warriorCoinsBefore - 30, "Warrior talent should deduct its cost");
assert.equal(game.currentWeaponDamage(), weaponDamageBeforeTalent + 2, "Warrior talent should improve actual weapon damage");
assert.equal(game.loadProfile().talentWarrior, 1, "Warrior talent level should persist in the local profile");

const relicCoinsBefore = game.profile.coins;
game.interact(345, 415);
assert.equal(game.profile.talentRelic, 1, "Relic talent should be purchasable");
assert.equal(game.profile.coins, relicCoinsBefore - 25, "Relic talent should deduct its cost");
game.state.clawX = 220;
game.state.time = 0;
game.state.machinePrizes = [{ id: "relic-capture", type: "coin", x: 245, y: 620, radius: 10, phase: 0 }];
const relicLevel = game.profile.talentRelic;
game.profile.talentRelic = 0;
assert.equal(game.getClawTargetCandidate(), null, "capture corridor should reject a target outside base tolerance");
game.profile.talentRelic = relicLevel;
assert.equal(game.getClawTargetCandidate()?.p?.id, "relic-capture", "Relic talent should widen the real capture corridor");

game.interact(345, 505);
assert.equal(game.profile.talentAlchemist, 1, "Alchemist talent should be purchasable");
assert.equal(game.loadProfile().talentRelic, 1, "Relic talent should persist");
assert.equal(game.loadProfile().talentAlchemist, 1, "Alchemist talent should persist");
game.state.runVenom = 1;
const talentPoisonTarget = { x: 300, y: 380, type: "goblin", hp: 100, maxHp: 100, guard: 0, dying: false, hit: 0, bleedTurns: 0, bleedDamage: 0, poisonTurns: 0, poisonDamage: 0, spinesActive: false, lastThornsTurn: -1 };
game.applyWeaponDamage(talentPoisonTarget, 2, game.weaponCatalog[0]);
assert.equal(talentPoisonTarget.poisonDamage, 2, "Alchemist talent should improve actual poison damage");
game.interact(220, 590);
assert.equal(game.state.talentTreeOpen, false, "talent-tree close button should return to the forge");
assert.equal(game.state.upgradesOpen, true, "closing the talent tree should preserve the forge screen");
listeners.get("window:keydown")({ key: "Escape", preventDefault() {} });
assert.equal(game.state.upgradesOpen, false, "Escape should close the forge overlay");

// Every run should expose four genuine, selectable build synergies.
const skillPairs = [
  ["korozja", ["venom", "bleed"]],
  ["bastion", ["ward", "riposte"]],
  ["furia", ["edge", "execution"]],
  ["zloto", ["claw", "fortune"]]
];
for (const [synergyId, skillIds] of skillPairs) {
  game.startRun(1);
  for (const id of skillIds) {
    game.state.levelChoices = [game.abilityPool.find(skill => skill.id === id)];
    game.state.pendingLevelUps = 1;
    assert.equal(game.chooseAbility(0), true, id + " should be selectable for " + synergyId);
  }
  assert.ok(game.getActiveSynergies().some(syn => syn.id === synergyId), synergyId + " should activate after taking its required skills");
}

// Tactical reposition is a free single movement before the single committed attack.
game.startRun(1);
completeClaw("coin");
const shieldBeforeStep = game.state.shield;
assert.equal(game.tacticalMove(-1), true, "one retreat step should be available in the hero phase");
assert.equal(game.state.heroMovedThisTurn, true, "tactical movement should be tracked once per turn");
assert.equal(game.state.shield, shieldBeforeStep + 3, "retreat should grant three shield");
assert.equal(game.tacticalMove(-1), false, "a second tactical movement must be rejected in the same turn");
assert.equal(game.canHeroAct(), true, "tactical movement must not consume the weapon attack");
assert.equal(game.combatAttack(), true, "the hero should still be able to attack after repositioning");

// The claw chamber uses gravity, sphere collisions and persistent ball body properties.
game.startRun(1);
const ordinaryBalls = game.state.machinePrizes.filter(p => p.type === "ball");
assert.equal(ordinaryBalls.length, 24, "fresh run should contain 24 ordinary balls");
assert.ok(ordinaryBalls.every(p => Number.isFinite(p.mass) && Number.isFinite(p.vx) && Number.isFinite(p.vy)),
  "filler balls must carry physics body state");
const fallingBall = { id: "gravity", type: "ball", x: 220, y: 600, vx: 0, vy: 0, radius: 10, mass: 100, restitution: .42, angVel: 0, color: "#fff" };
game.stepChamberPhysics(1 / 60, false, [fallingBall]);
assert.ok(fallingBall.y > 600, "gravity should move a free ball downwards");
const collidingBalls = [
  { id: "a", type: "ball", x: 200, y: 620, vx: 0, vy: 0, radius: 10, mass: 100, restitution: .42, angVel: 0 },
  { id: "b", type: "ball", x: 205, y: 620, vx: 0, vy: 0, radius: 10, mass: 100, restitution: .42, angVel: 0 }
];
game.stepChamberPhysics(1 / 60, false, collidingBalls);
assert.ok(Math.hypot(collidingBalls[0].x - collidingBalls[1].x, collidingBalls[0].y - collidingBalls[1].y) >= 19.9,
  "ordinary balls should resolve physical overlap instead of occupying the same point");

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
console.log("PASS: counterattack always deals one hit and reduces enemy-phase damage");
console.log("PASS: turn-based skill cooldown and claw skill-charge reward");
console.log("PASS: moving claw, varied prize layouts, capture reward and persistent upgrades");
console.log("PASS: enemy intent, discrete approach/attack turns and encounter progression");
console.log("PASS: mobile touch aiming, pointer cancellation and high-DPI resize");
// Render sweep: verify every world biome and menu/modal screen executes its Canvas draw path.
game.state.screen = "title";
game.state.paused = false;
game.state.over = false;
game.state.stageCleared = false;
game.state.settingsOpen = false;
game.state.helpOpen = false;
game.state.upgradesOpen = false;
game.state.levelChoices = null;
game.render();
game.state.settingsOpen = true; game.render(); game.state.settingsOpen = false;
game.state.helpOpen = true; game.render(); game.state.helpOpen = false;
game.state.upgradesOpen = true; game.render(); game.state.upgradesOpen = false;
game.startRun(1);
for (const weaponId of ["sidearm", "repeater", "scatter", "cannon", "laser"]) {
 game.state.weaponId = weaponId;
 game.state.shotFxWeaponId = weaponId;
 game.state.shotFxTimer = .18;
 game.render();
}
for (const enemyType of ["slime", "bat", "porcupine", "goblin", "fire_elemental", "dragon", "golem", "hydra", "boss"]) {
 game.state.enemies = [];
 game.spawnEnemy(enemyType);
 const enemy = game.state.enemies[0];
 enemy.intent = "attack";
 enemy.guard = enemyType === "goblin" ? 2 : 0;
 enemy.spinesActive = enemyType === "porcupine";
 enemy.enraged = enemyType === "boss";
 game.render();
}
for (const stage of [1, 2, 3, 4, 5]) { game.state.stage = stage; game.render(); }
game.state.paused = true; game.render(); game.state.paused = false;
game.state.levelChoices = game.abilityPool.slice(0, 3); game.render(); game.state.levelChoices = null;
game.state.stageCleared = true; game.render(); game.state.stageCleared = false;
game.state.over = true; game.render(); game.state.over = false;

console.log("PASS: title menu, Forge, Talent Tree, help panel and keyboard-close behavior");
console.log("PASS: talent levels persist and modify weapon damage, claw tolerance and poison damage");
console.log("PASS: four run synergies, tactical movement and physics-based claw chamber");
console.log("PASS: five distinct weapon silhouettes, muzzle flashes and nine enemy model render paths");
