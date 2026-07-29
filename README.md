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

## Other Modules by Nik

### 🎲 D&D 5e Specific
* **[Nik's DnD5e Tweaks](https://github.com/nschoenwald/niks-dnd5e-tweaks)** – Consolidated collection of quality-of-life enhancements and combat automation tweaks for DnD5e.

### ⚔️ Combat & Token Tools
* **[Nik's Token Tags](https://github.com/nschoenwald/niks-token-tags)** – Automatically numbers duplicate combatant NPCs (A, B, C…) with color-coded letter overlays.
* **[Nik's Shared NPC Initiative](https://github.com/nschoenwald/niks-shared-npc-initiative)** – Groups NPCs of the same type in combat so they share a single initiative roll.
* **[Nik's Movement Control](https://github.com/nschoenwald/niks-movement-control)** – GM controls to toggle player movement and automatically restrict/allow movement on combat start and end.
* **[Nik's Tiny Change Logs](https://github.com/nschoenwald/niks-tiny-changelogs)** – Compact, single-line chat messages logging token HP and Temp HP changes.

### 🎲 Visuals & Display
* **[Nik's Dynamic Roll Area](https://github.com/nschoenwald/niks-dynamic-roll-area)** – Dynamically restricts Dice So Nice 3D dice rolling area to exclude the sidebar / chat log across all screen resolutions and window sizes.

### ⚙️ Utilities & System Management
* **[Nik's Settings Locks](https://github.com/nschoenwald/niks-settings-locks)** – Soft-lock and hard-lock client settings and keybindings across all connected players.
* **[Nik's Show & Tell](https://github.com/nschoenwald/niks-show-and-tell)** – Share popout images to chat and paste image files directly into chat messages.
* **[Nik's Zoom / Pan Options](https://github.com/nschoenwald/niks-zoom-pan-options)** – Touchpad and scroll wheel pan/zoom controls and canvas navigation enhancements.
