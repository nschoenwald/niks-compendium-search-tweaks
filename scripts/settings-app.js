import { MODULE_ID, log } from "./main.js";
import { getExclusionList, getPackageKey } from "./settings.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

const CHECKBOX_SELECTOR = 'input[type="checkbox"][data-pack-id]';

/**
 * ApplicationV2-based settings form for configuring which compendium packs are
 * excluded from the sidebar content search.
 *
 * Lists all available packs grouped by source (System, World, Modules) with
 * checkboxes. Checked = excluded from search results.
 *
 * This class edits the world exclusions (GM only). PersonalSearchSettings
 * edits the current user's personal exclusions.
 */
export class CompendiumSearchSettings extends HandlebarsApplicationMixin(ApplicationV2) {

    /**
     * The setting this form edits.
     * @type {"excludedPacks"|"personalExcludedPacks"}
     */
    static SETTING = "excludedPacks";

    /**
     * Whether this form edits personal exclusions.
     * @type {boolean}
     */
    static PERSONAL = false;

    static DEFAULT_OPTIONS = {
        id: "ncst-compendium-search-settings",
        window: {
            title: "NCST.Settings.Title",
            icon: "fas fa-filter",
            resizable: true
        },
        position: {
            width: 560,
            height: 640
        },
        tag: "form",
        form: {
            handler: CompendiumSearchSettings._onSubmitForm,
            closeOnSubmit: true,
            submitOnChange: false
        },
        actions: {
            excludeAll: CompendiumSearchSettings._onExcludeAll,
            includeAll: CompendiumSearchSettings._onIncludeAll,
            removeStale: CompendiumSearchSettings._onRemoveStale
        }
    };

    static PARTS = {
        form: {
            template: "modules/niks-compendium-search-tweaks/templates/settings.hbs"
        }
    };

    /**
     * Whether exclusions for packs that are no longer installed should be
     * dropped on save.
     * @type {boolean}
     */
    _dropStale = false;

    /* ------------------------------------------------------------------
       Data Preparation
       ------------------------------------------------------------------ */

    /** @override */
    async _prepareContext(options) {
        const { SETTING, PERSONAL } = this.constructor;
        const stored = getExclusionList(SETTING);
        const excluded = new Set(stored);
        const locked = new Set(PERSONAL ? getExclusionList("excludedPacks") : []);
        const auto = new Set(PERSONAL ? [] : getExclusionList("autoExcludePackages"));
        const groupMap = new Map();

        for (const pack of game.packs) {
            if (PERSONAL && !pack.visible) continue;
            const { packageType, packageName, type } = pack.metadata;
            const key = getPackageKey(pack);

            if (!groupMap.has(key)) {
                const label = this._formatGroupLabel(packageType, packageName);
                groupMap.set(key, {
                    key,
                    label,
                    icon: this._groupIcon(packageType),
                    sortOrder: packageType === "system" ? 0 : packageType === "world" ? 1 : 2,
                    autoExclude: auto.has(key),
                    packs: []
                });
            }

            const group = groupMap.get(key);
            const folderPath = this._getFolderPath(pack);
            group.packs.push({
                id: pack.collection,
                label: pack.title,
                type: this._localizeType(type),
                folderPath,
                excluded: excluded.has(pack.collection) || locked.has(pack.collection),
                locked: locked.has(pack.collection),
                search: [pack.title, folderPath, group.label].filterJoin(" ").toLowerCase()
            });
        }

        // Sort groups: system → world → modules (alphabetically by title)
        const groups = Array.from(groupMap.values())
            .sort((a, b) => (a.sortOrder - b.sortOrder) || a.label.localeCompare(b.label));

        // Alphabetical sort within each group
        for (const group of groups) {
            group.packs.sort((a, b) => a.label.localeCompare(b.label));
        }

        return {
            groups,
            personal: PERSONAL,
            description: PERSONAL ? "NCST.Settings.PersonalDescription" : "NCST.Settings.Description",
            staleCount: stored.filter(id => !game.packs.has(id)).length
        };
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
     * Localized name of a pack's document type, e.g. "Actor" → "Actor" in the
     * current language.
     * @param {string} type
     * @returns {string}
     */
    _localizeType(type) {
        const label = CONFIG[type]?.documentClass?.metadata?.label;
        return label ? game.i18n.localize(label) : type;
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
       Post-render — local filter, group toggles, summary
       ------------------------------------------------------------------ */

    /** @override */
    async _onFirstRender(context, options) {
        await super._onFirstRender(context, options);

        // The form element persists across re-renders, so bind delegated listeners once
        this.element.addEventListener("change", this._onChangeCheckbox.bind(this));
    }

    /** @override */
    async _onRender(context, options) {
        await super._onRender(context, options);

        this.element.querySelector(".ncst-filter-input")
            ?.addEventListener("input", this._onFilterInput.bind(this));
        this._refreshState();
    }

    /**
     * Client-side filter: hides pack entries whose name, folder path or group
     * label does not match the typed query. Also hides groups that end up
     * with zero visible entries.
     * @param {Event} event
     */
    _onFilterInput(event) {
        const query = event.target.value.toLowerCase().trim();

        for (const entry of this.element.querySelectorAll(".ncst-pack-entry")) {
            entry.hidden = !!query && !entry.dataset.search.includes(query);
        }

        // Hide groups with no visible entries
        for (const group of this.element.querySelectorAll(".ncst-group")) {
            group.hidden = !group.querySelector(".ncst-pack-entry:not([hidden])");
        }
        this._refreshState();
    }

    /**
     * Handle a group checkbox toggling all of its (visible, editable) packs,
     * and keep the group states and summary up to date for any change.
     * @param {Event} event
     */
    _onChangeCheckbox(event) {
        const target = event.target;
        if (target.matches(".ncst-group-checkbox")) {
            const group = target.closest(".ncst-group");
            this._setVisibleChecked(target.checked, group);
        }
        if (target.matches(`.ncst-group-checkbox, ${CHECKBOX_SELECTOR}`)) this._refreshState();
    }

    /**
     * Set the checked state of every editable pack checkbox that is not
     * hidden by the local filter.
     * @param {boolean} checked
     * @param {HTMLElement} [root]  Limit to this element (defaults to the whole form).
     */
    _setVisibleChecked(checked, root = this.element) {
        const selector = `.ncst-pack-entry:not([hidden]) ${CHECKBOX_SELECTOR}:not(:disabled)`;
        for (const cb of root.querySelectorAll(selector)) cb.checked = checked;
    }

    /**
     * Update each group checkbox (checked / indeterminate) and the
     * "X of Y packs excluded" summary.
     */
    _refreshState() {
        for (const group of this.element.querySelectorAll(".ncst-group")) {
            const boxes = group.querySelectorAll(`.ncst-pack-entry:not([hidden]) ${CHECKBOX_SELECTOR}`);
            const checked = Array.from(boxes).filter(cb => cb.checked).length;
            const groupBox = group.querySelector(".ncst-group-checkbox");
            if (!groupBox) continue;
            groupBox.checked = boxes.length > 0 && checked === boxes.length;
            groupBox.indeterminate = checked > 0 && checked < boxes.length;
            groupBox.disabled = !group.querySelector(`.ncst-pack-entry:not([hidden]) ${CHECKBOX_SELECTOR}:not(:disabled)`);
        }

        const summary = this.element.querySelector(".ncst-count");
        if (summary) {
            const all = this.element.querySelectorAll(CHECKBOX_SELECTOR);
            const excluded = Array.from(all).filter(cb => cb.checked).length;
            summary.textContent = game.i18n.format("NCST.Settings.Count", { excluded, total: all.length });
        }
    }

    /* ------------------------------------------------------------------
       Actions
       ------------------------------------------------------------------ */

    /**
     * Check all visible pack checkboxes (exclude all).
     */
    static _onExcludeAll() {
        this._setVisibleChecked(true);
        this._refreshState();
    }

    /**
     * Uncheck all visible pack checkboxes (include all).
     */
    static _onIncludeAll() {
        this._setVisibleChecked(false);
        this._refreshState();
    }

    /**
     * Mark exclusions for uninstalled packs for removal on save.
     * @param {PointerEvent} event
     * @param {HTMLElement} target
     */
    static _onRemoveStale(event, target) {
        this._dropStale = true;
        const note = document.createElement("span");
        note.className = "ncst-stale-note";
        note.textContent = game.i18n.localize("NCST.Settings.StaleRemoved");
        target.replaceWith(note);
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
     * Exclusions for packs without an editable checkbox (e.g. from a
     * temporarily disabled module, packs a player can't see, or packs also
     * excluded by the GM) are kept, unless the user chose to remove
     * exclusions for uninstalled packs.
     *
     * @param {SubmitEvent} event
     * @param {HTMLFormElement} form
     * @param {FormDataExtended} formData
     */
    static async _onSubmitForm(event, form, formData) {
        const { SETTING, PERSONAL } = this.constructor;
        const checkboxes = form.querySelectorAll(`${CHECKBOX_SELECTOR}:not(:disabled)`);
        const editable = new Set(Array.from(checkboxes, cb => cb.dataset.packId));

        const excluded = getExclusionList(SETTING)
            .filter(id => !editable.has(id) && (!this._dropStale || game.packs.has(id)));
        for (const cb of checkboxes) {
            if (cb.checked) excluded.push(cb.dataset.packId);
        }

        if (!PERSONAL) {
            const auto = Array.from(form.querySelectorAll("input[data-auto-key]:checked"), cb => cb.dataset.autoKey);
            await game.settings.set(MODULE_ID, "autoExcludePackages", auto);

            // Packs present now are not "new" for auto-exclusion
            const known = new Set([...getExclusionList("knownPacks"), ...game.packs.keys()]);
            await game.settings.set(MODULE_ID, "knownPacks", Array.from(known));
        }

        await game.settings.set(MODULE_ID, SETTING, excluded);
        ui.notifications.info(game.i18n.localize("NCST.Settings.Saved"));
        log(`Saved ${excluded.length} excluded pack(s) to ${SETTING}.`);
    }
}

/**
 * Settings form for the current user's personal exclusions. Packs excluded by
 * the GM are shown checked and locked; only packs the user can see are listed.
 */
export class PersonalSearchSettings extends CompendiumSearchSettings {

    static SETTING = "personalExcludedPacks";

    static PERSONAL = true;

    static DEFAULT_OPTIONS = {
        id: "ncst-personal-search-settings",
        window: {
            title: "NCST.Settings.PersonalTitle",
            icon: "fas fa-user-gear"
        }
    };
}
