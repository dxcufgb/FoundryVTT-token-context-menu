/**
 * Distance on hover.
 *
 * While the mouse is over a token, a small label next to the cursor shows the distance from
 * the user's active token to it, measured centre to centre with the scene's grid rules and
 * units. A token bigger than one grid space is measured from the centre of its space closest
 * to the other token. The active token is the user's first selected token, else their
 * character's token on the scene. Every user turns it on or off for themselves.
 */

const MODULE_ID = "dxcufgbs-token-context-menu";
/** Distance of the label from the cursor, in pixels. */
const OFFSET = 16;

/** The token under the mouse, while the label is shown for it. */
let hovered = null;
/** The label element. */
let label = null;
/** The last pointer position on screen. */
const pointer = { x: 0, y: 0 };

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "distanceOnHover", {
    name: "DXTCM.Settings.DistanceOnHover.Name", hint: "DXTCM.Settings.DistanceOnHover.Hint",
    scope: "user", config: true, type: Boolean, default: true, onChange: () => hide()
  });
  document.addEventListener("pointermove", event => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    if (hovered) place();
  }, { passive: true });
});

Hooks.on("hoverToken", (token, hover) => {
  if (hover) show(token);
  else if (token === hovered) hide();
});

// Keep the number right while either token moves or the selection changes.
Hooks.on("refreshToken", token => {
  if (hovered && (token === hovered || token === activeToken())) update();
});
Hooks.on("controlToken", () => { if (hovered) update(); });
Hooks.on("deleteToken", doc => { if (hovered?.document === doc) hide(); });
Hooks.on("canvasTearDown", () => hide());

/** The token distances are measured from: the first selected one, else the user's character's. */
function activeToken() {
  const controlled = canvas?.tokens?.controlled?.[0];
  if (controlled) return controlled;
  return game.user.character?.getActiveTokens()?.[0] ?? null;
}

function show(token) {
  if (!game.settings.get(MODULE_ID, "distanceOnHover")) return;
  hovered = token;
  update();
}

function hide() {
  hovered = null;
  label?.remove();
  label = null;
}

/** Measure again and show or hide the label. */
function update() {
  const from = activeToken();
  if (!hovered || !from || from === hovered || !canvas?.grid) {
    label?.remove();
    label = null;
    return;
  }
  const distance = closestDistance(centres(from), centres(hovered));
  const units = canvas.grid.units || canvas.scene?.grid?.units || "";
  const value = (Math.round(distance * 100) / 100).toLocaleString(game.i18n.lang);
  if (!label) {
    label = document.createElement("div");
    label.id = "dxtcm-distance";
    document.body.append(label);
  }
  label.textContent = units ? `${value} ${units}` : value;
  place();
}

/** The points a token is measured from: the centre of each grid space it covers if it is bigger
 * than one space, else its own centre. */
function centres(token) {
  const { width, height } = token.document;
  const grid = canvas.grid;
  if ((width <= 1 && height <= 1) || grid.isGridless || !token.document.getOccupiedGridSpaceOffsets) {
    return [token.center];
  }
  const offsets = token.document.getOccupiedGridSpaceOffsets();
  if (!offsets?.length) return [token.center];
  return offsets.map(offset => grid.getCenterPoint(offset));
}

/** The shortest distance between any point of one list and any point of the other. */
function closestDistance(from, to) {
  let best = Infinity;
  for (const a of from) {
    for (const b of to) {
      best = Math.min(best, canvas.grid.measurePath([a, b]).distance);
    }
  }
  return best;
}

/** Put the label next to the cursor, keeping it on screen. */
function place() {
  if (!label) return;
  const { width, height } = label.getBoundingClientRect();
  let x = pointer.x + OFFSET;
  let y = pointer.y + OFFSET;
  if (x + width > window.innerWidth) x = pointer.x - OFFSET - width;
  if (y + height > window.innerHeight) y = pointer.y - OFFSET - height;
  label.style.left = `${Math.max(0, x)}px`;
  label.style.top = `${Math.max(0, y)}px`;
}
