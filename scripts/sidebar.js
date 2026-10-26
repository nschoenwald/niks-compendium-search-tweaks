import { getExclusionList, getOwnSettingKey, setPackExcluded } from "./settings.js";

/**
 * Register the compendium sidebar additions:
 * - context menu entries to exclude/include a pack
 * - badges on excluded pack entries
 */
export function registerSidebarUI() {
    Hooks.on("getCompendiumContextOptions", (app, menuItems) => {
        menuItems.push(..._getContextOptions());
    });

    Hooks.on("renderCompendiumDirectory", (app, element) => {
        _addExclusionBadges(element);
    });
}

/**
 * Context menu entries for pack entries. GMs edit the world exclusions,
 * other users their personal exclusions (packs excluded by the GM can't be
 * included again by players).
 * @returns {ContextMenuEntry[]}
 */
function _getContextOptions() {
    const isGM = game.user.isGM;
    const ownList = () => getExclusionList(getOwnSettingKey());
    return [{
        label: isGM ? "NCST.Context.Exclude" : "NCST.Context.ExcludePersonal",
        icon: "fa-solid fa-eye-slash",
        visible: li => !ownList().includes(li.dataset.pack)
            && (isGM || !getExclusionList("excludedPacks").includes(li.dataset.pack)),
        onClick: (event, li) => setPackExcluded(li.dataset.pack, true)
    }, {
        label: isGM ? "NCST.Context.Include" : "NCST.Context.IncludePersonal",
        icon: "fa-solid fa-eye",
        visible: li => ownList().includes(li.dataset.pack),
        onClick: (event, li) => setPackExcluded(li.dataset.pack, false)
    }];
}

/**
 * Add a status icon to every excluded pack entry in the sidebar.
 * @param {HTMLElement} element  The CompendiumDirectory element.
 */
function _addExclusionBadges(element) {
    const world = new Set(getExclusionList("excludedPacks"));
    const personal = new Set(getExclusionList("personalExcludedPacks"));

    for (const li of element.querySelectorAll(".directory-item[data-pack]")) {
        li.querySelector(".ncst-excluded-badge")?.remove();
        const packId = li.dataset.pack;
        const isWorld = world.has(packId);
        if (!isWorld && !personal.has(packId)) continue;

        const label = game.i18n.localize(isWorld ? "NCST.Badge.World" : "NCST.Badge.Personal");
        const badge = document.createElement("i");
        badge.className = `ncst-excluded-badge fa-solid ${isWorld ? "fa-eye-slash" : "fa-user-slash"}`;
        badge.dataset.tooltip = label;
        badge.setAttribute("aria-label", label);
        li.querySelector(".status-icons")?.append(badge);
    }
}
