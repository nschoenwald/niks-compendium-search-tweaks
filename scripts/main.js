import { registerSearchOverride } from "./compendium-search-override.js";
import { processAutoExclusions, registerSettings } from "./settings.js";
import { registerSidebarUI } from "./sidebar.js";

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
    registerSettings();

    // Wrap CompendiumDirectory search and DocumentIndex lookups
    registerSearchOverride();

    // Context menu toggle and exclusion badges in the compendium sidebar
    registerSidebarUI();
});

Hooks.once("ready", () => {
    processAutoExclusions();
});
