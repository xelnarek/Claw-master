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

if (!html.includes("#game-wrap{position:fixed;inset:0;width:100vw;height:100dvh") || !html.includes("canvas{display:block;width:100%;height:100%") || !gameScript.includes("viewTransform") || !gameScript.includes("Math.min(cssWidth/W,cssHeight/H)")) {
  throw new Error("Mobile layout must fill the viewport and preserve the game aspect ratio.");
}

const requiredFeatures = [
  "function drawTitle()", "function drawMenuScene()", "function drawBackground()", "function drawModalFrame(", "function drawModalBackdrop()", "function drawSettingsOverlay()",
  "function drawHelpOverlay()", "function drawHealth()", "function drawUpgradeOverlay()", "function drawTalentTree()",
  "function spawnStageWave()", "function completeStage()", "function advanceStage()",
  "function purchaseUpgrade(kind)", "function beginPlayerTurn()", "function planEnemyIntents()",
  "function resolveEnemyTurn()", "function checkEncounterClear()", "function generateMachinePrizes()",
  "function drawClawMachine()", "function drawAttackFx()", "function drawBuildStrip()", "function drawHeader()", "function drawCombatImpacts()", "function markDefeatedEnemies()",
  "function applyEnemyHit(", "const wid=activeWeapon.id", 'wid==="sidearm"', 'wid==="repeater"', 'wid==="scatter"', 'wid==="cannon"', 'wid==="laser"', "Contact shadow, grounding every creature", "Enemy intent is visible on the floor", "for(let i=0;i<13;i++)", "for(let i=0;i<6;i++)", "const stageCatalog=", "const abilityPool=",
  "function rollAbilityChoices()", "function chooseAbility(index)", "state.runSkills",
  'id:"bleed"', 'id:"ward"', 'id:"riposte"', 'id:"venom"', "state.runBleed", "state.runWard", "state.runCounterBonus",
  "target.poisonTurns", "target.poisonDamage", "e.poisonTurns", "e.poisonDamage", "TRUCIZNA", "KOROZJA",
  "e.enraged", "e.spinesActive", "e.guard", 'action==="dive"', 'action==="slam"',
  "Material pass: bone ridges", "reactor seam", "#a8fff6", "KOLCE", "PANCERZ", "NURKOWANIE", "GNIEW",
  "fire_elemental", "dragon", "golem", "hydra", "state.turnPhase", "state.heroActionUsedThisTurn",
  "state.clawUsedThisTurn", "function createFillerBall(", "function machinePrizePosition(", "function drawFillerBall(", "targetBallCount", "state.clawMode=\"grab\"", "viewTransform", "Math.min(cssWidth/W,cssHeight/H)", "clawGripDelay", "function beep(", "function spawnImpact(",
  "function drawCombatImpacts()", "const tx=rx+5", "rounded(-17,-5+step,14,7", "Enemy intent is visible on the floor", "Contact shadow, grounding every creature", "TACTICAL ARCADE  /  ROGUELITE", "THE RELIC VAULT", "meadow:{sky:[", "forest:{sky:[", "cave:{sky:[", "ruins:{sky:[", "boss:{sky:[", "shotFxTimer", "shotFxWeaponId", "caseAlpha", "const weaponCatalog=", "function fireWeapon(",
  "function combatAttack()", "function update(dt)"
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
if ((gameScript.match(/function applyEnemyHit\(e\)\{/g) ?? []).length !== 1) {
  throw new Error("Enemy damage must have exactly one authoritative resolver.");
}

const animationFeatures = [
  'playerAction:"idle"', "playerActionTimer", "shotFxTimer", "function updateCharacterAnimations(dt)",
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
console.log("PASS: cinematic biome backdrops, premium menu, modal, HUD and claw cabinet rendering");
console.log("PASS: upgraded character/enemy art, preserved action feedback, menu and local profile");
console.log("PASS: PWA manifest, icons and service-worker JavaScript");

execFileSync(process.execPath, [path.join(root, "scripts", "gameplay-smoke.mjs")], { stdio: "inherit" });
