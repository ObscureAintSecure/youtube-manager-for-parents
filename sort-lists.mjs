// One-off list sorter: comments stay as header, entries sorted A-Z,
// "# Total channels: N" count refreshed. Same logic as the workflow.
import fs from 'fs';

for (const f of ['lists/gaming-channels.txt', 'lists/misc-channels.txt']) {
  const content = fs.readFileSync(f, 'utf8');
  const comments = [];
  const entryMap = new Map();
  for (const line of content.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    if (t.startsWith('#')) { comments.push(t); continue; }
    if (!entryMap.has(t.toLowerCase())) entryMap.set(t.toLowerCase(), t);
  }
  const sorted = [...entryMap.values()]
    .sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
  const header = comments.map(c =>
    c.replace(/(#\s*Total channels:\s*)\d+/i, `$1${sorted.length}`));
  fs.writeFileSync(f,
    header.join('\n') + (header.length ? '\n\n' : '') + sorted.join('\n') + '\n');
  console.log(`${f}: ${sorted.length} entries sorted`);
}
