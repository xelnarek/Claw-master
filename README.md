# Claw Quest — turn-based claw roguelite

A mobile-first 2D roguelite built with Canvas 2D and vanilla JavaScript. The defining mechanic is a deliberate, turn-based loop:

1. **Claw phase:** position the carriage and make exactly one grab attempt.
2. **Hero phase:** perform exactly one attack action — a weapon strike, a counterattack with guard, or the special area attack.
3. **Enemy phase:** living enemies each resolve one discrete action: advance, attack, or recover.
4. The next turn begins with a newly generated claw-machine layout.

There is no real-time combat, automatic fire, passive enemy movement, or cooldown measured in seconds. Animation time only presents an already-resolved action; it never advances combat decisions.

## Gameplay systems

- **Claw machine:** each turn generates a varied arrangement of prize capsules. Coins, XP, weapons, damage shards, healing, shields, bombs and skill charges have different values and visual treatments. A grab can miss if the player aims poorly; claw precision upgrades and run skills improve the capture window.
- **One hero action:** choose a single weapon attack, a counterattack that also halves incoming damage for that enemy phase, or an area skill. Every option attacks; the counterattack also guards. The action immediately closes the hero phase.
- **Weapons:** five archetypes with different turn-based effects — sidearm, repeater, scatter gun, siege cannon and photon lance. Each has its own shot trail, muzzle flash, recoil/casing animation and distinct impact language. The repeater burst, scatter pellets and cannon blast are visual components of one committed hero action, not extra turns.
- **Enemy intent and archetypes:** goblins raise a breakable guard, porcupines brace their spines and reflect one hit per player turn, bats dive and reposition, slimes poison, and bosses enrage below half health. Their telegraphs, armor and status marks are visible before the enemy phase.
- **Skills and builds:** three-choice level-up drafts create run-specific synergies. Bleed ticks during the enemy phase; Toxic Ammo applies a two-phase poison that also ticks during the enemy phase. Combining poison with bleed adds one toxin damage to the tick. Iron Oath restores shield at the start of each player turn, while Riposte Rune adds counterattack damage. Active perks and shield are visible in the HUD. Special-skill recovery is counted in full turns, not seconds. Claw upgrades, critical hits, healing on defeat, shields and loot bonuses remain part of the build system.
- **Campaign:** authored opening stages and waves lead into a scalable expedition, with boss encounters, local profile persistence and permanent camp upgrades.
- **Visual presentation:** original procedural 2D art in a restrained dark-fantasy / brass palette. Five biome-specific environments use layered ridgelines, atmospheric light, architectural silhouettes, engraved perspective flooring and drifting motes. The Relic Vault title screen has a cinematic citadel gate, framed campaign board and premium stat cards. Shared metallic buttons, modal frames, a rebuilt gameplay HUD and a glass-fronted claw cabinet keep the UI coherent. Weapon-specific shot trails, impact effects, synthesized audio and high-DPI mobile Canvas scaling remain in place.

## Controls

- Tap or drag inside the lower machine chamber to aim the claw.
- Tap **ZŁAP ŁUP** or press **Space/F** for the turn's single claw attempt.
- After the claw returns, choose **ATAK**, **KONTRATAK** (weapon strike plus guard), or **UMIEJĘTNOŚĆ** (buttons or **J/K/L**).
- Tap an enemy in the arena to select a target.
- **A/D** or **←/→** nudge the claw carriage while the claw phase is open.
- **Escape** pauses the expedition.

## Progression

The opening campaign includes Polana Początku, Zarośnięta Ścieżka, Nora Zmierzchu, Ruiny Strażników and Leśny Strażnik. Clearing waves unlocks the next stage. Coins, hero level/XP, unlocked stage, best stage, score and permanent attack/vitality/claw ranks are saved locally in localStorage.

## Technical direction

The game uses Canvas 2D, procedural character drawings, biome palettes, combat impact effects and synthesized Web Audio. It does not use another game's sprites, source code, branding or audio. The visual combat animation is cosmetic; damage and enemy actions are resolved deterministically at the selected turn boundary.

## Run locally

Open index.html in a modern browser or serve the repository with a static web server.

For GitHub Pages, select **GitHub Actions** as the deployment source in the repository's Pages settings.

## Automated checks

Run node scripts/validate.mjs with Node.js 22. The checks validate JavaScript syntax, the PWA manifest, service worker, responsive layout, the turn-based state machine, action limits, claw rewards, enemy intent, each weapon shot/impact profile, toxin/bleed perk synergy and mobile touch handling.
