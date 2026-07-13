# Privacy Policy

**Last updated: 2026-07-13**

Website Stickies ("the extension") does not collect, transmit, or sell any user data. This document explains what the extension stores and why.

## What is stored

- **Your notes** — the text you write, the highlighted passage it's attached to, and its position on the page.
- **Your language preference** — which UI language you've selected.

All of this is saved with the browser's built-in `chrome.storage.local` API. It stays on your device, inside your browser profile, and is never sent to any server — the extension makes no network requests at all.

## What is not collected

- No analytics or usage tracking.
- No account, sign-in, or personal identifiers.
- No browsing history beyond the page a note was created on (needed only to show that note again when you revisit the page).

## Permissions

| Permission | Why it's needed |
| --- | --- |
| `contextMenus` | Adds the "Add Note" right-click menu item. |
| `storage` | Saves notes and your language preference locally. |
| `activeTab` / `scripting` | Injects the note card into the page you're currently on when you choose "Add Note". |
| `host_permissions: <all_urls>` | Lets notes and the note-restoring content script run on any site you choose to use the extension on. |

## Data deletion

Deleting a note (via its delete button or the dashboard) removes it immediately and permanently from local storage. Uninstalling the extension removes all stored data.

## Changes to this policy

If this policy changes, the update will be reflected in this file and in the extension's [changelog](README.md).

## Contact

Questions can be raised via [GitHub Issues](https://github.com/merve/sticky-notes/issues).
