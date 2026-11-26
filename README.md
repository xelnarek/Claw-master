# Claw Quest — Arcade Roguelite

A mobile-first 2D arcade prototype built with Canvas 2D and vanilla JavaScript.

## Current playable slice

- Portrait layout designed for Android phones.
- Side-view 2D arena with a detailed cartoon hero, animated enemies, health, score and waves.
- Character action animation states: idle breathing, sword attack, charged special, shield guard and damage reaction.
- Enemy reactions: bat wing flaps, slime squash/stretch, goblin attack movement, boss pulse, hit flash and delayed defeat animation.
- Turn-based combat: choose a target, attack, defend to reduce incoming damage, or use a powerful cooldown skill.
- Enemy variety, wave scaling and a boss encounter every fifth wave.
- Separate claw-machine cabinet in the lower half of the screen.
- Touch/drag claw positioning, left/right controls and a grab/retrieval cycle.
- Loot rewards: coins, gems, health, shield and bomb.
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
- Tap/drag in the claw cabinet to position the claw.
- Use the lower **LEWO / PRAWO** buttons to position it precisely.
- Tap **ZŁAP!** to lower the claw and retrieve a nearby prize.
- Combat is turn-based: the player selects a target and chooses Attack, Defend or Special. Enemies act during their phase.

## Technical direction

The art is drawn procedurally with Canvas 2D vector shapes, gradients, layered scenery and lighting. The menu has a separate illustrated camp/portal scene, a structured expedition panel, functional settings and a controls guide. Combat now includes timed character poses and enemy hit/defeat reactions. This remains an original 2D visual prototype rather than a final sprite-sheet asset pack; the next art pass should replace procedural character shapes with authored, consistent sprite sheets and add further distinct biomes.

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

The current repository has Pages disabled, so the deployment workflow cannot publish yet. This is a repository setting, not a game-code error.

## Combat

Turn order alternates between the player and enemy phases. Choose an enemy by tapping its sprite, then use Attack, Defend or Special. The special attack has a cooldown. Defending reduces incoming damage for the next enemy action.
