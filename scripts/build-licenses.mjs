// Vite's inventory comes from emitted chunks, not the whole dependency lockfile.
// Complete missing upstream texts offline and retain additional package notices.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const output = path.join(root, 'dist', 'third-party-licenses.json');
const entries = JSON.parse(fs.readFileSync(output, 'utf8'));
const overridesDir = path.join(root, 'scripts', 'licenses');
const overrides = JSON.parse(fs.readFileSync(path.join(overridesDir, 'overrides.json'), 'utf8'));
const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
assert.ok(entries.length > 0, 'Vite emitted no dependency license inventory');

function noticeFiles(dir, prefix = '') {
  const result = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (item.name === 'node_modules' || item.name === '.git') continue;
    const relative = path.posix.join(prefix, item.name);
    if (item.isDirectory()) result.push(...noticeFiles(path.join(dir, item.name), relative));
    else if (item.isFile() && /^(licen[cs]e|copying|notice)([.-]|$)/i.test(item.name)) {
      result.push({ file: relative, text: fs.readFileSync(path.join(dir, item.name), 'utf8').trim() });
    }
  }
  return result.sort((a, b) => a.file < b.file ? -1 : a.file > b.file ? 1 : 0);
}

for (const entry of entries) {
  const key = `${entry.name}@${entry.version}`;
  const override = overrides[key];
  if (override) {
    assert.ok(!entry.identifier || entry.identifier === override.identifier, `license conflict: ${key}`);
    entry.identifier = override.identifier;
    entry.text ||= fs.readFileSync(path.join(overridesDir, override.file), 'utf8').trim();
    entry.source = override.source;
  }
  assert.ok(entry.text?.trim(), `Missing license text for ${key}; review upstream before releasing`);
  // Version-match the installed package; never substitute another package's license.
  const candidates = Object.entries(lock.packages).filter(([location, pkg]) =>
    location.endsWith(`node_modules/${entry.name}`) && pkg.version === entry.version);
  const location = candidates.map(([location]) => path.join(root, location)).find((dir) => fs.existsSync(dir));
  assert.ok(location, `Cannot locate installed ${key}`);
  const installed = JSON.parse(fs.readFileSync(path.join(location, 'package.json'), 'utf8'));
  assert.equal(installed.name, entry.name);
  assert.equal(installed.version, entry.version);
  entry.notices = noticeFiles(location);
}

fs.writeFileSync(output, `${JSON.stringify(entries, null, 2)}\n`);
const header = `Third-party client licenses / Licenze del client di terze parti

Generated from the dependencies incorporated by Vite. Original license texts follow.
Generato dalle dipendenze incorporate da Vite. Seguono i testi originali delle licenze.
Droidsembly's own code remains MIT; these components retain their respective terms.
Il codice Droidsembly resta MIT; questi componenti conservano i rispettivi termini.
Sora: icons/Sora-OFL.txt. External server dependencies retain their own licenses;
in particular Claude Agent SDK and its binaries are subject to Anthropic terms, not MIT.
Le dipendenze server esterne mantengono le proprie licenze; SDK e binari Claude
sono soggetti ai termini Anthropic, non alla MIT.
`;
const text = header + entries.map((entry) => {
  const title = `\n===== ${entry.name}@${entry.version} (${entry.identifier || 'see license text'}) =====\n`;
  const source = entry.source ? `Source: ${entry.source}\n` : '';
  const additional = entry.notices.filter((notice) => notice.text !== entry.text.trim())
    .map((notice) => `\n--- ${notice.file} ---\n${notice.text}\n`).join('');
  return `${title}${source}\n${entry.text}\n${additional}`;
}).join('');
fs.writeFileSync(path.join(root, 'dist', 'THIRD_PARTY_LICENSES.txt'), text);
console.log(`Client licenses: ${entries.length} bundled packages, all with license texts`);
