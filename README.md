# Cozy Observatory

A comfy, cozy productivity website starter, with translucent pastel lavender panels, a study timer, personal tasks, a moderated community queue, and observatory-themed scenes. Imported from the local Cozy Observatory setup as a foundation for the planned retro-game study website.

## Run locally

Install Node.js 22 or later, then run:

```sh
npm start
```

No third-party dependencies or installation step are required. Open http://127.0.0.1:17777/ for the controls. To use a different port, set `COZY_OBSERVATORY_PORT` before starting the server.

## Pages

- `/` — timer and task controls
- `/observatory.html` — main study scene
- `/common-room.html` — common room
- `/reading-room.html` — reading room
- `/stargazing.html` — starting scene
- `/break.html` — break scene
- `/goodnight.html` — closing scene

All pages share `public/styles.css` and `public/app.js`. The Node server is in `server.js`. Optional Streamlabs scene placement notes are in `config/scene-manifest.json`.

## Data and current scope

The server creates `data/state.json` automatically on first run. It contains local timer and task state and is excluded from Git. No personal task data or machine backups are included in this repository.

This is a single-user local prototype, bound to `127.0.0.1`. The community queue is a local moderation interface, not an authenticated multi-user service. There are no user accounts or authorization checks; all clients share the same state. Do not expose this server publicly as-is. GitHub Pages cannot run its Node backend.

## Development

```sh
npm run check
```

Possible next steps include a responsive study-first home page, retro-game artwork and navigation, separate user workspaces, authenticated community features, and a database-backed deployment. These are proposed directions, not implemented features.

## Provenance

The starter and this import were developed with AI assistance through Codex. The lavender styling is included from the local setup. This repository has not been deployed as a public website.
