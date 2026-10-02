/**
 * Menu entries for other modules, shown when they are active in the world:
 *  - Dxcufgb's lively tokens: "Animated token ring" opens its ring window.
 *  - Dxcufgb's token follower: "Follow this token".
 *  - Rideable: "Ride" (or "Dismount") on tokens marked as rideable.
 *
 * Follow and Ride need a token that does the following / riding. That is, in order:
 * the user's selected tokens, the tokens of the user's own character on the scene, the
 * user's only token on the scene. If none of these decides it (a GM owns every token),
 * the entry opens a sub-menu to pick the token.
 */

const LIVELY_ID = "dxcufgbs-lively-tokens";
const FOLLOWER_ID = "dxcufgbs-token-follower";
const RIDEABLE_ID = "Rideable";

/** Their own Token HUD buttons, replaced by our entries while those are shown. */
const REPLACES = {
  lively: ".dxlt-hud",
  ride: '[data-action="mount"]'
};

/**
 * Entries for the token's menu, and selectors of HUD buttons they replace.
 * @param {Token} token
 * @returns {{entries: object[], replaces: string[]}}
 */
export function integrationEntries(token) {
  const entries = [];
  const replaces = [];
  if (!token?.document) return { entries, replaces };

  const lively = livelyEntry(token);
  if (lively) { entries.push(lively); replaces.push(REPLACES.lively); }

  entries.push(...followEntries(token));

  const ride = rideEntry(token);
  if (ride) { entries.push(ride); replaces.push(REPLACES.ride); }

  return { entries, replaces };
}

/** Whether a user who does not own the token still gets a menu for it (to follow or ride it). */
export function hasGuestEntries(token) {
  if (!token?.document || token.document.isOwner) return false;
  return !!(followApi() && canFollow(token.document) && ownTokens(token.document).length)
    || !!(rideApi() && isRideable(token.document) && ownTokens(token.document).length);
}

/* -------------------------------------------- */
/*  Dxcufgb's lively tokens                     */
/* -------------------------------------------- */

function livelyEntry(token) {
  const mod = game.modules.get(LIVELY_ID);
  if (!mod?.active || typeof mod.api?.open !== "function") return null;
  if (!token.document.isOwner) return null;
  let allowed = game.user.isGM;
  if (!allowed) {
    try { allowed = game.settings.get(LIVELY_ID, "playersCanUse"); } catch (_) { allowed = true; }
  }
  if (!allowed) return null;
  return {
    label: game.i18n.localize("DXTCM.Lively.Label"),
    icon: () => faIcon("fa-solid fa-ring"),
    run: () => {
      if (!token.controlled) token.control({ releaseOthers: false });
      mod.api.open();
    }
  };
}

/* -------------------------------------------- */
/*  Dxcufgb's token follower                    */
/* -------------------------------------------- */

function followApi() {
  const mod = game.modules.get(FOLLOWER_ID);
  return mod?.active && typeof mod.api?.follow === "function" ? mod.api : null;
}

function leaderOf(doc) {
  return doc?.flags?.[FOLLOWER_ID]?.leader ?? null;
}

function follows(follower, leader) {
  const f = leaderOf(follower);
  return !!f && f.tokenId === leader.id && f.sceneId === leader.parent?.id;
}

/** GMs may follow any token; players the friendly tokens they can see (as Token Follower allows). */
function canFollow(doc) {
  if (game.user.isGM) return true;
  if (doc.hidden || doc.disposition !== CONST.TOKEN_DISPOSITIONS.FRIENDLY) return false;
  return doc.object?.visible === true;
}

function followEntries(token) {
  const api = followApi();
  if (!api) return [];
  const leader = token.document;
  const entries = [];

  // The token itself follows someone: let its owner stop that.
  const own = leaderOf(leader);
  if (own && leader.isOwner) {
    entries.push({
      label: game.i18n.format("DXTCM.Follow.Stop", { name: own.name ?? "?" }),
      icon: () => faIcon("fa-solid fa-person-walking-arrow-loop-left"),
      active: () => true,
      run: () => api.stop(leader)
    });
  }

  if (!canFollow(leader)) return entries;
  const actors = actingTokens(leader);
  if (!actors) return entries;

  const toggle = async docs => {
    if (docs.every(d => follows(d, leader))) {
      for (const d of docs) await api.stop(d);
    } else {
      for (const d of docs) if (!follows(d, leader)) await api.follow(d, leader);
    }
  };
  const label = game.i18n.localize("DXTCM.Follow.Label");
  const icon = () => faIcon("fa-solid fa-shoe-prints");

  if (actors.direct) {
    const all = actors.direct.every(d => follows(d, leader));
    entries.push({
      label: all ? game.i18n.localize("DXTCM.Follow.StopThis") : label,
      hint: names(actors.direct),
      icon, active: () => all,
      run: () => toggle(actors.direct)
    });
  } else {
    entries.push({
      label, icon,
      sub: {
        key: "dxtcm-follow",
        children: () => actors.choices.map(d => tokenChild(d, () => follows(d, leader), () => toggle([d])))
      }
    });
  }
  return entries;
}

/* -------------------------------------------- */
/*  Rideable                                    */
/* -------------------------------------------- */

function rideApi() {
  const mod = game.modules.get(RIDEABLE_ID);
  const flags = mod?.api?.RideableFlags;
  if (!mod?.active || typeof game.Rideable?.ToggleMount !== "function" || !flags) return null;
  return { flags, toggle: (riders, mount) => game.Rideable.ToggleMount(riders, mount) };
}

function isRideable(doc) {
  try { return !!rideApi()?.flags.TokenisRideable(doc); } catch (_) { return false; }
}

function rides(rider, mount, api) {
  try { return !!api.flags.isRiddenby(mount, rider); } catch (_) { return false; }
}

function rideEntry(token) {
  const api = rideApi();
  const mount = token.document;
  if (!api || !isRideable(mount)) return null;
  const actors = actingTokens(mount);
  if (!actors) return null;

  const toggle = docs => api.toggle(docs, mount);
  const icon = () => faIcon("fa-solid fa-horse-head");

  if (actors.direct) {
    const all = actors.direct.every(d => rides(d, mount, api));
    return {
      label: game.i18n.localize(all ? "DXTCM.Ride.Dismount" : "DXTCM.Ride.Label"),
      hint: names(actors.direct),
      icon, active: () => all,
      run: () => toggle(actors.direct)
    };
  }
  return {
    label: game.i18n.localize("DXTCM.Ride.Label"), icon,
    sub: {
      key: "dxtcm-ride",
      children: () => actors.choices.map(d => tokenChild(d, () => rides(d, mount, api), () => toggle([d])))
    }
  };
}

/* -------------------------------------------- */
/*  Helpers                                     */
/* -------------------------------------------- */

/** The user's own tokens on the target's scene, other than the target, nearest first. */
function ownTokens(target) {
  const scene = target.parent;
  if (!scene) return [];
  const c = centre(target);
  return scene.tokens
    .filter(d => d.id !== target.id && d.isOwner)
    .map(d => ({ d, dist: Math.hypot(centre(d).x - c.x, centre(d).y - c.y) }))
    .sort((a, b) => a.dist - b.dist)
    .map(e => e.d);
}

/**
 * The tokens that would follow / ride the target: {direct: docs} when it is clear which,
 * {choices: docs} to let the user pick, or null when the user has no token to use.
 */
function actingTokens(target) {
  const selected = (canvas.tokens?.controlled ?? [])
    .map(t => t.document).filter(d => d.id !== target.id && d.isOwner && d.parent === target.parent);
  if (selected.length) return { direct: selected };
  const owned = ownTokens(target);
  if (!owned.length) return null;
  const character = game.user.character;
  const mine = character ? owned.filter(d => d.actorId === character.id) : [];
  if (mine.length) return { direct: mine };
  if (owned.length === 1) return { direct: owned };
  return { choices: owned };
}

function centre(doc) {
  const size = doc.parent?.grid?.size ?? 100;
  return { x: doc.x + (doc.width * size) / 2, y: doc.y + (doc.height * size) / 2 };
}

function names(docs) {
  const list = docs.map(d => d.name);
  return list.slice(0, 3).join(", ") + (list.length > 3 ? ", …" : "");
}

function tokenChild(doc, isActive, run) {
  return {
    label: doc.name,
    icon: () => {
      const img = document.createElement("img");
      img.src = doc.texture?.src || CONST.DEFAULT_TOKEN;
      img.alt = "";
      return img;
    },
    isActive,
    run: () => run()
  };
}

function faIcon(cls) {
  const i = document.createElement("i");
  i.className = cls;
  return i;
}
