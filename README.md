# Dxcufgb's token context menu

[![Foundry v13](https://img.shields.io/github/v/release/dxcufgb/FoundryVTT-token-context-menu?label=Foundry%20v13&logo=foundryvirtualtabletop&color=ff6400)](https://github.com/dxcufgb/FoundryVTT-token-context-menu/releases/latest)
[![Downloads](https://img.shields.io/github/downloads/dxcufgb/FoundryVTT-token-context-menu/module.zip?label=downloads&color=blue)](https://github.com/dxcufgb/FoundryVTT-token-context-menu/releases)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-support-FF5E5B?logo=kofi&logoColor=white)](https://ko-fi.com/dxcufgb)\
[![CI](https://img.shields.io/github/actions/workflow/status/dxcufgb/FoundryVTT-token-context-menu/ci.yml?branch=main&label=CI)](https://github.com/dxcufgb/FoundryVTT-token-context-menu/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/dxcufgb/FoundryVTT-token-context-menu)](LICENSE)

<a href="https://dxcufgb.github.io/FVTT-dev-showcase/"><img src="https://dxcufgb.github.io/FVTT-dev-showcase/assets/img/workshop-badge.png" alt="Dxcufgb's Workshop: every Foundry VTT project, video and changelog in one place" width="650"></a>

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
- The menu opens beside the token, flips to the other side near the screen edge and keeps the same size on screen whatever the zoom (can be turned off with **Keep menu size when zooming**).
- The menu is 12% of the window's width wide and at most 24% of its height tall; when its entries don't fit it scrolls, like the status effects sub-menu (without the filter box).
- **[Dxcufgb's lively tokens](https://github.com/dxcufgb/FoundryVTT-lively-tokens)** (optional, not needed): if it is installed and active, the menu of your own tokens gets an **Animated token ring** entry that opens its ring window for the token (in place of its HUD button). Players only get it when lively tokens lets players use it.
- **[Dxcufgb's damage dice trails](https://github.com/dxcufgb/FoundryVTT-dice-trails)** (optional, not needed): if it is installed and active, the menu of your own tokens gets a **Dice trails** entry that opens its window of your trails.
- **[Dxcufgb's token follower](https://github.com/dxcufgb/FoundryVTT-token-follower)** (optional, not needed): if it is installed and active, the menu gets **Follow this token** (or **Stop following this token**). GMs get it on every token; players on the friendly tokens they can see. A token that follows someone gets **Stop following** *name* in its own menu.
- **[Rideable](https://github.com/Saibot393/Rideable)** (optional, not needed): if it is installed and active, tokens marked as rideable (Rideable's setting in the token's configuration; in PF2e also tokens with the *rideable* trait when Rideable is set to use it) get **Ride** (or **Dismount**), in place of Rideable's own HUD button.
- **Players on tokens they don't own:** right-click the token to get a small menu with only **Follow this token** / **Ride** (when you have a token of your own on that scene). It shows nothing else of the token (no name, bars, HP or effects).
- Who follows or rides: the tokens you had selected when you right-clicked (right-clicking selects the clicked token, the menu remembers the selection from before), else your character's token on the scene, else your only token there. If that doesn't settle it (a GM owns every token), the entry opens a list to pick the token from.
- **Distance on hover:** while the mouse is over a token, a label next to the cursor shows how far it is from your active token (your selected token, else your character's token on the scene), measured from centre to centre in the scene's units. A token bigger than one square is measured from the centre of its square closest to the other token. Every player (and the GM) can turn it on or off for themselves with the **Distance on hover** setting.

## Settings

| Setting | Who | What it does |
|---|---|---|
| **Token context menu** | each computer | Shows the Token HUD as the menu. Off: Foundry's plain icons on this computer. |
| **Keep menu size when zooming** | each computer | The menu keeps its size on screen whatever the zoom. Off: it grows and shrinks with the map. |
| **Distance on hover** | each user | The distance label next to the cursor (see above). |

## For module authors

There is no API and no hooks to call: the menu is built from the Token HUD itself. A button you add to the Token HUD shows up in the menu by itself, and it still gets the clicks.

```js
Hooks.on("renderTokenHUD", (hud, html) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "control-icon";              // must be a .control-icon in one of the HUD's .col columns
  button.dataset.tooltip = "Light a torch";       // the menu entry's text
  button.innerHTML = '<i class="fa-solid fa-fire"></i>';
  button.addEventListener("click", () => { /* … */ });
  button.addEventListener("contextmenu", () => { /* right-click on the menu entry */ });
  html.querySelector(".col.right")?.append(button);
});
```

- **Text:** the button's `data-tooltip-text`, else `data-tooltip` (localization keys work), `aria-label`, `title`, `alt`, its own text, or its `data-action` ("toggleTorch" → "Toggle Torch").
- **Icon:** a copy of the `img`, `svg` or `i` inside the button (or its own `fa-` classes).
- **Clicks:** the original button stays in the HUD, only hidden, and the menu dispatches `click` (left-click) or `contextmenu` (right-click) on it. Use those events (or the HUD's `data-action` handlers), not hover.
- **State:** the `active` class on the button highlights the entry; toggle it and the menu follows. A button with the `hidden` attribute or `style.display = "none"` gets no entry.
- **Sub-menus:** a button with `data-palette="key"` opens the HUD element `.palette[data-palette="key"]` as a sub-menu. Its items are the `[data-action]`, `[data-status-id]`, `.effect-control` and `.control-icon` elements in it; items with `data-status-id` are toggled with `actor.toggleStatusEffect(id, { overlay })` instead of clicked. More than 12 items get a filter box.
- **Timing:** buttons added or removed after the HUD rendered are picked up too (the menu watches the columns).
- Entries come in the order of the HUD's buttons, followed by the entries for the optional modules above. The players' menu on tokens they don't own shows no HUD buttons.

What it uses from the optional modules (changing these breaks the entries):

- Dxcufgb's lively tokens (`dxcufgbs-lively-tokens`): `api.open()`, its `playersCanUse` setting, and it hides its `.dxlt-hud` button.
- Dxcufgb's damage dice trails (`dxcufgbs-dice-trails`): `api.open()`.
- Dxcufgb's token follower (`dxcufgbs-token-follower`): `api.follow(follower, leader)`, `api.stop(follower)` (token documents) and the token flag `flags["dxcufgbs-token-follower"].leader` (`{ tokenId, sceneId, name }`).
- Rideable (`Rideable`): `api.RideableFlags.isRiddenby(mount, rider)`, `game.Rideable.ToggleMount(riders, mount)`, the token flag `flags.Rideable.issetRideableFlag`, and it hides Rideable's `[data-action="mount"]` button.

## Releasing

For the maintainer: **Actions → Release module → Run workflow**, type the version (for example `1.2.3`) and run it. The module is checked and packaged first; only then is the release `v1.2.3` published with `module.json` and `module.zip`. CI and releases come from [dxcufgb/foundry-module-ci](https://github.com/dxcufgb/foundry-module-ci), the same for every module.
