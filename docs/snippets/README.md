# Cozy Observatory Twitch overlays

Use the website's live widget URLs to keep Twitch connected to the website. CSS alone cannot create a timer or transfer its state.

1. Open the hosted study website and scroll to **One website. A connected overlay.**
2. Click **Connect overlay**.
3. Click **Copy overlay URL** for the Focus clock, Field notes, or Scratchpad.
4. In Streamlabs Desktop or OBS, add a **Browser Source** and paste that URL. Use a URL source, not a Local file.
5. Set the focus clock to **360 × 360**. Set either notes widget to **440 × 360**.
6. Keep the website open during the stream. Control the timer and field notes from that page. Enable **Show scratchpad on stream** if you want to display scratchpad text. Only the first 2,000 characters are transmitted.

The page background is transparent. The panel background is lavender at 82% opacity; lettering stays opaque. The CSS snippets here are optional size overrides for a Browser Source's Custom CSS field. You do not need to copy CSS or JavaScript to get live updates.

The links stay the same across website edits. Overlay pages share `styles.css` with the study page, receive state through a read-only authenticated WebRTC connection, and check hosted assets every minute. Published CSS changes load automatically; overlay code or markup changes refresh the browser source. New files must be published to GitHub Pages before these checks can see them.

Keep pairing links private: anyone holding them can read the fields you choose to broadcast, but cannot change your study state. Private task lists are never transmitted. Field notes are intended for viewers; scratchpad sharing is off by default.

This uses PeerJS 1.5.5 and its free shared signaling service, with no paid project, API subscription, or database. The library is loaded from a pinned CDN URL with an integrity check. Notes and timer data travel through the browser-to-browser data channel. The website must be open for live updates. The overlay clears stale text when it loses contact, and reconnects when the website returns. Some restricted networks may block WebRTC; the connected status confirms whether your setup works. There is no paid fallback enabled.

Sources: [OBS Browser Source](https://obsproject.com/kb/browser-source), [PeerJS free signaling service](https://peerjs.com/client/faq).
