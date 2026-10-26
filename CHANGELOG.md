# Changelog

All notable changes to this project will be documented in this file.

## [14.1.0] - 2026-10-26
### Added
- **Right-click to exclude**: Right-click a compendium in the sidebar to exclude it from search (or include it again) without opening the settings.
- **Exclusion badges**: Excluded compendiums show a small icon in the sidebar so you can see why their contents don't appear in search.
- **Personal exclusions for players**: Every user can now hide extra compendiums from their own search via **My Search Exclusions** in Module Settings or the right-click menu. Compendiums the GM excluded for everyone stay excluded.
- **Exclude whole sources at once**: Each group in the settings form (system, world, or module) has a checkbox that toggles all of its packs.
- **Auto-exclude new packs**: Per source, you can choose to automatically exclude packs that get added later, for example by a module update.
- **Hide excluded packs while searching** (setting): Choose whether excluded compendiums themselves are hidden during a search when their name matches. On by default, as before.
- **Exclude from other lookups** (setting): Optionally apply your exclusions to other places that search Foundry's document index, such as the link suggestions in journal editors.
- **Counter and cleanup**: The settings form shows how many packs are excluded and offers to remove leftover exclusions for compendiums that are no longer installed.

### Fixed
- **Search results**: Excluded compendiums no longer use up the sidebar's limited number of search results, so you now get the full set of results from the packs you care about. Results from excluded packs also no longer flash up briefly before disappearing.
- **Searching inside an excluded compendium**: Full-text search inside an excluded compendium's own window works again.
- **Saving settings**: Exclusions for compendiums from a currently disabled module are no longer lost when you save the settings form.
- **Live updates**: Changing exclusions now updates an active sidebar search immediately.
- **Dark mode**: Text and borders in the settings form are now readable in both light and dark themes.

### Changed
- **Bulk actions**: "Exclude All" and "Include All" now only affect the packs currently shown by the filter.
- **Settings form**: Module groups are sorted alphabetically, document types are shown in your language, and the filter also matches folder and source names.

## [14.0.1] - 2026-07-25
### Fixed
- **Release Workflow**: Added `templates` directory to `Create Module Archive` step in `.github/workflows/release.yml` so that `settings.hbs` template is included in released module zips.
- **Release Workflow**: Updated workflow `jq` transformation to set both `.version` and `.download` in `module.json`.
- **Manifest Relationships**: Fixed invalid `optional` key in `relationships` schema to `recommends` for libWrapper dependency.

## [14.0.0] - 2026-07-07
### Added
- Initial release.
- **Compendium Search Exclusions**: Allows GMs to configure which compendium packs are excluded from the native V14 sidebar content search. Excluded packs remain visible in the sidebar but their contents are hidden from search results.
- **ApplicationV2 Settings Form**: Dedicated configuration form listing all available packs, grouped by source (System, World, Modules), with checkboxes, a local filter input, and Exclude All / Include All bulk actions.
- **libWrapper soft dependency**: Uses libWrapper for method patching when available, falls back to direct prototype override otherwise.
