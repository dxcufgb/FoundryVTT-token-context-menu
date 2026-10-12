# Dxcufgb's token context menu

Right-click a token and get a proper menu instead of a ring of loose icons: every Token HUD button is shown with its icon **and** its description, so you never have to hover to find out what a button does.

**Foundry VTT:** v13 · system agnostic

## Installation

In Foundry: **Add-on Modules → Install Module**, paste this link into **Manifest URL** at the bottom, and click **Install**:

```
https://github.com/dxcufgb/FoundryVTT-token-context-menu/releases/latest/download/module.json
```

## Features

- **All Token HUD icons become menu entries** (icon + description), including the buttons added by your game system and other modules. The menu reads the HUD's own buttons and clicks them for you, so everything keeps working exactly as before.
- **Active states are shown:** in combat, hidden, targeted, ... are highlighted.
- **Palettes open as sub-menus:** status effects (with a filter box when the list is long) and movement actions.
  - Status effects: left-click toggles, right-click toggles it as a large overlay (marked ★).
- The elevation field and resource bars stay where they are.
- The menu opens beside the token, flips to the other side near the screen edge and keeps the same size on screen whatever the zoom (can be turned off).
- **[Dxcufgb's lively tokens](https://github.com/dxcufgb/FoundryVTT-lively-tokens):** if it is active, the menu gets an **Animated token ring** entry that opens its ring window for the token (in place of its HUD button).
- **[Dxcufgb's token follower](https://github.com/dxcufgb/FoundryVTT-token-follower):** if it is active, the menu gets **Follow this token** (or **Stop following this token**). GMs get it on every token; players on the friendly tokens they can see.
- **[Rideable](https://github.com/Saibot393/Rideable):** if it is active, rideable tokens get **Ride** (or **Dismount**), in place of Rideable's own HUD button.
- **Players on tokens they don't own:** right-click the token to get a small menu with only **Follow this token** / **Ride**. It shows nothing else of the token (no name, bars, HP or effects).
- Who follows or rides: the tokens you had selected when you right-clicked (right-clicking selects the clicked token, the menu remembers the selection from before), else your character's token on the scene, else your only token there. If that doesn't settle it (a GM owns every token), the entry opens a list to pick the token from.
- **Distance on hover:** while the mouse is over a token, a label next to the cursor shows how far it is from your active token (your selected token, else your character's token on the scene), measured from centre to centre in the scene's units. A token bigger than one square is measured from the centre of its square closest to the other token. Every player (and the GM) can turn it on or off for themselves with the **Distance on hover** setting.

## Releasing

For the maintainer: **Actions → Release module → Run workflow**, type the version (for example `1.2.3`) and run it. The module is checked and packaged first; only then is the release `v1.2.3` published with `module.json` and `module.zip`. CI and releases come from [dxcufgb/foundry-module-ci](https://github.com/dxcufgb/foundry-module-ci), the same for every module.
