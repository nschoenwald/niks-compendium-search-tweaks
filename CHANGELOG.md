# Changelog

All notable changes to this project will be documented in this file.

## [14.0.0] - 2026-07-07
### Added
- Initial release.
- **Compendium Search Exclusions**: Allows GMs to configure which compendium packs are excluded from the native V14 sidebar content search. Excluded packs remain visible in the sidebar but their contents are hidden from search results.
- **ApplicationV2 Settings Form**: Dedicated configuration form listing all available packs, grouped by source (System, World, Modules), with checkboxes, a local filter input, and Exclude All / Include All bulk actions.
- **libWrapper soft dependency**: Uses libWrapper for method patching when available, falls back to direct prototype override otherwise.
