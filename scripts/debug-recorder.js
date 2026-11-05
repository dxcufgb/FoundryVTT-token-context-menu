/**
 * Optional integration with Dxcufgb's Debug Recorder (dxcufgbs-debug-recorder).
 *
 * While the GM records, the recorder collects a snapshot of this module's runtime state and a
 * trail of breadcrumbs (what the menu did and when) for bug reports. The recorder is NOT a
 * dependency: when it is not installed or not active nothing here does anything, and a failure
 * inside the recorder never reaches the menu (every call is wrapped in try/catch).
 *
 * Privacy: snapshots and breadcrumbs hold only counts, booleans and fixed ids (integration
 * names, HUD action ids). Never token, actor or user names, button labels, image paths or
 * anything else a user typed.
 */

const MODULE_ID = "dxcufgbs-token-context-menu";
const RECORDER_ID = "dxcufgbs-debug-recorder";

/** The recorder API once registered with it, else null. */
let rec = null;
/** Builds this module's snapshot; set by registerDebugRecorder(). */
let snapshotFn = null;
/** A recorder API that arrived before registerDebugRecorder() was called. */
let pending = null;

/** Register with the recorder API (once; later calls do nothing). */
function attach(api) {
  if (rec || typeof api?.register !== "function") return;
  if (!snapshotFn) { pending = api; return; }
  try {
    api.register(MODULE_ID, {
      snapshot: () => {
        try { return snapshotFn(); } catch (err) {
          console.warn(`${MODULE_ID} | debug recorder snapshot failed`, err);
          return { snapshotError: true };
        }
      }
    });
    rec = api;
  } catch (err) {
    console.warn(`${MODULE_ID} | could not register with the debug recorder`, err);
  }
}

/** The recorder's API when it is already ready (its hook fired before this code ran). */
const readyApi = () => globalThis.game?.modules?.get?.(RECORDER_ID)?.api;

// Load order must not matter: catch the recorder's ready hook, and look for an API that is already there.
Hooks.once(`${RECORDER_ID}.ready`, api => attach(api));
Hooks.once("init", () => attach(readyApi()));
Hooks.once("ready", () => attach(readyApi()));

/**
 * Give the recorder this module's snapshot function. `snapshot()` must return plain JSON data.
 * Safe to call before or after the recorder is ready.
 */
export function registerDebugRecorder(snapshot) {
  snapshotFn = snapshot;
  attach(pending ?? readyApi());
  pending = null;
}

/**
 * A code identifier (a HUD button's data-action, a palette key) that is safe to record: short
 * identifier-like strings are passed on, anything else becomes "other", nothing becomes null.
 */
export function codeId(value) {
  if (value === null || value === undefined || value === "") return null;
  const s = String(value);
  return /^[A-Za-z][\w.:-]{0,47}$/.test(s) ? s : "other";
}

/** Leave a breadcrumb (`area.action`, small flat data object) while the recorder is recording; else nothing. */
export function crumb(key, data) {
  if (!rec) return;
  try {
    if (rec.isRecording()) rec.breadcrumb(MODULE_ID, key, data);
  } catch (_) {
    // A recorder bug must never break the menu.
  }
}
