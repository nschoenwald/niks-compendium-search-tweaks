import { MODULE_ID, log } from "./main.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * ApplicationV2-based settings form for configuring which compendium packs are
 * excluded from the sidebar content search.
 *
 * Lists all available packs grouped by source (System, World, Modules) with
 * checkboxes. Checked = excluded from search results.
 */
export class CompendiumSearchSettings extends HandlebarsApplicationMixin(ApplicationV2) {

    static DEFAULT_OPTIONS = {
        id: "ncst-compendium-search-settings",
        window: {
            title: "NCST.Settings.Title",
            icon: "fas fa-filter",
            resizable: true
        },
        position: {
            width: 520,
            height: 600
        },
        tag: "form",
        form: {
            handler: CompendiumSearchSettings._onSubmitForm,
            closeOnSubmit: true,
            submitOnChange: false
        },
        actions: {
            excludeAll: CompendiumSearchSettings._onExcludeAll,
            includeAll: CompendiumSearchSettings._onIncludeAll
        }
    };

    static PARTS = {
        form: {
            template: "modules/niks-compendium-search-tweaks/templates/settings.hbs"
        }
    };

    /* ------------------------------------------------------------------
       Data Preparation
       ------------------------------------------------------------------ */

    /** @override */
    async _prepareContext(options) {
        const excludedPacks = game.settings.get(MODULE_ID, "excludedPacks") ?? [];
        const groupMap = new Map();

        for (const pack of game.packs) {
            const { packageType, packageName, label, type } = pack.metadata;
            const key = `${packageType}:::${packageName}`;

            if (!groupMap.has(key)) {
                groupMap.set(key, {
                    key,
                    label: this._formatGroupLabel(packageType, packageName),
                    icon: this._groupIcon(packageType),
                    sortOrder: packageType === "system" ? 0 : packageType === "world" ? 1 : 2,
                    packs: []
                });
            }

            groupMap.get(key).packs.push({
                id: pack.collection,
                label,
                type,
                folderPath: this._getFolderPath(pack),
                excluded: excludedPacks.includes(pack.collection)
            });
        }

        // Sort groups: system → world → modules
        const groups = Array.from(groupMap.values()).sort((a, b) => a.sortOrder - b.sortOrder);

        // Alphabetical sort within each group
        for (const group of groups) {
            group.packs.sort((a, b) => a.label.localeCompare(b.label));
        }

        return { groups };
    }

    /**
     * Build a human-readable label for a pack group.
     * @param {string} packageType  "system" | "module" | "world"
     * @param {string} packageName  The package id (e.g. "dnd5e", "my-module")
     * @returns {string}
     */
    _formatGroupLabel(packageType, packageName) {
        if (packageType === "world") {
            return game.i18n.localize("NCST.Settings.Group.World");
        }
        if (packageType === "system") {
            const title = game.system?.title ?? packageName;
            return `${game.i18n.localize("NCST.Settings.Group.System")}: ${title}`;
        }
        // Module — look up human-readable title
        const mod = game.modules.get(packageName);
        const title = mod?.title ?? packageName;
        return `${game.i18n.localize("NCST.Settings.Group.Module")}: ${title}`;
    }

    /**
     * Return a Font Awesome icon class for the group type.
     * @param {string} packageType
     * @returns {string}
     */
    _groupIcon(packageType) {
        switch (packageType) {
            case "system": return "fas fa-dice-d20";
            case "world":  return "fas fa-globe";
            default:       return "fas fa-cube";
        }
    }

    /**
     * Build a breadcrumb string from a pack's folder hierarchy.
     * Walks up the folder chain and joins names with " / ".
     * @param {CompendiumCollection} pack
     * @returns {string|null}  e.g. "Rules / Spells" or null if not in a folder
     */
    _getFolderPath(pack) {
        const parts = [];
        let folder = pack.folder;
        while (folder) {
            parts.unshift(folder.name);
            folder = folder.folder;
        }
        return parts.length ? parts.join(" / ") : null;
    }

    /* ------------------------------------------------------------------
       Post-render — local filter input
       ------------------------------------------------------------------ */

    /** @override */
    _onRender(context, options) {
        super._onRender(context, options);

        const filterInput = this.element.querySelector(".ncst-filter-input");
        if (filterInput) {
            filterInput.addEventListener("input", this._onFilterInput.bind(this));
        }
    }

    /**
     * Client-side filter: hides pack entries whose name does not match the
     * typed query. Also hides groups that end up with zero visible entries.
     * @param {Event} event
     */
    _onFilterInput(event) {
        const query = event.target.value.toLowerCase().trim();
        const entries = this.element.querySelectorAll(".ncst-pack-entry");

        for (const entry of entries) {
            const name = entry.querySelector(".ncst-pack-name")?.textContent.toLowerCase() ?? "";
            entry.style.display = (!query || name.includes(query)) ? "" : "none";
        }

        // Hide groups with no visible entries
        const groups = this.element.querySelectorAll(".ncst-group");
        for (const group of groups) {
            const visible = group.querySelectorAll('.ncst-pack-entry:not([style*="display: none"])');
            group.style.display = visible.length ? "" : "none";
        }
    }

    /* ------------------------------------------------------------------
       Actions
       ------------------------------------------------------------------ */

    /**
     * Check all pack checkboxes (exclude all).
     */
    static _onExcludeAll() {
        const checkboxes = this.element.querySelectorAll('input[type="checkbox"][data-pack-id]');
        for (const cb of checkboxes) cb.checked = true;
    }

    /**
     * Uncheck all pack checkboxes (include all).
     */
    static _onIncludeAll() {
        const checkboxes = this.element.querySelectorAll('input[type="checkbox"][data-pack-id]');
        for (const cb of checkboxes) cb.checked = false;
    }

    /* ------------------------------------------------------------------
       Form Submission
       ------------------------------------------------------------------ */

    /**
     * Persist the exclusion list on form submit.
     * Reads directly from the DOM instead of FormDataExtended to avoid
     * issues with dotted pack collection IDs being interpreted as nested
     * object paths.
     *
     * @param {SubmitEvent} event
     * @param {HTMLFormElement} form
     * @param {FormDataExtended} formData
     */
    static async _onSubmitForm(event, form, formData) {
        const excluded = [];
        const checkboxes = form.querySelectorAll('input[type="checkbox"][data-pack-id]');
        for (const cb of checkboxes) {
            if (cb.checked) excluded.push(cb.dataset.packId);
        }
        await game.settings.set(MODULE_ID, "excludedPacks", excluded);
        ui.notifications.info(game.i18n.localize("NCST.Settings.Saved"));
        log(`Saved ${excluded.length} excluded pack(s).`);
    }
}
