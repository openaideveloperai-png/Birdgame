# PARALLAX

A playable third-person 3D puzzle-engine sketch inspired by perspective-based spatial puzzle games.

## What is in the prototype

- Over-the-shoulder orbit camera and WASD movement with a visible player avatar
- Lightweight player/world collision and momentum-based cube throwing
- Raycast object interaction
- Perspective-dependent cube scaling: move a held cube farther away to make it physically larger
- A scale-sensitive receiver and animated exit-door objective
- A spatial fold gate that relocates the player
- Layered warm/cool lighting, soft shadows, responsive HUD, onboarding, win state, and restart flow

## Run it

The game loads Three.js as an ES module from jsDelivr, so serve the folder over HTTP:

```sh
npx serve .
```

Then open the local address and click **Enter the chamber**.

## Controls

| Input | Action |
| --- | --- |
| WASD / Arrow keys | Move |
| Mouse | Orbit camera |
| E | Grab or drop the highlighted cube |
| Mouse wheel | Push or pull a held cube, changing its physical scale |
| Left click | Throw a held cube with momentum |
| Shift | Sprint |
| Esc | Release the cursor |

This is intentionally a no-build vertical slice. The next useful engine step would be extracting level data and physics/interactions into modules before adding more chambers.
