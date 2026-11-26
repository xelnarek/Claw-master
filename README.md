# Claw Quest — Arcade Roguelite

A mobile-first 2D arcade prototype built with Canvas 2D and vanilla JavaScript.

## Current playable slice

- Portrait layout designed for Android phones.
- Side-view 2D arena with a detailed cartoon hero, animated enemies, health, score and waves.
- Character action animation states: idle breathing, sword attack, charged special, shield guard and damage reaction.
- Enemy reactions: bat wing flaps, slime squash/stretch, goblin attack movement, boss pulse, hit flash and delayed defeat animation.
- Turn-based combat: choose a target, attack, defend to reduce incoming damage, or use a powerful cooldown skill.
- Five curated opening stages with distinct biomes, scripted encounter waves, an end-of-chapter boss, then a scalable endless expedition.
- New porcupine enemy, enemy attack telegraph, stage objectives and stage-clear rewards.
- Separate claw-machine cabinet in the lower half of the screen.
- Touch/drag claw positioning, left/right controls and a grab/retrieval cycle.
- Claw loot: persistent coins, run-only attack upgrade, healing, shield buffer and area bomb.
- Persistent local profile: hero level/XP, unlocked stage, best stage/score, permanent attack/vitality/claw upgrades.
- Keyboard fallback: J attack, K defend, L special; A/D or arrows move claw, Space/F grab, Escape pause.
- Dedicated illustrated start screen, expedition summary, settings and quick controls guide.
- Local device preferences for sound and visual effects, plus a locally saved best score.
- No 3D engine, remote asset dependency, build step or external library.

## Run locally

Open `index.html` in a modern browser, or serve the repository with any static web server.

For GitHub Pages, select **GitHub Actions** as the deployment source in the repository's Pages settings.

## Controls

- Tap **ROZPOCZNIJ WYPRAWĘ** to start. The main menu also opens settings and a control guide.
- Tap an enemy in the arena to select a target. Tap the action buttons (attack/defend/special) to resolve your turn.
- Tap anywhere in the claw chamber to place the claw directly, or drag to fine-tune its position.
- Use the lower **LEWO / PRAWO** buttons for precise correction. The claw precision upgrade increases the pickup tolerance.
- Tap **ZŁAP!** to lower the claw and retrieve a nearby prize.
- Combat is turn-based: the player selects a target and chooses Attack, Defend or Special. Enemies act during their phase.

## Progression

The first five stages are authored encounters: Polana Początku, Zarośnięta Ścieżka, Nora Zmierzchu, Ruiny Strażników and Leśny Strażnik. Clearing a stage grants coins and XP and unlocks the next stage. Coins, hero level, XP, unlocked stage, best score and permanent upgrade ranks are saved locally in `localStorage`. The camp upgrade panel sells permanent attack, vitality and claw-precision upgrades.

## Technical direction

The art is drawn procedurally with Canvas 2D vector shapes, gradients, layered scenery and lighting. The first five stages use separate meadow, forest, cave, ruins and boss palettes. The camp now surfaces level, XP, unlocked stage and coins, with a permanent upgrade panel. Combat includes timed character poses, enemy intent markers and hit/defeat reactions. The game remains an original 2D visual prototype rather than a final sprite-sheet asset pack.

## Next milestones

1. Replace vector placeholder characters with original sprite sheets and animation states.
2. Add distinct enemy attack patterns, boss phases and hit reactions.
3. Add weapon selection, collectible upgrades, rarity and build synergies.
4. Add persistent progression, stage selection, sound settings and save data.
5. Tune mobile performance, accessibility, balancing and Android packaging.

The project is inspired by the broad 2D arcade/roguelike claw-machine genre. It does not use the name, source code or proprietary assets of another game.

## Install and publish

The project includes a web-app manifest and an offline service worker. Once hosted over HTTPS, a compatible Android browser can offer installation to the home screen.

To publish with GitHub Pages:
1. Open **Settings → Pages** in this repository.
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. Re-run the **Deploy Claw Quest to GitHub Pages** workflow, or push another commit to `main`.

Expected project URL after Pages is enabled: `https://xelnarek.github.io/Claw-master/`.

The public Pages deployment is published at `https://xelnarek.github.io/Claw-master/`.

## Combat

Turn order alternates between the player and enemy phases. Choose an enemy by tapping its sprite, then use Attack, Defend or Special. The special attack has a cooldown. Defending reduces incoming damage for the next enemy action.
