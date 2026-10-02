/**
 * Dxcufgb's token context menu (dxcufgbs-token-context-menu) - Foundry VTT V13
 *
 * Replaces the loose icon buttons of the Token HUD (right-click a token) with a context menu
 * that shows every icon together with its description.
 *
 * The original buttons stay in the HUD, only hidden, and every menu entry simply clicks its
 * button. That way buttons added by the game system or by other modules show up in the menu
 * and keep working without knowing anything about them. Palettes (status effects, movement
 * actions, ...) open as sub-menus.
 *
 * Entries for other modules (Dxcufgb's lively tokens, Dxcufgb's token follower, Rideable)
 * come from integrations.js.
 *
 * Players cannot open Foundry's Token HUD on tokens they do not own. To follow or ride such a
 * token they get a separate menu of our own on right-click, holding only those entries: no
 * bars, HP, effects or anything else of the token.
 */

import { integrationEntries, hasGuestEntries } from "./integrations.js";

const MODULE_ID = "dxcufgbs-token-context-menu";

/** Buttons of the HUD that get a menu entry. */
const BUTTONS = ".col .control-icon";
/** Entries inside a palette. */
const PALETTE_ITEMS = "[data-action], [data-status-id], .effect-control, .control-icon";
/** Show a filter box in sub-menus longer than this. */
const FILTER_FROM = 12;

const state = {
  tokenId: null,     // the token the HUD was last opened for
  open: null,        // the key of the open sub-menu
  filter: "",        // the text in that sub-menu's filter box
  scroll: 0,         // and how far it was scrolled
  selected: null,     // the user's selected tokens when the menu was opened
  observer: null,
  timer: null
};

/** The selection just before the last right-click on the canvas (which changes the selection). */
let rightDown = null;
/** The players' menu for a token they do not own: {root, hud, token}. */
let guest = null;

/* -------------------------------------------- */
/*  Settings                                    */
/* -------------------------------------------- */

Hooks.once("init", () => {
  const rerender = () => {
    const hud = canvas?.tokens?.hud;
    if (hud?.rendered && hud.object) hud.render();
  };
  game.settings.register(MODULE_ID, "enabled", {
    name: "DXTCM.Settings.Enabled.Name", hint: "DXTCM.Settings.Enabled.Hint",
    scope: "client", config: true, type: Boolean, default: true, onChange: rerender
  });
  game.settings.register(MODULE_ID, "fixedSize", {
    name: "DXTCM.Settings.FixedSize.Name", hint: "DXTCM.Settings.FixedSize.Hint",
    scope: "client", config: true, type: Boolean, default: true, onChange: rerender
  });
});

/* -------------------------------------------- */
/*  Token HUD                                   */
/* -------------------------------------------- */

Hooks.on("renderTokenHUD", (hud, html) => {
  const root = html instanceof HTMLElement ? html : (html?.[0] ?? hud.element);
  if (!root) return;
  state.observer?.disconnect();
  clearTimeout(state.timer);
  root.querySelector(":scope > .dxtcm-menu")?.remove();

  if (!game.settings.get(MODULE_ID, "enabled")) {
    root.classList.remove("dxtcm-active");
    return;
  }
  closeGuestMenu();
  const tokenId = hud.object?.id ?? null;
  if (tokenId !== state.tokenId) resetState(tokenId);
  root.classList.add("dxtcm-active");

  // Build once the other renderTokenHUD hooks have added their buttons, and again whenever
  // a module adds or removes one later.
  schedule(hud, root);
  state.observer = new MutationObserver(mutations => onMutations(hud, root, mutations));
  for (const col of root.querySelectorAll(".col")) {
    state.observer.observe(col, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "hidden", "style"] });
  }
});

Hooks.on("closeTokenHUD", () => {
  if (guest) return;
  state.observer?.disconnect();
  clearTimeout(state.timer);
  resetState(null);
});

// The HUD follows the canvas zoom; keep the menu readable and on screen.
Hooks.on("canvasPan", () => requestAnimationFrame(() => {
  for (const root of [canvas?.tokens?.hud?.element, guest?.root]) {
    const menu = root?.querySelector?.(":scope > .dxtcm-menu");
    if (menu) place(root, menu);
  }
}));

/** The open menu: the players' own one, else the Token HUD's. */
function openMenu() {
  if (guest) return guest;
  const hud = canvas?.tokens?.hud;
  const root = hud?.element;
  if (hud?.object && root?.querySelector?.(":scope > .dxtcm-menu")) return { hud, root };
  return null;
}

// Follow / ride state lives in token flags: rebuild when they change.
Hooks.on("updateToken", (doc, changes) => {
  if (guest && doc.id === guest.token.id && ("x" in changes || "y" in changes || "hidden" in changes)) return closeGuestMenu();
  const open = openMenu();
  if (open && changes.flags) schedule(open.hud, open.root);
});
Hooks.on("deleteToken", doc => { if (guest && doc.id === guest.token.id) closeGuestMenu(); });
Hooks.on("canvasTearDown", () => closeGuestMenu());

/** The user does not own the token: the menu only offers following and riding it. */
function isGuest(hud) {
  return !!hud.guest;
}

function resetState(tokenId) {
  state.tokenId = tokenId;
  state.open = null;
  state.filter = "";
  state.scroll = 0;
  if (!tokenId) {
    state.selected = null;
    return;
  }
  // Right-clicking a token selects it and deselects the others, so take the selection from
  // just before the right-click that opened the menu.
  const fresh = rightDown && Date.now() - rightDown.time < 1500;
  state.selected = fresh ? rightDown.docs : (canvas?.tokens?.controlled ?? []).map(t => t.document);
  rightDown = null;
}

/* -------------------------------------------- */
/*  Right-clicks on the canvas                  */
/* -------------------------------------------- */

const CLICK_PX = 6;      // further than this between press and release is a drag (panning), not a click
const CLICK_MS = 600;

function isBoard(target) {
  const view = canvas?.app?.view ?? canvas?.app?.canvas;
  return !!target && (target === view || target.id === "board");
}

// Capture phase on the document: runs before Foundry sees the press and changes the selection.
document.addEventListener("pointerdown", ev => {
  if (guest && !ev.target?.closest?.("#dxtcm-guest .dxtcm-menu")) closeGuestMenu();
  if (ev.button !== 2 || !isBoard(ev.target) || !canvas?.ready) return;
  rightDown = {
    time: Date.now(), x: ev.clientX, y: ev.clientY,
    docs: (canvas.tokens?.controlled ?? []).map(t => t.document)
  };
}, true);

document.addEventListener("pointerup", ev => {
  if (ev.button !== 2 || !rightDown || !isBoard(ev.target)) return;
  if (Math.hypot(ev.clientX - rightDown.x, ev.clientY - rightDown.y) > CLICK_PX) return;
  if (Date.now() - rightDown.time > CLICK_MS) return;
  if (game.user.isGM || !game.settings.get(MODULE_ID, "enabled") || !canvas.tokens?.active) return;
  const token = tokenAt(ev.clientX, ev.clientY);
  if (!token || token.document.isOwner || !hasGuestEntries(token)) return;
  openGuestMenu(token);
}, true);

document.addEventListener("keydown", ev => {
  if (guest && ev.key === "Escape") closeGuestMenu();
}, true);

/** The topmost visible token under a point on the screen. */
function tokenAt(clientX, clientY) {
  const p = canvas.canvasCoordinatesFromClient?.({ x: clientX, y: clientY })
    ?? canvas.stage.toLocal({ x: clientX, y: clientY });
  const hits = canvas.tokens.placeables.filter(t => t.visible && !t.document.hidden
    && p.x >= t.x && p.x < t.x + t.w && p.y >= t.y && p.y < t.y + t.h);
  hits.sort((a, b) => (a.document.elevation - b.document.elevation) || ((a.document.sort ?? 0) - (b.document.sort ?? 0)));
  return hits.at(-1) ?? null;
}

/* -------------------------------------------- */
/*  The players' menu on tokens they don't own  */
/* -------------------------------------------- */

/**
 * Lives in Foundry's #hud layer, placed over the token like the Token HUD, so it pans and
 * zooms with the canvas. It shows only the Follow / Ride entries.
 */
function openGuestMenu(token) {
  closeGuestMenu();
  const layer = document.getElementById("hud");
  if (!layer) return;
  if (canvas.tokens.hud?.rendered) canvas.tokens.hud.close();
  const root = document.createElement("div");
  root.id = "dxtcm-guest";
  root.className = "dxtcm-active";
  Object.assign(root.style, {
    position: "absolute", left: `${token.x}px`, top: `${token.y}px`,
    width: `${token.w}px`, height: `${token.h}px`, pointerEvents: "none"
  });
  layer.append(root);
  const hud = { object: token, guest: true, close: () => closeGuestMenu() };
  guest = { root, hud, token };
  state.observer?.disconnect();
  resetState(token.id);
  build(hud, root);
}

function closeGuestMenu() {
  if (!guest) return;
  clearTimeout(state.timer);
  guest.root.remove();
  guest = null;
  resetState(null);
}

function schedule(hud, root) {
  clearTimeout(state.timer);
  state.timer = setTimeout(() => build(hud, root), 0);
}

function onMutations(hud, root, mutations) {
  const structural = mutations.some(m => m.type === "childList"
    || (m.type === "attributes" && m.attributeName !== "class"));
  if (structural) return schedule(hud, root);
  // Only classes changed (a button became active or inactive): update the entries in place.
  root.querySelector(":scope > .dxtcm-menu")?._dxtcmSync?.();
}

/* -------------------------------------------- */
/*  Collecting the HUD's buttons                */
/* -------------------------------------------- */

function collect(hud, root) {
  const { entries: extra, replaces } = integrationEntries(hud.object, { selected: state.selected, guest: isGuest(hud) });
  const entries = [];
  if (!isGuest(hud)) {
    for (const el of root.querySelectorAll(BUTTONS)) {
      if (el.closest(".palette") || isHidden(el)) continue;
      if (replaces.some(sel => el.matches(sel))) continue;    // replaced by one of our entries
      const key = el.dataset.palette;
      const palette = key ? root.querySelector(`.palette[data-palette="${CSS.escape(key)}"]`) : null;
      const entry = { el, label: labelOf(el), icon: () => iconOf(el) };
      if (palette) entry.sub = { key: `palette:${key}`, children: () => collectPalette(hud, palette) };
      entries.push(entry);
    }
  }
  return entries.concat(extra);
}

function collectPalette(hud, palette) {
  const all = [...palette.querySelectorAll(PALETTE_ITEMS)];
  return all
    .filter(el => !all.some(o => o !== el && o.contains(el)) && !isHidden(el))
    .map(el => {
      const statusId = el.dataset.statusId ?? null;
      return {
        statusId, label: labelOf(el, statusId), icon: () => iconOf(el),
        isActive: () => el.classList.contains("active"),
        isOverlay: () => el.classList.contains("overlay"),
        run: right => activate(hud, el, statusId, right)
      };
    });
}

function isHidden(el) {
  return el.hidden || el.style.display === "none";
}

/** The description of a button: its tooltip, falling back to whatever else describes it. */
function labelOf(el, statusId = null) {
  const candidates = [
    el.dataset.tooltipText, el.dataset.tooltip, el.getAttribute("aria-label"), el.title, el.getAttribute("alt")
  ];
  if (statusId) {
    const effect = CONFIG.statusEffects?.find(e => e.id === statusId);
    candidates.unshift(effect?.name ?? effect?.label);
  }
  for (const c of candidates) {
    const text = c ? plain(game.i18n.localize(c)) : "";
    if (text) return text;
  }
  const own = el.textContent.trim();
  if (own) return own;
  const action = el.dataset.action;
  if (action) return action.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, s => s.toUpperCase());
  return game.i18n.localize("DXTCM.Menu.Unnamed");
}

function plain(html) {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent.replace(/\s+/g, " ").trim();
}

/** A copy of a button's icon, without the attributes that make it do things. */
function iconOf(el) {
  const src = el.matches("img, svg") ? el : el.querySelector("img, svg, i, [class*='fa-']");
  if (src) {
    const copy = src.cloneNode(true);
    for (const node of [copy, ...copy.querySelectorAll("*")]) {
      for (const attr of [...node.attributes]) {
        if (attr.name === "id" || attr.name === "title" || attr.name.startsWith("data-")) node.removeAttribute(attr.name);
      }
      if (node.tagName === "IMG") node.removeAttribute("class");    // HUD styles like "inactive" dimming
    }
    return copy;
  }
  const fa = [...el.classList].filter(c => c === "fa" || c.startsWith("fa-"));
  return faIcon(fa.length ? fa.join(" ") : "fa-solid fa-circle-dot");
}

function faIcon(cls) {
  const i = document.createElement("i");
  i.className = cls;
  return i;
}

/* -------------------------------------------- */
/*  The menu                                    */
/* -------------------------------------------- */

function build(hud, root) {
  if (!root.isConnected || !root.classList.contains("dxtcm-active")) return;
  root.querySelector(":scope > .dxtcm-menu")?.remove();

  const entries = collect(hud, root);
  if (!entries.length) {
    hud.close?.();
    return;
  }
  if (state.open && !entries.some(e => e.sub?.key === state.open)) state.open = null;

  const menu = document.createElement("nav");
  menu.className = "dxtcm-menu";
  // Keep our clicks and inputs away from the HUD's own form and action handlers.
  for (const type of ["click", "contextmenu", "pointerdown", "mousedown", "dblclick", "input", "change", "keydown", "wheel"]) {
    menu.addEventListener(type, ev => ev.stopPropagation());
  }
  menu.addEventListener("keydown", ev => {
    if (ev.key === "Enter") ev.preventDefault();
  });

  // Players' menu on someone else's token: no name, they may not be meant to see it.
  const name = isGuest(hud) ? null : (hud.object?.document?.name ?? hud.object?.name);
  if (name) {
    const header = document.createElement("header");
    header.className = "dxtcm-header";
    header.textContent = name;
    menu.append(header);
  }

  const list = document.createElement("ul");
  list.className = "dxtcm-list";
  menu.append(list);

  const synced = [];
  for (const entry of entries) {
    const item = makeItem(entry);
    if (entry.el) synced.push([item, () => entry.el.classList.contains("active")]);
    else if (entry.active) synced.push([item, entry.active]);
    if (entry.sub) {
      item.classList.add("has-sub");
      item.append(faIcon("fa-solid fa-caret-right dxtcm-caret"));
      item.addEventListener("click", ev => {
        ev.preventDefault();
        state.open = state.open === entry.sub.key ? null : entry.sub.key;
        state.filter = "";
        state.scroll = 0;
        openSub(menu, item, entry);
      });
    } else {
      item.addEventListener("click", ev => {
        ev.preventDefault();
        if (entry.run) entry.run();
        else press(entry.el, "click");
      });
      item.addEventListener("contextmenu", ev => {
        ev.preventDefault();
        if (entry.el) press(entry.el, "contextmenu");
      });
    }
    const li = document.createElement("li");
    li.append(item);
    list.append(li);
    if (entry.sub && entry.sub.key === state.open) queueMicrotask(() => openSub(menu, item, entry));
  }

  menu._dxtcmSync = () => {
    for (const [item, isActive] of synced) item.classList.toggle("active", !!isActive());
    menu._dxtcmSyncSub?.();
  };
  menu._dxtcmSync();

  root.append(menu);
  place(root, menu);
}

function makeItem({ label, hint, icon }) {
  const item = document.createElement("button");
  item.type = "button";
  item.className = "dxtcm-item";
  const ic = document.createElement("span");
  ic.className = "dxtcm-icon";
  ic.append(icon());
  const text = document.createElement("span");
  text.className = "dxtcm-label";
  text.textContent = label;
  if (hint) {
    const small = document.createElement("small");
    small.className = "dxtcm-who";
    small.textContent = hint;
    text.append(small);
  }
  item.append(ic, text);
  return item;
}

/** Click (or right-click) one of the hidden original buttons. */
function press(el, type) {
  if (!el?.isConnected) return;
  const rect = el.getBoundingClientRect();
  el.dispatchEvent(new MouseEvent(type, {
    bubbles: true, cancelable: true, view: window,
    button: type === "contextmenu" ? 2 : 0, buttons: type === "contextmenu" ? 2 : 1,
    clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2
  }));
}

/* -------------------------------------------- */
/*  Sub-menus (palettes, token pickers)         */
/* -------------------------------------------- */

function openSub(menu, item, entry) {
  menu.querySelector(":scope > .dxtcm-sub")?.remove();
  menu.querySelectorAll(".dxtcm-item.open").forEach(i => i.classList.remove("open"));
  menu._dxtcmSyncSub = null;
  if (state.open !== entry.sub.key) return;
  item.classList.add("open");

  const sub = document.createElement("div");
  sub.className = "dxtcm-sub";
  const children = entry.sub.children();
  const hasStatus = children.some(c => c.statusId);

  let filter = null;
  if (children.length > FILTER_FROM) {
    filter = document.createElement("input");
    filter.type = "search";
    filter.className = "dxtcm-filter";
    filter.placeholder = game.i18n.localize("DXTCM.Menu.Filter");
    filter.value = state.filter;
    sub.append(filter);
  }

  const list = document.createElement("ul");
  list.className = "dxtcm-list";
  sub.append(list);
  const empty = document.createElement("p");
  empty.className = "dxtcm-empty";
  empty.textContent = game.i18n.localize("DXTCM.Menu.Empty");
  sub.append(empty);

  const rows = [];
  for (const child of children) {
    const btn = makeItem(child);
    btn.addEventListener("click", ev => { ev.preventDefault(); child.run(false); });
    btn.addEventListener("contextmenu", ev => { ev.preventDefault(); child.run(true); });
    const li = document.createElement("li");
    li.append(btn);
    list.append(li);
    rows.push({ li, btn, child, text: child.label.toLowerCase() });
  }

  if (hasStatus) {
    const hint = document.createElement("footer");
    hint.className = "dxtcm-hint";
    hint.textContent = game.i18n.localize("DXTCM.Menu.OverlayHint");
    sub.append(hint);
  }

  const applyFilter = () => {
    const q = state.filter.trim().toLowerCase();
    let shown = 0;
    for (const r of rows) {
      const ok = !q || r.text.includes(q);
      r.li.hidden = !ok;
      if (ok) shown++;
    }
    empty.hidden = shown > 0;
  };
  filter?.addEventListener("input", () => { state.filter = filter.value; applyFilter(); });
  list.addEventListener("scroll", () => { state.scroll = list.scrollTop; });

  menu._dxtcmSyncSub = () => {
    for (const r of rows) {
      r.btn.classList.toggle("active", !!r.child.isActive?.());
      r.btn.classList.toggle("overlay", !!r.child.isOverlay?.());
    }
  };
  menu._dxtcmSyncSub();
  applyFilter();

  menu.append(sub);
  placeSub(menu, item, sub);
  list.scrollTop = state.scroll;
  if (filter && state.filter) {
    filter.focus();
    filter.setSelectionRange(filter.value.length, filter.value.length);
  }
}

/** A palette entry: status effects are toggled through the actor, anything else clicks its button. */
async function activate(hud, el, statusId, right) {
  const actor = hud.object?.actor;
  if (statusId && typeof actor?.toggleStatusEffect === "function") {
    try {
      await actor.toggleStatusEffect(statusId, { overlay: right });
    } catch (err) {
      console.error(`${MODULE_ID} | could not toggle status effect ${statusId}`, err);
    }
    return;
  }
  press(el, right ? "contextmenu" : "click");
}

/* -------------------------------------------- */
/*  Placement                                   */
/* -------------------------------------------- */

const MARGIN = 8;

/** Put the menu beside the token, on the side with room, and counter the canvas zoom if wanted. */
function place(root, menu) {
  const zoom = canvas?.stage?.scale?.x || 1;
  const scale = game.settings.get(MODULE_ID, "fixedSize") ? 1 / zoom : 1;
  menu.style.transform = `scale(${scale})`;
  menu.style.top = "0px";
  menu.classList.remove("flip");

  let r = menu.getBoundingClientRect();
  if (r.right > window.innerWidth - MARGIN) {
    menu.classList.add("flip");
    r = menu.getBoundingClientRect();
    if (r.left < MARGIN) {
      menu.classList.remove("flip");
      r = menu.getBoundingClientRect();
    }
  }
  // Shift it up if it runs off the bottom of the screen (screen px -> HUD px).
  const over = r.bottom - (window.innerHeight - MARGIN);
  if (over > 0) menu.style.top = `${-Math.min(over, r.top - MARGIN) / zoom}px`;

  const item = menu.querySelector(".dxtcm-item.open");
  const sub = menu.querySelector(":scope > .dxtcm-sub");
  if (item && sub) placeSub(menu, item, sub);
}

function placeSub(menu, item, sub) {
  sub.classList.toggle("flip", menu.classList.contains("flip"));
  sub.style.top = `${item.offsetTop + item.closest("ul").offsetTop}px`;
  const factor = menu.getBoundingClientRect().height / (menu.offsetHeight || 1);
  let r = sub.getBoundingClientRect();
  if (!sub.classList.contains("flip") && r.right > window.innerWidth - MARGIN) {
    sub.classList.add("flip");
    r = sub.getBoundingClientRect();
  }
  const over = r.bottom - (window.innerHeight - MARGIN);
  if (over > 0) {
    const top = parseFloat(sub.style.top) - Math.min(over, r.top - MARGIN) / (factor || 1);
    sub.style.top = `${top}px`;
  }
}
