import { MODULE_ID, log } from "./main.js";
import { CompendiumSearchSettings, PersonalSearchSettings } from "./settings-app.js";

/**
 * Re-render the compendium sidebar so an active search and the exclusion
 * badges reflect changed settings.
 */
function _rerenderSidebar() {
    if (ui.compendium?.rendered) ui.compendium.render();
}

/**
 * Register all module settings and settings menus.
 */
export function registerSettings() {

    // World exclusions configured by the GM (pack collection IDs)
    game.settings.register(MODULE_ID, "excludedPacks", {
        scope: "world",
        config: false,
        type: Array,
        default: [],
        onChange: _rerenderSidebar
    });

    // Additional exclusions chosen by each user for themselves
    game.settings.register(MODULE_ID, "personalExcludedPacks", {
        scope: "user",
        config: false,
        type: Array,
        default: [],
        onChange: _rerenderSidebar
    });

    // Package keys ("<packageType>:<packageName>") whose newly added packs are excluded automatically
    game.settings.register(MODULE_ID, "autoExcludePackages", {
        scope: "world",
        config: false,
        type: Array,
        default: []
    });

    // Every pack collection ID seen so far, used to detect newly added packs
    game.settings.register(MODULE_ID, "knownPacks", {
        scope: "world",
        config: false,
        type: Array,
        default: []
    });

    game.settings.register(MODULE_ID, "hideExcludedPackEntries", {
        name: "NCST.Settings.HidePackEntries.Name",
        hint: "NCST.Settings.HidePackEntries.Hint",
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
        onChange: _rerenderSidebar
    });

    game.settings.register(MODULE_ID, "excludeFromAllLookups", {
        name: "NCST.Settings.AllLookups.Name",
        hint: "NCST.Settings.AllLookups.Hint",
        scope: "world",
        config: true,
        type: Boolean,
        default: false
    });

    game.settings.registerMenu(MODULE_ID, "configureExclusions", {
        name: "NCST.Settings.Configure.Name",
        label: "NCST.Settings.Configure.Label",
        hint: "NCST.Settings.Configure.Hint",
        icon: "fas fa-filter",
        type: CompendiumSearchSettings,
        restricted: true
    });

    game.settings.registerMenu(MODULE_ID, "configurePersonalExclusions", {
        name: "NCST.Settings.Personal.Name",
        label: "NCST.Settings.Configure.Label",
        hint: "NCST.Settings.Personal.Hint",
        icon: "fas fa-user-gear",
        type: PersonalSearchSettings,
        restricted: false
    });
}

/* ------------------------------------------------------------------
   Exclusion helpers
   ------------------------------------------------------------------ */

/**
 * The key identifying the package a pack belongs to.
 * @param {CompendiumCollection} pack
 * @returns {string}  e.g. "module:my-module"
 */
export function getPackageKey(pack) {
    const { packageType, packageName } = pack.metadata;
    return `${packageType}:${packageName}`;
}

/**
 * The setting that the current user edits from the sidebar context menu:
 * world exclusions for GMs, personal exclusions for everyone else.
 * @returns {"excludedPacks"|"personalExcludedPacks"}
 */
export function getOwnSettingKey() {
    return game.user.isGM ? "excludedPacks" : "personalExcludedPacks";
}

/**
 * The stored exclusion list for one setting.
 * @param {"excludedPacks"|"personalExcludedPacks"} key
 * @returns {string[]}
 */
export function getExclusionList(key) {
    return game.settings.get(MODULE_ID, key) ?? [];
}

/**
 * All packs excluded for the current user: world exclusions plus personal ones.
 * @returns {Set<string>}
 */
export function getExcludedPacks() {
    return new Set([...getExclusionList("excludedPacks"), ...getExclusionList("personalExcludedPacks")]);
}

/**
 * Add a pack to, or remove it from, the current user's own exclusion list.
 * @param {string} packId
 * @param {boolean} exclude
 */
export async function setPackExcluded(packId, exclude) {
    const key = getOwnSettingKey();
    const list = new Set(getExclusionList(key));
    if (exclude) list.add(packId);
    else list.delete(packId);
    await game.settings.set(MODULE_ID, key, Array.from(list));
}

/**
 * Exclude packs that appeared since the last check and belong to a package
 * with auto-exclusion enabled, then record all current packs as known.
 * Only the active GM writes, so multiple connected GMs don't race.
 */
export async function processAutoExclusions() {
    if (!game.users.activeGM?.isSelf) return;

    const known = new Set(getExclusionList("knownPacks"));
    const newPacks = game.packs.filter(p => !known.has(p.collection));
    if (!newPacks.length) return;

    const auto = new Set(getExclusionList("autoExcludePackages"));
    const toExclude = newPacks.filter(p => auto.has(getPackageKey(p))).map(p => p.collection);

    // Known packs from disabled packages are kept, so re-enabling them doesn't count as new
    for (const pack of newPacks) known.add(pack.collection);
    await game.settings.set(MODULE_ID, "knownPacks", Array.from(known));

    if (toExclude.length) {
        const excluded = new Set([...getExclusionList("excludedPacks"), ...toExclude]);
        await game.settings.set(MODULE_ID, "excludedPacks", Array.from(excluded));
        ui.notifications.info(game.i18n.format("NCST.AutoExcluded", { count: toExclude.length }));
        log(`Auto-excluded ${toExclude.length} new pack(s).`, toExclude);
    }
}
