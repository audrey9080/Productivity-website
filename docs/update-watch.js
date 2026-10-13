/* Pick up published CSS automatically; overlay code updates reload the source with its private fragment intact. */
(() => {
  'use strict';
  const overlay = document.body.classList.contains('overlay-page');
  const files = overlay ? ['styles.css', 'overlay.js', 'overlay-protocol.js', 'state.js', 'overlay.html'] : ['styles.css'];
  const previous = new Map();
  let checking = false;
  async function check() {
    if (checking) return; checking = true;
    try {
      for (const file of files) {
        const response = await fetch(new URL(file, location.href), { cache: 'no-store' });
        if (!response.ok) continue;
        const text = await response.text();
        if (previous.has(file) && previous.get(file) !== text) {
          if (file === 'styles.css') {
            const link = document.querySelector('link[rel="stylesheet"]');
            if (link) { const url = new URL(file, location.href); url.searchParams.set('updated', Date.now()); link.href = url.href; }
          } else { location.reload(); return; }
        }
        previous.set(file, text);
      }
    } catch { /* Continue with the last working assets if temporarily offline. */ }
    finally { checking = false; }
  }
  check(); setInterval(check, 60000);
})();
