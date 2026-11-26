# Claw Quest — turn-based claw roguelite

A mobile-first 2D roguelite built with Canvas 2D and vanilla JavaScript. The defining mechanic is a deliberate, turn-based loop:

1. **Claw phase:** position the carriage and make exactly one grab attempt.
2. **Hero phase:** perform exactly one action — attack, block, or use the special skill.
3. **Enemy phase:** living enemies each resolve one discrete action: advance, attack, or recover.
4. The next turn begins with a newly generated claw-machine layout.

There is no real-time combat, automatic fire, passive enemy movement, or cooldown measured in seconds. Animation time only presents an already-resolved action; it never advances combat decisions.

## Gameplay systems

- **Claw machine:** each turn generates a varied arrangement of prize capsules. Coins, XP, weapons, damage shards, healing, shields, bombs and skill charges have different values and visual treatments. A grab can miss if the player aims poorly; claw precision upgrades and run skills improve the capture window.
- **One hero action:** choose a single weapon attack, block for the upcoming enemy phase, or an area skill. The action immediately closes the hero phase.
- **Weapons:** five archetypes with different turn-based effects — sidearm, repeater, scatter gun, siege cannon and photon lance. Their attack patterns, damage and visual effects differ without firing continuously.
- **Enemy intent:** enemies show whether they are approaching, preparing an attack, or recovering. Their movement and attacks resolve only during the enemy phase. Enemy attack cadence is measured in turns.
- **Skills and builds:** three-choice level-up drafts create run-specific synergies. Special-skill recovery is counted in full turns, not seconds. Claw upgrades, critical hits, healing on defeat, shields, loot bonuses and skill damage all have distinct uses.
- **Campaign:** authored opening stages and waves lead into a scalable expedition, with boss encounters, local profile persistence and permanent camp upgrades.
- **Visual presentation:** original procedural 2D art, adult dark-fantasy palette, layered arena, animated glass prize capsules, weapon-specific hit effects, synthesized audio and high-DPI mobile Canvas scaling.

## Controls

- Tap or drag inside the lower machine chamber to aim the claw.
- Tap **ZŁAP ŁUP** or press **Space/F** for the turn's single claw attempt.
- After the claw returns, choose **ATAK**, **BLOK** or **UMIEJĘTNOŚĆ** (buttons or **J/K/L**).
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

Run node scripts/validate.mjs with Node.js 22. The checks validate JavaScript syntax, the PWA manifest, service worker, responsive layout, the turn-based state machine, action limits, claw rewards, enemy intent and mobile touch handling.
