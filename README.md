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

Requirements and more: see [Installation](https://github.com/dxcufgb/FoundryVTT-token-context-menu/wiki/Installation) in the wiki.

## Documentation

The full guide is in the [wiki](https://github.com/dxcufgb/FoundryVTT-token-context-menu/wiki):

- [The Token Menu](https://github.com/dxcufgb/FoundryVTT-token-context-menu/wiki/The-Token-Menu): entries, sub-menus, distance on hover
- [Optional Modules](https://github.com/dxcufgb/FoundryVTT-token-context-menu/wiki/Optional-Modules): follow, ride, token rings, dice trails
- [Settings](https://github.com/dxcufgb/FoundryVTT-token-context-menu/wiki/Settings): the three settings
- [For Module Authors](https://github.com/dxcufgb/FoundryVTT-token-context-menu/wiki/For-Module-Authors): getting your HUD button into the menu

## Releasing

For the maintainer: **Actions → Release module → Run workflow**, type the version (for example `1.2.3`) and run it. The module is checked and packaged first; only then is the release `v1.2.3` published with `module.json` and `module.zip`. CI and releases come from [dxcufgb/foundry-module-ci](https://github.com/dxcufgb/foundry-module-ci), the same for every module.
