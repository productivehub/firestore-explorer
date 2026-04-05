# Contributing to Firestore Explorer

Thanks for your interest in contributing! This document describes how to get set up, propose changes, and report issues.

## Code of Conduct

Be kind, be constructive, and assume good intent. Harassment or personal attacks will not be tolerated.

## Getting Started

### Prerequisites

- Node.js 20+
- VS Code 1.85+
- A Firestore emulator or service account for testing

### Setup

```bash
git clone https://github.com/productivehub/firestore-explorer.git
cd firestore-explorer
npm install
cd webview && npm install && cd ..
npm run build
```

Press `F5` in VS Code to launch the **Extension Development Host** with the extension loaded.

### Project Layout

- `src/` — extension host code (runs in Node inside VS Code)
  - `services/` — connection + Firestore logic
  - `providers/` — tree data providers for the sidebar
  - `panels/` — webview panel hosts
- `webview/` — React-based webview (collection browser, query builder, document editor)
- `test/` — vitest unit tests
- `test-project/` — sample workspace for manual testing

### Running Tests

```bash
npm test          # run unit tests once
npm run lint      # lint src/
```

### Build Scripts

```bash
npm run build            # build extension + webview
npm run build:ext        # extension only
npm run build:webview    # webview only
npm run watch:ext        # rebuild extension on change
npm run watch:webview    # rebuild webview on change
```

## Making Changes

1. **Fork** the repo and create a feature branch: `git checkout -b feat/my-change`.
2. **Write tests** for new behavior where practical.
3. **Run** `npm test` and `npm run lint` before pushing.
4. **Commit** with clear, conventional messages (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).
5. **Open a Pull Request** against `main` using the PR template.

### Coding Guidelines

- TypeScript strict mode — no `any` unless unavoidable.
- Prefer small, focused PRs over large sweeping ones.
- Don't introduce new dependencies without discussion.
- Keep extension-host code free of React/DOM imports; keep webview code free of `vscode` imports.
- Types shared across host and webview live in `src/types.ts`.

## Reporting Bugs

Open a [bug report](https://github.com/productivehub/firestore-explorer/issues/new?template=bug_report.md) with:

- VS Code version and OS
- Extension version
- Connection type (emulator / production)
- Steps to reproduce
- Expected vs actual behavior
- Logs from **Output → Firestore Explorer** if applicable

**Never include service account keys, tokens, or production data in an issue.**

## Feature Requests

Open a [feature request](https://github.com/productivehub/firestore-explorer/issues/new?template=feature_request.md) describing the problem you're trying to solve, not just the solution you have in mind.

## Security

If you discover a security vulnerability, please **do not** open a public issue. Email the maintainers privately so we can coordinate a fix and disclosure.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
