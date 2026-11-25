// Sizzle Chef — the entrypoint (Node 22, standard library only).
// Copies game/ and screenshots/ into the output directory and writes
// dossier.json with buildDossier from vendor/makefun-game.ts.
// Running it twice writes the same bytes twice.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here);
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR || '/output');

function copyTree(name: string): void {
  const src = join(repoRoot, name);
  const dest = join(outDir, name);
  if (!existsSync(src)) {
    throw new Error(`missing ${name}/ in the repository`);
  }
  cpSync(src, dest, { recursive: true });
}

function checkScreenshots(): void {
  const dir = join(repoRoot, 'screenshots');
  const files = readdirSync(dir)
    .filter((f) => !f.startsWith('.'))
    .filter((f) => statSync(join(dir, f)).isFile())
    .sort();
  if (files.length < 3 || files.length > 4) {
    throw new Error(`screenshots/ must hold 3 or 4 images, found ${files.length}`);
  }
  for (const f of files) {
    const size = statSync(join(dir, f)).size;
    if (size > 262144) {
      throw new Error(`screenshot ${f} is ${size} bytes, over the 256 KiB cap`);
    }
  }
}

mkdirSync(outDir, { recursive: true });
rmSync(join(outDir, 'game'), { recursive: true, force: true });
rmSync(join(outDir, 'screenshots'), { recursive: true, force: true });
copyTree('game');
checkScreenshots();
copyTree('screenshots');

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log(`wrote ${outDir}/dossier.json (${dossier.length} bytes)`);
