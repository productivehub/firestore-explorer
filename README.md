# Firestore Explorer

Browse, edit, and query Firestore databases directly from VS Code — no more tab-hopping between your editor and the Firebase console.

## Features

- **Multiple connections** — emulator and production projects side-by-side in the activity bar
- **Collection browser** — paginated table view with configurable page size and auto-detected columns
- **Column management** — toggle visibility and reorder columns on the fly
- **JSON view** — switch any collection between table and raw JSON
- **Document editor** — edit documents inline as JSON with validation
- **Sub-collection navigation** — breadcrumb-driven drill-down through nested paths
- **Visual query builder** — compose `where` / `orderBy` / `limit` clauses with bidirectional JavaScript sync
- **Saved queries** — persist queries as `.js` files you can version-control alongside your project
- **Loading indicators** — live status and spinners while large collections stream in

## Installation

Install from the VS Code Marketplace:

1. Open the **Extensions** view (`⇧⌘X` / `Ctrl+Shift+X`)
2. Search for **Firestore Explorer**
3. Click **Install**

Or from the command line:

```bash
code --install-extension productivehub.firestore-explorer
```

## Quick Start

1. Open the **Firestore Explorer** view from the activity bar (the red + gray leaves icon).
2. Click the **+** in the Connections panel to add your first connection — pick either **emulator** or **production**.
3. Click the connection to connect. Your collections appear as children.
4. Click a collection to open it in an editor tab — browse documents in table or JSON view.
5. Click any row to edit that document, or open the **Query Builder** from the toolbar.

## Connections

Connections live in the `firestoreExplorer.connections` setting. You can add them through the UI or edit your workspace / user `settings.json` directly.

### Emulator

```json
{
  "firestoreExplorer.connections": [
    {
      "name": "local-emulator",
      "type": "emulator",
      "host": "localhost",
      "port": 8080,
      "projectId": "my-project"
    }
  ]
}
```

`projectId` is optional — if omitted, an auto-generated id is used.

### Production (service account)

Point `serviceAccountPath` at a Firebase service account JSON file. Relative paths are resolved against your workspace root, so you can keep the key next to your project (for example, in a gitignored `.secrets/` folder).

```json
{
  "firestoreExplorer.connections": [
    {
      "name": "prod",
      "type": "production",
      "serviceAccountPath": ".secrets/service-account.json"
    }
  ]
}
```

> ⚠️ **Never commit service account keys.** Add `.secrets/` (or wherever you store your key) to your `.gitignore`.

### Mixing connections

You can declare any number of emulator and production connections in the same array — they'll all appear in the Firestore Explorer sidebar and can be connected or disconnected independently.

## Saved Queries

Queries you build in the query builder are saved as JavaScript files in `.firestore/queries/` at your workspace root. They appear under the **Saved Queries** sidebar view and can be reopened, edited, and re-run anytime. Because they're plain `.js` files, you can commit them to version control and share query snippets with your team.

## Commands

All commands are available via the command palette (`⇧⌘P` / `Ctrl+Shift+P`):

| Command | Description |
|---|---|
| `Firestore: Add Connection` | Add a new emulator or production connection |
| `Firestore: Connect` | Connect to a configured database |
| `Firestore: Disconnect` | Disconnect from a database |
| `Firestore: Remove Connection` | Delete a connection from settings |
| `Firestore: Open Collection` | Open a collection in a new editor tab |
| `Firestore: Open Query Builder` | Launch the visual query builder |
| `Firestore: Refresh Connections` | Refresh the sidebar tree |

## Table Keyboard Navigation

Click any cell to select it, then navigate with the keyboard:

| Key | Action |
|---|---|
| `Arrow keys` | Move between cells |
| `Home` | Jump to first cell (ID) in current row |
| `End` | Jump to last cell in current row |
| `Ctrl/⌘ + Home` | Jump to first cell in table |
| `Ctrl/⌘ + End` | Jump to last cell in table |
| `Ctrl/⌘ + ↑/↓` | Jump to first/last row |
| `Ctrl/⌘ + ←/→` | Scroll viewport one screen left/right |
| `Tab` / `Shift+Tab` | Next/previous cell (wraps across rows) |
| `PageUp` / `PageDown` | Move 10 rows up/down |
| `Enter` | Open document (when ID cell is selected) |
| `Escape` | Clear selection |

## Requirements

- VS Code **1.85** or later
- A Firestore database — either a local emulator or a Firebase project with a service account

## Known Issues & Feedback

Found a bug or have a feature request? Please [open an issue](https://github.com/productivehub/firestore-explorer/issues) on GitHub.

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, project layout, and how to submit pull requests.

## License

[MIT](LICENSE) © ProductiveHub
