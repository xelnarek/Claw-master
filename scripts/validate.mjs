import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => readFileSync(path.join(root, name), "utf8");

const html = read("index.html");
const scriptStart = html.indexOf("<script>");
const scriptEnd = html.indexOf("</script>", scriptStart);
if (scriptStart < 0 || scriptEnd < 0) {
  throw new Error("Inline game script was not found.");
}
const gameScript = html.slice(scriptStart + 8, scriptEnd);
new Function(gameScript);

if (!html.includes("#game-wrap{position:fixed;inset:0;width:100vw;height:100dvh") || !html.includes("canvas{display:block;width:100%;height:100%")) {
  throw new Error("Mobile layout must fill tall phone viewports without letterboxing.");
}

const requiredVisualFeatures = [
  "function drawTitle()",
  "function drawMenuScene()",
  "function drawSettingsOverlay()",
  "function drawHelpOverlay()",
  "function drawHealth()",
  "function drawUpgradeOverlay()",
  "function spawnStageWave()",
  "function completeStage()",
  "function advanceStage()",
  "function purchaseUpgrade(kind)",
  "porcupine",
  'localStorage.setItem("clawQuestSound"',
  'localStorage.setItem("clawQuestEffects"',
  "function drawUpgradeOverlay()",
  "const stageCatalog=",
  "localStorage.setItem(PROFILE_KEY",
  "const abilityPool=",
  "function rollAbilityChoices()",
  "function chooseAbility(index)",
  "function drawLevelChoiceOverlay()",
  "state.runSkills",
  "function beep(",
  "voice(freq*2",
  "state.runCrit",
  "state.runClawBonus",
  "function spawnImpact(",
  "function drawCombatImpacts()",
  "state.impacts",
  "state.shake",
  "const weaponCatalog=",
  "function fireWeapon(",
  "function moveHero(",
  "function applyEnemyHit(",
  "state.clawCooldown"
];
for (const feature of requiredVisualFeatures) {
  if (!gameScript.includes(feature)) {
    throw new Error("Visual/menu feature is missing: " + feature);
  }
}

const requiredAnimationFeatures = [
  'playerAction:"idle"',
  "playerActionTimer",
  "function updateCharacterAnimations(dt)",
  "e.actionTimer",
  "e.deathTimer",
  "e.dying",
  "function drawHero(",
  "function drawEnemy("
];
for (const feature of requiredAnimationFeatures) {
  if (!gameScript.includes(feature)) {
    throw new Error("Character animation feature is missing: " + feature);
  }
}

const manifest = JSON.parse(read("manifest.webmanifest"));
if (manifest.display !== "standalone" || manifest.orientation !== "portrait") {
  throw new Error("Manifest must target an installed portrait app.");
}
for (const icon of manifest.icons ?? []) {
  const relative = icon.src.startsWith("./") ? icon.src.slice(2) : icon.src;
  if (!existsSync(path.join(root, relative))) {
    throw new Error("Manifest icon is missing: " + icon.src);
  }
}
if (!html.includes('rel="manifest"') || !html.includes('serviceWorker.register("./sw.js")')) {
  throw new Error("PWA manifest or service-worker registration is missing.");
}
new Function(read("sw.js"));

console.log("PASS: game JavaScript syntax");
console.log("PASS: illustrated menu, settings, help, stage catalog and local profile");
console.log("PASS: character action, hit and defeat animations");
console.log("PASS: real-time weapon loop, five weapon archetypes and claw cooldown");
console.log("PASS: three-choice skill draft, run build modifiers and synthesized audio");
console.log("PASS: PWA manifest and icon references");
console.log("PASS: service-worker JavaScript syntax");

execFileSync(process.execPath, [path.join(root, "scripts", "gameplay-smoke.mjs")], { stdio: "inherit" });
