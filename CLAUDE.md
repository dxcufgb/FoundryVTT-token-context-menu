# Dxcufgb's token context menu

FoundryVTT v13 module (id `dxcufgbs-token-context-menu`, the install folder must have the same name). Replaces the
loose icons of the Token HUD with a context menu that shows every icon with its description. No build step and no
npm dependencies.

## Layout
- `scripts/main.js` – settings, the menu built from the rendered Token HUD's buttons and palettes (sub-menus), and the players' own menu on tokens they don't own (Follow / Ride only).
- `scripts/integrations.js` – optional entries for Dxcufgb's lively tokens, Dxcufgb's damage dice trails, Dxcufgb's token follower and Rideable.
- `scripts/distance.js` – distance on hover.
- `scripts/debug-recorder.js` – optional integration with Dxcufgb's Debug Recorder (`dxcufgbs-debug-recorder`): registers the snapshot (built in `main.js`) and exports `crumb(key, data)` for breadcrumbs and `codeId()` for recording HUD action ids; does nothing when the recorder is not installed.
- `.github/workflows/ci.yml` / `release.yml` – thin callers of `dxcufgb/foundry-module-ci` (checks, packaging, release); identical in every module, do not edit here.

## Conventions
- Every visible setting needs a Name and Hint in `lang/en.json`.
- Update the wiki (not `README.md`, which only has the install steps and links to the wiki) when behaviour or settings change.
- Read HUD buttons from the rendered HUD, never hard-code them; never block the original actions; remove listeners when the HUD closes.
- Optional modules must never break the menu: calls into them go through `attempt()` / `call()`.
- **Debug Recorder**: the debug-recorder integration is optional; snapshot/breadcrumb data must never contain names, free text, image paths or URLs. Here that means no token, actor or user names, button labels or token images: only counts, booleans and fixed ids (integration names, HUD `data-action` ids through `codeId()`).
