# Claw Quest — Arcade Roguelite

A mobile-first 2D arcade roguelite built with Canvas 2D and vanilla JavaScript. Claw Quest combines a physical capsule machine with one-action-per-turn arena combat. The presentation uses bright, readable fantasy characters, colorful prize capsules, a glass-fronted claw cabinet and a compact mobile HUD.

## Core turn loop

1. **Claw phase:** aim the carriage and make exactly one grab attempt.
2. **Tactical reposition:** in the hero phase, move one arena tile once per turn. Advancing grants a short attack bonus; retreating grants shield. This movement does not consume the attack.
3. **Hero action:** commit one weapon attack or special action.
4. **Enemy phase:** living enemies resolve their planned move, attack or guarded stance. The next turn begins with a fresh prize layout.

There is no real-time auto-fire or continuous enemy movement. Animation presents actions already resolved by the turn state machine.

## Claw cabinet and precision rewards

- The chamber begins with **24 ordinary filler balls**. Its target fill rises by **5 balls per turn**, up to **72**.
- Ordinary balls are not rewards. Catching one consumes the only grab attempt without granting loot.
- Filler balls physically obstruct valuable prize capsules. They have mass, velocity, restitution and angular velocity; gravity, claw impulses, chamber boundaries and ball-to-ball collisions produce stacking and rolling.
- Capsule positions are refreshed between turns. The claw catches the first object in its capture corridor.
- The precision grade is calculated when the player starts the grab, before the claw or chamber physics can shift the capsule:
  - **Perfect:** centered alignment; grants bonus credits, expedition XP and attack empowerment.
  - **Good:** close alignment; grants a small XP bonus.
  - **Normal:** a successful grab without an accuracy bonus.
- Consecutive perfect grabs build a short streak. A three-perfect streak grants a larger reward.
- The chamber threshold bonus still rewards clearing excess filler balls.

Prize capsules include coins, XP crystals, weapon drops, attack shards, healing, shields, bombs, skill charges and a rare **Relic Fragment**.

## Relic collection and bestiary

Five Relic Fragments restore a permanent relic and grant **+1 permanent attack rank**. Collection progress is saved in the local profile and shown in the Codex.

Defeating an enemy records its species in the permanent bestiary. Discovering a species for the first time awards a small credit bonus. The Codex tracks all nine current archetypes, defeat counts, relic progress and perfect-catch records.

## Combat, weapons and builds

**Five weapon archetypes** — service sidearm, impulse repeater, scatter gun, siege cannon and photon lance — have distinct models, shot trails, recoil, muzzle flashes, target coverage and impact effects. Repeater bursts, scatter pellets and cannon splash are still one committed action.

Run XP drives three-choice skill drafts. The game has twelve skill cards and four build synergies:

- **KOROZJA:** Venom + Bleed — poison gains extra damage against bleeding targets.
- **BASTION:** Iron Oath + Riposte Rune (or Aegis) — shield and counterattack effects reinforce each other.
- **FURIA ETERU:** critical-focused builds — critical hits restore shield and shorten skill recovery.
- **ZŁOTY CHWYT:** Treasure Magnet + Golden Instinct — successful prize grabs grant extra expedition XP and credits.

The Arsenal previews weapon archetypes, skill cards and synergy recipes. Active build effects remain visible in the gameplay HUD.

## Permanent talent tree

Open **KUŹNIA → DRZEWKO TALENTÓW** to spend persistent credits on three permanent branches:

- **Męstwo Wojownika:** +2 weapon damage per rank.
- **Magia Reliktów:** +4 px claw capture tolerance per rank and the Golden Grip reward bonus.
- **Alchemia Trucizn:** +1 poison damage per rank when poison is applied.

Each talent has three ranks. Talent levels, credits, relic fragments, bestiary discoveries, hero upgrades, campaign unlocks and records are saved in the local profile.

## Enemies and campaign

The roster includes Slime, Bat, Porcupine, Goblin, Fire Elemental, Dragon, Crystal Golem, Swamp Hydra and the stage Guardian boss. Each has a distinct procedural silhouette, palette, stats and attack cadence. Enemy intent rings, armor, status marks, hit reactions, wind-ups and death animations remain visible during combat.

The opening campaign includes Polana Początku, Zarośnięta Ścieżka, Nora Zmierzchu, Ruiny Strażników and Leśny Strażnik, followed by scalable expeditions and boss encounters.

## Visuals and mobile support

The hub has four distinct tabs: **Kuźnia**, **Bitwa**, **Arsenał** and **Kodeks**. Combat uses a bright illustrated biome backdrop, a readable hero/enemy lineup, highlighted tactical tiles and a colorful acrylic claw cabinet. Shared glass-panel framing, rounded arcade controls, color-coded prize capsules and a clear phase/health HUD tie the screens together.

The game uses a 450×800 logical playfield with aspect-safe scaling, a device-pixel-ratio canvas buffer capped at **2.25**, and matching touch-coordinate transforms. Portrait phone layouts, pointer capture/cancellation, keyboard input and PWA installation are supported.

## Controls

- **Tap or drag** inside the chamber to position the claw.
- **Space / F** — make the claw attempt during the claw phase.
- **Space / J / K / L** — commit the hero attack during the attack phase.
- **A / D** or **← / →** — nudge the claw carriage.
- **Q / E** — one tactical retreat / advance during the hero phase.
- **Tap an enemy** to select it; **Tab** cycles targets and **1–4** selects a target by order.
- **Escape** pauses the expedition.

## Performance and automated checks

The prize chamber uses a **48 px spatial hash** for broad-phase sphere collision filtering. Only objects in adjacent buckets are tested as collision candidates; the detailed overlap solver, bounce response, mass distribution and floor/wall constraints remain in place. The frame update uses two physics substeps, while particles, floating combat labels and impact effects have bounded pools. Canvas rendering is capped at DPR 2.25 to reduce fill-rate cost on mobile devices.

Run locally with Node.js 22:

```sh
npm install
npm run dev
```

Run automated checks with:

```sh
npm run build
```

GitHub Actions runs JavaScript/PWA validation and gameplay smoke tests on pushes to `main` and pull requests. GitHub Pages deployment is handled by the repository's Pages workflow.
