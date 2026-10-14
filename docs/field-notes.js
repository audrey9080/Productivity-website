/* Checklist text stays compatible with existing saved notes and overlay messages. */
(function (root) {
  'use strict';
  function items(text) {
    return String(text || '').split('\n').flatMap((line, index) => {
      const match = /^\s*- \[([ xX])\] (.*)$/.exec(line);
      return match ? [{ index, done: match[1].toLowerCase() === 'x', text: match[2] }] : [];
    });
  }
  function toggle(text, index, done) {
    const lines = text.split('\n');
    if (/^\s*- \[[ xX]\] /.test(lines[index] || '')) lines[index] = lines[index].replace(/\[[ xX]\]/, done ? '[x]' : '[ ]');
    return lines.join('\n');
  }
  function render(target, text, onToggle) {
    target.replaceChildren();
    String(text || '').split('\n').forEach((line, index) => {
      const match = /^\s*- \[([ xX])\] (.*)$/.exec(line);
      const row = document.createElement(match ? 'label' : 'div');
      row.className = match ? 'field-check-row' : 'field-prose-row';
      if (match) {
        const done = match[1].toLowerCase() === 'x';
        if (onToggle) {
          const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = done;
          checkbox.addEventListener('change', () => onToggle(index, checkbox.checked)); row.append(checkbox);
        } else {
          const symbol = document.createElement('span'); symbol.textContent = done ? '☑' : '☐'; symbol.setAttribute('aria-label', done ? 'Completed' : 'Not completed'); row.append(symbol);
        }
        const content = document.createElement('span'); content.textContent = match[2]; row.append(content); row.classList.toggle('done', done);
      } else { row.textContent = line; if (!line) row.append(document.createElement('br')); }
      target.append(row);
    });
  }
  const api = { items, toggle, render }; root.CozyFieldNotes = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
