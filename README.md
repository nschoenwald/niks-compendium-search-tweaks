# Nik's Compendium Search Tweaks

A lightweight Foundry VTT module that lets GMs configure which compendium packs are excluded from the native V14 sidebar content search.

Foundry V14 upgraded the Compendium sidebar tab's filter to search **within** each compendium's contents — a great feature, but with many installed modules and systems it can produce noisy results from packs that are irrelevant to your game. This module lets you selectively exclude packs from those search results while keeping them fully accessible in the sidebar.

---

## Compatibility

| | Minimum | Verified |
|---|---|---|
| **Foundry VTT** | V14 | V14 |

This module is **system-agnostic** — it works with any game system.

**Optional dependency:** [libWrapper](https://foundryvtt.com/packages/lib-wrapper) — used if available for cleaner method patching. Falls back to a direct prototype override if not installed.

---

## Features

### Compendium Search Exclusions

Configure which compendium packs are excluded from the sidebar content search via a dedicated settings form:

- **Grouped pack list** — packs are organized by source (System, World, Modules) with human-readable package titles
- **Local filter** — quickly find specific packs in long lists
- **Bulk actions** — "Exclude All" / "Include All" buttons for fast configuration
- **Visual feedback** — excluded packs are dimmed with strikethrough in the settings form
- **Non-destructive** — excluded packs remain fully visible and accessible in the sidebar when no search is active; they are only hidden from search results

### How to Configure

1. Go to **Settings → Module Settings → Nik's Compendium Search Tweaks**
2. Click the **Configure** button
3. Check the compendium packs you want to exclude from search
4. Click **Save Changes**

---

## Installation

### Via Manifest URL

1. In Foundry VTT, go to **Settings → Manage Modules → Install Module**
2. Paste the following manifest URL:
   ```
   https://github.com/nschoenwald/niks-compendium-search-tweaks/releases/latest/download/module.json
   ```
3. Click **Install**

### Manual

1. Download the latest release from the [Releases](https://github.com/nschoenwald/niks-compendium-search-tweaks/releases) page
2. Extract into your Foundry VTT `Data/modules/` directory
3. Enable the module in **Settings → Manage Modules**

---

## License

This module is licensed under the [MIT License](LICENSE).
