# Cozy Observatory

A comfy, cozy productivity website with translucent pastel lavender windows, a retro observatory scene, a study timer, personal tasks, and a scratchpad. Based on the local Cozy Observatory setup.

## GitHub Pages study website

The complete browser-only website is in `docs/`. It has:

- Observatory, Reading Room, and Stargazing views with CSS pixel scenery
- A configurable focus/rest timer that resumes correctly after a refresh
- Task creation, completion, deletion, and filters
- Autosaved notes and room preference
- Responsive layouts, keyboard focus styles, and reduced-motion support

Each visitor's work is saved in their own browser using local storage. It is not shared with other visitors or synced between devices. Clearing browser storage removes that work. Completed timers pause before the next session; there are no mandatory study targets.

## Live Twitch overlays — free

The study website includes a **Twitch connection** panel. Click **Connect overlay**, then copy the permanent widget URLs into Streamlabs or OBS browser sources. The clock, field notes, and optional scratchpad update live from the open website. No Supabase project or paid service is required.

The overlay views share the site's stylesheet and automatically check for published asset changes every minute. Keep the website tab open during your stream. The free PeerJS signaling service connects the browser and the overlay; selected study fields then travel over WebRTC. This is live broadcasting, not cloud storage or cross-device study syncing. There is no camera or microphone access.

Private tasks are never sent. Scratchpad sharing is off by default. Use the dedicated field-notes box for text you intend to show viewers. The pairing URL contains a read-only capability in its fragment; it is generated in your browser and never committed to this repository. Mutual HMAC challenges authenticate the paired controller and viewer. Read-only viewers cannot update the website. A stopped or disconnected overlay clears its content and reconnects when the controller returns.

See [overlay setup and optional CSS snippets](docs/snippets/README.md). PeerJS is pinned to 1.5.5 with a SHA-384 integrity hash. Its upstream license is MIT; see [PeerJS source](https://github.com/peers/peerjs/tree/v1.5.5) and [free signaling documentation](https://peerjs.com/client/faq). Restricted networks can block direct WebRTC; connection status reports whether the live link is working.

To host it on GitHub Pages:

1. Open the repository's **Settings → Pages**.
2. Choose **Deploy from a branch**.
3. Select **main** and **/docs**, then **Save**.
4. After the deployment finishes, use `https://audrey9080.github.io/Productivity-website/`.

All asset links are relative, so this works under the repository's project URL. `docs/index.html`, `docs/styles.css`, `docs/state.js`, and `docs/app.js` are the public website. No Node backend or build process is needed for GitHub Pages. Pages activation and publication are separate from adding these files.

## Original Streamlabs prototype

The `public/`, `server.js`, and `config/` files preserve the original local Streamlabs prototype and are separate from the GitHub Pages study website.

### Run locally

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

## Local prototype data and scope

The server creates `data/state.json` automatically on first run. It contains local timer and task state and is excluded from Git. No personal task data or machine backups are included in this repository.

This is a single-user local prototype, bound to `127.0.0.1`. The community queue is a local moderation interface, not an authenticated multi-user service. There are no user accounts or authorization checks; all clients share the same state. Do not expose this server publicly as-is. GitHub Pages cannot run its Node backend.

## Development

```sh
npm run check
npm test
```

Possible next steps include cloud-synced user workspaces, authenticated community features, and a database-backed deployment. These are proposed directions, not implemented features.

## Provenance

The starter and this import were developed with AI assistance through Codex. The lavender styling is included from the local setup. This repository has not been deployed as a public website.
