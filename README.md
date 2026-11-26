# Claw Master — Arcade Quest

A mobile-first 2D arcade prototype built with Canvas 2D and vanilla JavaScript.

## Current playable slice

- Portrait layout designed for Android phones.
- Side-view 2D arena with a cartoon hero, animated enemies, health, score and waves.
- Automatic basic attack with visible projectiles and hit effects.
- Enemy variety, wave scaling and a boss encounter every fifth wave.
- Separate claw-machine cabinet in the lower half of the screen.
- Touch/drag claw positioning, left/right controls and a grab/retrieval cycle.
- Loot rewards: coins, gems, health, shield and bomb.
- Keyboard fallback: A/D or arrow keys to move the claw, Space/F to grab, Escape to pause.
- No 3D engine, remote asset dependency, build step or external library.

## Run locally

Open `index.html` in a modern browser, or serve the repository with any static web server.

For GitHub Pages, select **Deploy from a branch**, choose `main` and the root folder in the repository's Pages settings.

## Controls

- Tap **ROZPOCZNIJ GRĘ** to start.
- Tap/drag in the claw cabinet to position the claw.
- Use the lower **LEWO / PRAWO** buttons to position it precisely.
- Tap **ZŁAP!** to lower the claw and retrieve a nearby prize.
- The hero attacks automatically. The left/right arena controls shift the hero's position.

## Technical direction

The current art is drawn procedurally with Canvas 2D vector shapes and gradients. It is a self-contained visual prototype, not yet a final production asset pack. The next art pass should replace placeholder vector characters with a consistent original sprite set and frame-based animations while retaining the 2D arcade presentation.

## Next milestones

1. Replace vector placeholder characters with original sprite sheets and animation states.
2. Add distinct enemy attack patterns, boss phases and hit reactions.
3. Add weapon selection, collectible upgrades, rarity and build synergies.
4. Add persistent progression, stage selection, sound settings and save data.
5. Tune mobile performance, accessibility, balancing and Android packaging.

The project is inspired by the broad 2D arcade/roguelike claw-machine genre. It does not use the name, source code or proprietary assets of another game.
