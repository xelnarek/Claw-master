# Claw Quest — Relic Vault Roguelite

A mobile-first 2D heroic-fantasy roguelite built with Canvas 2D and vanilla JavaScript. The game combines a physical claw-machine prize chamber with tactical, turn-based arena combat.

## Turn loop

1. **Claw phase:** aim the carriage and make exactly one grab attempt.
2. **Tactical reposition:** in the hero phase, move one arena tile once per turn. Advancing grants a short attack bonus; retreating grants shield. This movement does not consume the attack.
3. **Hero attack:** commit one weapon attack. Weapon archetypes determine the shot pattern, target coverage, damage and impact effects.
4. **Enemy phase:** living enemies resolve their planned move, attack or guarded stance. The next turn starts with a new prize layout.

There is no real-time auto-fire or continuous enemy movement. Animation presents actions that have already been resolved by the turn state machine.

## Claw-machine physics

- The chamber begins with **24 ordinary filler balls**. Its target fill increases by **5 balls each turn**, up to **72**.
- Ordinary balls are not rewards. Catching one consumes the only grab attempt without granting loot.
- The claw catches the first object in its vertical capture corridor. Filler balls can obstruct and shield valuable prize capsules.
- Balls have mass, velocity, restitution and angular velocity. Gravity, sphere-to-sphere collisions, chamber boundaries and claw impacts create stacking, rolling and displacement.
- Good prizes can be repositioned by the claw and its magnet effect. Prize capsules are refreshed and rearranged between turns.
- When the filler count is at or below the chamber threshold, a successful prize grab can trigger the chamber-clear bonus.

Prize types include coins, expedition XP, weapons, damage shards, healing, shields, bombs and skill charges. Each retains its own reward and visual treatment.

## Combat, weapons and builds

**Five weapon archetypes** — service sidearm, impulse repeater, scatter gun, siege cannon and photon lance — have distinct models, shot trails, recoil, muzzle flashes, target coverage and impact effects. Repeater bursts, scatter pellets and cannon splash are still one committed attack.

Run XP drives three-choice skill drafts. The game has twelve skill cards and four build synergies:

- **KOROZJA:** Venom + Bleed — poison gains extra damage against bleeding targets.
- **BASTION:** Iron Oath + Riposte Rune (or Aegis) — shield and counterattack effects reinforce each other.
- **FURIA ETERU:** critical-focused builds — critical hits restore shield and shorten skill recovery.
- **ZŁOTY CHWYT:** Treasure Magnet + Golden Instinct — successful prize grabs grant extra expedition XP and credits.

The Arsenal hub tab previews weapon archetypes, skill cards and synergy recipes. Active build effects are also shown in the gameplay HUD.

## Permanent talent tree

Open **KUŹNIA → DRZEWKO TALENTÓW** to spend persistent credits on three permanent branches:

- **Męstwo Wojownika:** +2 weapon damage per rank.
- **Magia Reliktów:** +4 px claw capture tolerance per rank and the Golden Grip reward bonus.
- **Alchemia Trucizn:** +1 poison damage per rank when poison is applied.

Each talent has three ranks. Talent levels, credits, hero upgrades, campaign unlocks and records are saved in the local profile.

## Enemies and campaign

The original enemy roster is joined by four new archetypes: **Fire Elemental, Dragon, Crystal Golem and Swamp Hydra**. Each has its own model, palette, stats and attack cadence. Enemy intent indicators, armor, status effects, attack wind-ups, hit reactions and death animations remain visible during combat.

The opening campaign includes Polana Początku, Zarośnięta Ścieżka, Nora Zmierzchu, Ruiny Strażników and Leśny Strażnik, followed by scalable expeditions and boss encounters.

## Hub, visuals and mobile support

The main hub has four distinct tabs: **Kuźnia**, **Bitwa**, **Arsenał** and **Kodeks**. The visual direction is dark heroic fantasy with obsidian, iron and blood-ruby accents, Cinzel / Plus Jakarta Sans typography, detailed enemy art, cinematic parallax environments, animated UI feedback and a glass-fronted claw cabinet.

The game uses a 450×800 logical playfield with aspect-safe scaling, a device-pixel-ratio canvas buffer (capped at 2.75) and matching touch-coordinate transforms. Portrait phone layouts, pointer capture/cancellation, keyboard input and PWA installation are supported.

## Controls

- **Tap or drag** inside the chamber to position the claw.
- **Space / F** — make the claw attempt during the claw phase.
- **Space / J / K / L** — commit the hero attack during the attack phase.
- **A / D** or **← / →** — nudge the claw carriage.
- **Q / E** — one tactical retreat / advance during the hero phase.
- **Tap an enemy** to select it; **Tab** cycles targets and **1–4** selects a target by order.
- **Escape** pauses the expedition.

## Technical direction and checks

The game uses Canvas 2D, procedural character drawings, deterministic turn resolution, a custom sphere-chamber physics solver and synthesized Web Audio. It does not use another game's sprites, source code, branding or audio.

Run locally with Node.js 22:

```sh
npm install
npm run dev
```

Run the automated checks with:

```sh
npm run build
```

The GitHub Actions validation workflow runs the JavaScript/PWA checks and gameplay smoke tests on pushes to `main` and pull requests. GitHub Pages deployment is handled by the repository's Pages workflow.
