# Claw Quest — real-time claw roguelite

A mobile-first 2D arcade roguelite made with Canvas 2D and vanilla JavaScript. Its core loop combines real-time side-view combat with a separate claw machine for weapons, upgrades and resources. The project takes inspiration from the broad design of *Claw Master – Roguelike Hero* while using original code, procedural art and synthesized audio.

## Current playable slice

- Portrait-first mobile layout with high-DPI Canvas rendering and responsive resize handling.
- Side-view real-time arena: the hero automatically fires at the nearest active enemy while the player repositions by touch-dragging the left side of the arena or using directional controls.
- Five weapon archetypes with distinct fire rates, projectile speeds, damage profiles and visual projectile treatments: service pistol, repeater, scatter gun, siege cannon and photon lance.
- Projectiles collide with enemies and are removed on impact; the cannon adds splash damage and the photon lance can pierce.
- Combat abilities: burst volley, temporary guard and a cooldown-based area super.
- Enemies advance toward the hero, telegraph close-range attacks and have different durability, speed and damage values.
- A separate lower claw machine remains active during combat. Position its carriage by tapping or dragging in the chamber, then launch the claw to retrieve a prize.
- Claw loot includes coins, weapon drops, damage ammunition, XP, healing, shields and area bombs. New weapon drops can replace the current weapon or raise its level.
- The claw has an independent 6.5-second cooldown after retrieval; it no longer consumes a combat turn.
- Five curated opening stages with distinct biomes and waves, followed by a scalable endless expedition.
- Roguelite level-up draft with three skill choices and persistent camp upgrades.
- Persistent local profile, coins, unlocked stages, best stage and score.
- Synthesized Web Audio effects and adjustable visual effects.
- Keyboard fallback: A/D or arrows move the hero, J fires a burst, K activates guard, L triggers the super, Space/F launches the claw, Escape pauses.
- No 3D engine, remote asset dependency, build step or external library.

## Controls

- Tap **ROZPOCZNIJ WYPRAWĘ** to start.
- Drag or tap the left half of the arena to reposition the hero. The hero automatically shoots the nearest living enemy.
- Use **SERIA**, **OSŁONA** and **SUPER** in the combat action bar for active abilities.
- Tap or drag inside the lower cabinet to position the claw. Press **ZŁAP!** to descend and retrieve the nearest prize.
- The lower left/right buttons make small hero-position adjustments. The claw carriage is positioned directly in the cabinet area.
- A successful claw retrieval starts its cooldown; combat continues during the claw animation and cooldown.

## Progression

The first five authored stages are Polana Początku, Zarośnięta Ścieżka, Nora Zmierzchu, Ruiny Strażników and Leśny Strażnik. Clearing their waves unlocks the next stage. Coins, hero level/XP, unlocked stage, best score and permanent upgrade ranks are saved locally in `localStorage`. The base camp sells permanent attack, vitality and claw-precision upgrades.

## Technical direction

The game uses Canvas 2D with procedural character drawings, enemy silhouettes, parallax-style scenery, biome palettes, layered projectile effects and synthesized audio. It does not use another game's sprites, source code, sound assets or branding. The current art is still procedural 2D; production sprite sheets, more elaborate enemy attack patterns, boss phases and deeper run synergies remain future quality milestones.

## Run locally

Open `index.html` in a modern browser, or serve the repository with any static web server.

For GitHub Pages, select **GitHub Actions** as the deployment source in the repository's Pages settings.

## Automated checks

Run `node scripts/validate.mjs` with Node.js 22 to validate the Canvas game script, PWA manifest, service worker, responsive layout and gameplay smoke suite. The smoke suite checks automatic fire, projectile collision, weapon switching, the combat abilities, claw retrieval/cooldown, upgrades, stage progression and mobile touch cancellation.
