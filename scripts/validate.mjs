import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => readFileSync(path.join(root, name), "utf8");
const html = read("index.html");
const scriptStart = html.indexOf("<script>");
const scriptEnd = html.indexOf("</script>", scriptStart);
if (scriptStart < 0 || scriptEnd < 0) throw new Error("Inline game script was not found.");
const gameScript = html.slice(scriptStart + 8, scriptEnd);
new Function(gameScript);

if (!html.includes("#game-wrap{position:fixed;inset:0;width:100vw;height:100dvh") || !html.includes("canvas{display:block;width:100%;height:100%")) {
  throw new Error("Mobile layout must fill tall phone viewports without letterboxing.");
}

const requiredFeatures = [
  "function drawTitle()", "function drawMenuScene()", "function drawSettingsOverlay()",
  "function drawHelpOverlay()", "function drawHealth()", "function drawUpgradeOverlay()",
  "function spawnStageWave()", "function completeStage()", "function advanceStage()",
  "function purchaseUpgrade(kind)", "function beginPlayerTurn()", "function planEnemyIntents()",
  "function resolveEnemyTurn()", "function checkEncounterClear()", "function generateMachinePrizes()",
  "function drawClawMachine()", "function drawAttackFx()", "function markDefeatedEnemies()",
  "function applyEnemyHit(", "const stageCatalog=", "const abilityPool=",
  "function rollAbilityChoices()", "function chooseAbility(index)", "state.runSkills",
  'id:"bleed"', 'id:"ward"', 'id:"riposte"', "state.runBleed", "state.runWard", "state.runCounterBonus",
  "e.enraged", "e.spinesActive", "e.guard", 'action==="dive"', 'action==="slam"',
  "Material pass: bone ridges", "reactor seam", "#a8fff6", "KOLCE", "PANCERZ", "NURKOWANIE", "GNIEW",
  "state.skillCooldownTurns", "state.turnPhase", "state.heroActionUsedThisTurn",
  "state.clawUsedThisTurn", "function beep(", "function spawnImpact(",
  "function drawCombatImpacts()", "const weaponCatalog=", "function fireWeapon(",
  "function combatAttack()", "function combatDefend()", "function combatSkill()", "function update(dt)"
];
for (const feature of requiredFeatures) if (!gameScript.includes(feature)) throw new Error("Required feature missing: " + feature);

const forbiddenRealtime = [
  "if(state.fireCooldown<=0&&findCombatTarget())fireWeapon()",
  "state.clawCooldown<=0)state.clawUsedThisTurn=false",
  "e.x=Math.max(targetX,e.x-e.speed*dt)",
  "state.skillCooldown=Math.max(0,state.skillCooldown-dt)",
  "dynamiczna walka w czasie rzeczywistym", "automatyczny ostrzał"
];
for (const fragment of forbiddenRealtime) if (gameScript.includes(fragment) || html.includes(fragment)) throw new Error("Realtime gameplay logic or copy remains: " + fragment);

const obsoleteTimerFields = [
  "state.fireCooldown", "state.burstCooldown", "state.clawCooldown",
  "state.guardTimer", "state.playerInvuln", "state.skillCooldown=",
  "state.turnTimer", "state.clawTimer"
];
for (const field of obsoleteTimerFields) {
  if (gameScript.includes(field)) throw new Error("Obsolete real-time timer remains: " + field);
}

const beginTurnStart = gameScript.indexOf("function beginPlayerTurn(){");
const beginTurnEnd = gameScript.indexOf("function spawnStageWave(){", beginTurnStart);
if (beginTurnStart < 0 || beginTurnEnd < 0) throw new Error("Turn start function boundaries are missing.");
const beginTurnBody = gameScript.slice(beginTurnStart, beginTurnEnd);
if (beginTurnBody.includes('state.playerAction="idle"') || beginTurnBody.includes("state.attackFx=null")) {
  throw new Error("Beginning the next turn must not erase the previous action's visual feedback.");
}
if ((gameScript.match(/function applyEnemyHit\\(e\\)\\{/g) ?? []).length !== 1) {
  throw new Error("Enemy damage must have exactly one authoritative resolver.");
}

const animationFeatures = [
  'playerAction:"idle"', "playerActionTimer", "function updateCharacterAnimations(dt)",
  "e.actionTimer", "e.deathTimer", "e.dying", "function drawHero(", "function drawEnemy("
];
for (const feature of animationFeatures) if (!gameScript.includes(feature)) throw new Error("Character animation feature is missing: " + feature);

const manifest = JSON.parse(read("manifest.webmanifest"));
if (manifest.display !== "standalone" || manifest.orientation !== "portrait") throw new Error("Manifest must target an installed portrait app.");
for (const icon of manifest.icons ?? []) {
  const relative = icon.src.startsWith("./") ? icon.src.slice(2) : icon.src;
  if (!existsSync(path.join(root, relative))) throw new Error("Manifest icon is missing: " + icon.src);
}
if (!html.includes('rel="manifest"') || !html.includes('serviceWorker.register("./sw.js")')) throw new Error("PWA manifest or service-worker registration is missing.");
new Function(read("sw.js"));

console.log("PASS: JavaScript syntax and responsive mobile layout");
console.log("PASS: turn state machine — claw, one hero action, enemy phase");
console.log("PASS: turn-based weapon profiles, status passives, blocks and enemy archetypes");
console.log("PASS: dynamic claw prize pool and visual combat effects");
console.log("PASS: upgraded character/enemy art, preserved action feedback, menu and local profile");
console.log("PASS: PWA manifest, icons and service-worker JavaScript");

execFileSync(process.execPath, [path.join(root, "scripts", "gameplay-smoke.mjs")], { stdio: "inherit" });
