import { MODULE_ID, log } from "./main.js";

/**
 * Register the search override to hide excluded compendium packs from
 * sidebar search results.
 *
 * Uses two complementary strategies:
 *
 * 1. Data-level: Wraps CompendiumCollection.prototype.search so that
 *    excluded packs return no matches. This prevents results from
 *    appearing regardless of how the UI renders them.
 *
 * 2. DOM-level: After the compendium sidebar renders, attaches an input
 *    listener on the search bar that post-processes the DOM to hide any
 *    excluded pack elements that slipped through (e.g. name-only matches
 *    that bypass .search()).
 */
export function registerSearchOverride() {
    _wrapPackSearch();
    _setupSidebarHooks();
    log("Search override registered.");
}

/* ------------------------------------------------------------------
   Strategy 1 — Data-level: wrap CompendiumCollection.prototype.search
   ------------------------------------------------------------------ */

/**
 * Wrap the search method on CompendiumCollection so excluded packs
 * return an empty result set.  Works regardless of how the calling UI
 * renders the results (async or sync, ApplicationV1 or V2).
 */
function _wrapPackSearch() {
    // Guard: search method might not exist in every Foundry build
    if (typeof CompendiumCollection?.prototype?.search !== "function") {
        log("CompendiumCollection.prototype.search not found — skipping data-level override.");
        return;
    }

    const wrapperFn = function (wrapped, ...args) {
        const excludedPacks = game.settings.get(MODULE_ID, "excludedPacks");
        if (excludedPacks?.includes(this.collection)) {
            return [];
        }
        return wrapped(...args);
    };

    if (globalThis.libWrapper) {
        libWrapper.register(
            MODULE_ID,
            "CompendiumCollection.prototype.search",
            wrapperFn,
            "MIXED"
        );
        log("Wrapped CompendiumCollection.search via libWrapper.");
    } else {
        const original = CompendiumCollection.prototype.search;
        CompendiumCollection.prototype.search = function (...args) {
            return wrapperFn.call(this, original.bind(this), ...args);
        };
        log("Wrapped CompendiumCollection.search via direct prototype patch.");
    }
}

/* ------------------------------------------------------------------
   Strategy 2 — DOM-level: post-process the sidebar after search
   ------------------------------------------------------------------ */

/**
 * Hook into CompendiumDirectory render events (Application v1 and V2)
 * and attach a debounced input listener on the search bar.
 * After the core search updates the DOM we hide any excluded pack
 * elements that are still visible.
 */
function _setupSidebarHooks() {
    Hooks.on("renderCompendiumDirectory", (app, html) => {
        const el = html instanceof HTMLElement ? html : html[0] ?? html;
        _attachSearchListener(el);
    });

    // ApplicationV2 emits a different hook in V14
    Hooks.on("renderApplicationV2", (app, html) => {
        if (app === ui.compendium || app.id === "compendium"
            || app.constructor?.name === "CompendiumDirectory") {
            const el = html instanceof HTMLElement ? html : html[0] ?? html;
            _attachSearchListener(el);
        }
    });
}

/**
 * Find the search input inside the compendium sidebar and attach a
 * debounced listener that hides excluded packs after each keystroke.
 * The debounce is intentionally longer than Foundry's default search
 * debounce (~200 ms) so we run *after* the core search has finished
 * updating the DOM.
 */
function _attachSearchListener(element) {
    if (!element) return;

    const searchInput = element.querySelector('input[type="search"]')
        || element.querySelector('input[name="search"]')
        || element.querySelector(".header-search input");
    if (!searchInput || searchInput.dataset.ncstBound) return;
    searchInput.dataset.ncstBound = "true";

    const processResults = foundry.utils.debounce(() => {
        _hideExcludedPacks(element, searchInput.value);
    }, 200);

    searchInput.addEventListener("input", processResults);
    log("Attached search listener to compendium sidebar.");
}

/**
 * Walk the compendium sidebar DOM and hide search result entries that
 * belong to excluded packs.  Only runs when there is an active search
 * query — excluded packs remain fully visible in the unfiltered sidebar.
 *
 * V14 search result structure (per result):
 *   <li class="directory-item document-match" data-uuid="Compendium.dnd5e.monsters.Actor.xxx">
 *       <a class="pack" data-pack="dnd5e.monsters"> …pack info… </a>
 *   </li>
 *
 * We use two complementary selectors:
 *   1. [data-pack] child links  → walk up to the parent .directory-item
 *   2. [data-uuid] on the <li>  → extract the pack collection from the UUID
 */
function _hideExcludedPacks(element, query) {
    if (!query?.trim()) return;

    const excludedPacks = game.settings.get(MODULE_ID, "excludedPacks");
    if (!excludedPacks?.length) return;

    const hidden = new Set();

    // Strategy A: find [data-pack] child links and hide their parent entry
    for (const link of element.querySelectorAll("[data-pack]")) {
        const packId = link.dataset.pack;
        if (packId && excludedPacks.includes(packId)) {
            const entry = link.closest(".directory-item") || link.parentElement;
            if (entry && !hidden.has(entry)) {
                entry.style.display = "none";
                hidden.add(entry);
            }
        }
    }

    // Strategy B: check data-uuid on result entries directly
    // UUID format: Compendium.<moduleId>.<packName>.<docType>.<docId>
    // Pack collection = "<moduleId>.<packName>"
    for (const entry of element.querySelectorAll(".directory-item[data-uuid]")) {
        if (hidden.has(entry)) continue;
        const uuid = entry.dataset.uuid;
        if (!uuid?.startsWith("Compendium.")) continue;

        const parts = uuid.split(".");
        if (parts.length >= 4) {
            const packCollection = `${parts[1]}.${parts[2]}`;
            if (excludedPacks.includes(packCollection)) {
                entry.style.display = "none";
                hidden.add(entry);
            }
        }
    }

    if (hidden.size > 0) {
        log(`Hidden ${hidden.size} excluded result(s) from search.`);
    }
}

