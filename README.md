# Cozy Observatory

## Personal calendar setup (prepared locally)

Open `calendar.html` from **Study tools → Calendar**. In Google Calendar, go to Settings → your calendar → Integrate calendar and copy the Calendar ID or Google embed URL. Paste it into the website and save. Each visitor's ID and time zone remain in their own browser; do not commit personal calendar settings, credentials, or secret iCal links to this public repository.

This displays Google's embedded calendar in Month, Week, or Agenda mode. Google enforces calendar access; private embeds depend on the viewer's Google session and permissions and may be blocked by browser cookie restrictions. Use **Open in Google Calendar** if the embed cannot access your calendar. This is not OAuth account linking or event editing. No calendar sharing permissions are changed. Integration prepared with Codex assistance.

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

The overlay views share the site's stylesheet and automatically check for published asset changes every minute. Keep the website tab open during your stream. The free PeerJS signaling service connects the browser and the overlay; selected study fields then travel over WebRTC. This is live broadcasting, not cloud storage or cross-device study syncing. The clock and notes overlay does not access your camera or microphone. The optional Sav avatar studio requests access only after you click its start controls.

Private tasks are never sent. Scratchpad sharing is off by default. Use the dedicated field-notes box for text you intend to show viewers. The pairing URL contains a read-only capability in its fragment; it is generated in your browser and never committed to this repository. Mutual HMAC challenges authenticate the paired controller and viewer. Read-only viewers cannot update the website. A stopped or disconnected overlay clears its content and reconnects when the controller returns.

See [overlay setup and optional CSS snippets](docs/snippets/README.md). PeerJS is pinned to 1.5.5 with a SHA-384 integrity hash. Its upstream license is MIT; see [PeerJS source](https://github.com/peers/peerjs/tree/v1.5.5) and [free signaling documentation](https://peerjs.com/client/faq). Restricted networks can block direct WebRTC; connection status reports whether the live link is working.

To host it on GitHub Pages:

1. Open the repository's **Settings → Pages**.
2. Choose **Deploy from a branch**.
3. Select **main** and **/docs**, then **Save**.
4. After the deployment finishes, use `https://audrey9080.github.io/Productivity-website/`.

All asset links are relative, so this works under the repository's project URL. `docs/index.html`, `docs/styles.css`, `docs/state.js`, and `docs/app.js` are the public website. No Node backend or build process is needed for GitHub Pages. Pages activation and publication are separate from adding these files.

## Sav stream avatar

Choose **Open avatar studio** in the new Sav panel to open a separate tab and keep your existing clock/notes connection active, or expand **Try Sav here** to use it inside the study website.

1. Open the studio in Chrome or Edge on HTTPS or localhost.
2. Click **Start webcam tracking**, allow access, look forward, and click **Center my pose**.
3. Optionally enable **Use microphone for mouth** for speech-driven animation.
4. Choose green screen and click **Enter stream view**. In Streamlabs/OBS, capture that browser window and add a green Chroma Key filter. Crop the toolbar and keep the window visible and unminimized. Escape restores the controls.
5. Stop the camera before opening another studio tab. Use your normal Streamlabs microphone source for stream audio.

Sav uses a generated 2-by-2 transparent pixel-art sprite atlas in a detailed 32-bit-era style. Her anatomical left side is lavender purple and her right side is pastel blue. Four states combine open/closed eyes with open/closed talking mouth. Canvas playback keeps pixels crisp, normalizes each frame to avoid position jumps, and adds gentle breathing and speech bounce. Webcam head tilt/position moves the whole portrait; there is no separate head-turn, individual-eye, smile, eyebrow, hand or full-body rig. This is not an importable Live2D/VTube Studio model.

Only the avatar studio requests camera/microphone access, after you click its controls. Camera frames and microphone samples are processed locally and are not sent through the clock/notes overlay connection. MediaPipe Tasks Vision 0.10.22-rc.20250304 and Google's face model download on demand from jsDelivr and Google Storage, so tracking needs internet and browser permissions.

Preview, controls and microphone lifecycle were checked in a browser. Real camera/model inference remains unverified because the development environment blocked external model downloads. Microphone mouth and the talking demo remain available if model loading fails.

Reference: [Google Face Landmarker web guide](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js). Sav is an original Star Trek fan character. Artwork and integration developed with Codex assistance.

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




