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
- **[Dxcufgb's token follower](https://github.com/dxcufgb/FoundryVTT-token-follower):** if it is active, the menu gets **Follow this token** (or **Stop following this token**). GMs get it on every token; players on the friendly tokens they can see, also ones they don't own: right-click such a token and the menu shows just the entries you can use.
- **[Rideable](https://github.com/Saibot393/Rideable):** if it is active, rideable tokens get **Ride** (or **Dismount**), in place of Rideable's own HUD button.
- Who follows or rides: your selected tokens, else your character's token on the scene, else your only token there. If that doesn't settle it (a GM owns every token), the entry opens a list to pick the token from.
