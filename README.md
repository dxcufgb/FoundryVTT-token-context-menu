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

## Settings

- **Token context menu** (per user): turn it off to get Foundry's plain icons back on this computer.
- **Keep menu size when zooming** (per user): on by default.

## License

Code: [MIT](LICENSE).
