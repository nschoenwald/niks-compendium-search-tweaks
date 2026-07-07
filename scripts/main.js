import { registerSearchOverride } from "./compendium-search-override.js";
import { CompendiumSearchSettings } from "./settings-app.js";

export const MODULE_ID = "niks-compendium-search-tweaks";

/**
 * Logging helper.
 */
export function log(message, ...args) {
    console.log(`Nik's Compendium Search Tweaks | ${message}`, ...args);
}

/* -------------------------------------------------------
   Initialization
   ------------------------------------------------------- */

Hooks.once("init", () => {

    // Hidden setting: stores the array of excluded compendium pack collection IDs
    game.settings.register(MODULE_ID, "excludedPacks", {
        scope: "world",
        config: false,
        type: Array,
        default: []
    });

    // Settings menu button that opens the configuration form
    game.settings.registerMenu(MODULE_ID, "configureExclusions", {
        name: "NCST.Settings.Configure.Name",
        label: "NCST.Settings.Configure.Label",
        hint: "NCST.Settings.Configure.Hint",
        icon: "fas fa-filter",
        type: CompendiumSearchSettings,
        restricted: true
    });

    // Patch CompendiumDirectory search
    registerSearchOverride();
});
