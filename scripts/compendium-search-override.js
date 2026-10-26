import { MODULE_ID, log } from "./main.js";
import { getExcludedPacks } from "./settings.js";

const DIRECTORY_PATH = "foundry.applications.sidebar.tabs.CompendiumDirectory.prototype";
const INDEX_PATH = "foundry.helpers.DocumentIndex.prototype";

/**
 * Whether a compendium sidebar document search is currently running.
 * Set synchronously around CompendiumDirectory#_matchSearchDocuments.
 * @type {boolean}
 */
let _sidebarSearchActive = false;

/**
 * Register the search override to hide excluded compendium packs from
 * search results.
 *
 * 1. DocumentIndex#lookup: while a sidebar search runs (or always, if the
 *    "excludeFromAllLookups" setting is on), entries from excluded packs
 *    are rejected by the lookup's filterEntries predicate. The core lookup
 *    applies that filter before truncating to its result limit, so excluded
 *    packs never consume result slots.
 *
 * 2. CompendiumDirectory#_matchSearchDocuments: marks the sidebar search as
 *    active for the duration of the (synchronous) core call.
 *
 * 3. CompendiumDirectory#_matchSearchCompendiums: if the
 *    "hideExcludedPackEntries" setting is on, excluded packs are removed from
 *    the set of packs matched by name or folder.
 *
 * Wrapping the base class prototype also covers system subclasses
 * configured via CONFIG.ui.compendium, as long as they don't override
 * these methods without calling super.
 */
export function registerSearchOverride() {
    const targets = [
        [`${DIRECTORY_PATH}._matchSearchDocuments`, _matchSearchDocumentsWrapper],
        [`${DIRECTORY_PATH}._matchSearchCompendiums`, _matchSearchCompendiumsWrapper],
        [`${INDEX_PATH}.lookup`, _lookupWrapper]
    ];
    const missing = targets.filter(([path]) => typeof foundry.utils.getProperty(globalThis, path) !== "function");
    if (missing.length) {
        console.warn(`Nik's Compendium Search Tweaks | ${missing.map(([p]) => p).join(", ")} not found — search override disabled.`);
        return;
    }

    for (const [path, wrapperFn] of targets) _wrap(path, wrapperFn);
    log("Search override registered.");
}

/**
 * Wrap a method via libWrapper if available, otherwise via a direct
 * prototype patch.
 * @param {string} path         Dotted path from globalThis to the method.
 * @param {Function} wrapperFn  Called as wrapperFn(wrapped, ...args) with `this` bound to the instance.
 */
function _wrap(path, wrapperFn) {
    if (globalThis.libWrapper) {
        libWrapper.register(MODULE_ID, path, wrapperFn, "WRAPPER");
        return;
    }
    const lastDot = path.lastIndexOf(".");
    const owner = foundry.utils.getProperty(globalThis, path.slice(0, lastDot));
    const method = path.slice(lastDot + 1);
    const original = owner[method];
    owner[method] = function (...args) {
        return wrapperFn.call(this, original.bind(this), ...args);
    };
}

/**
 * Add a filterEntries predicate rejecting entries from excluded packs.
 * Signature: lookup(query, {limit, documentTypes, ownership, filterEntries})
 */
function _lookupWrapper(wrapped, query, options = {}) {
    if (!_sidebarSearchActive && !game.settings.get(MODULE_ID, "excludeFromAllLookups")) {
        return wrapped(query, options);
    }
    const excluded = getExcludedPacks();
    if (!excluded.size) return wrapped(query, options);

    const filterEntries = options.filterEntries;
    return wrapped(query, {
        ...options,
        filterEntries: e => !excluded.has(e.pack) && (filterEntries?.(e) ?? true)
    });
}

/**
 * Mark the sidebar search as active while the core document matching runs.
 */
function _matchSearchDocumentsWrapper(wrapped, ...args) {
    _sidebarSearchActive = true;
    try {
        return wrapped(...args);
    } finally {
        _sidebarSearchActive = false;
    }
}

/**
 * Remove excluded packs from the set of pack IDs matched by name or folder.
 * Signature: _matchSearchCompendiums(query, packs, folderIds, autoExpandIds, options)
 */
function _matchSearchCompendiumsWrapper(wrapped, query, packs, ...args) {
    const result = wrapped(query, packs, ...args);
    if (!game.settings.get(MODULE_ID, "hideExcludedPackEntries")) return result;
    for (const id of getExcludedPacks()) packs.delete(id);
    return result;
}
