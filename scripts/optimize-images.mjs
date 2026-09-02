// One-shot optimiser: converts every PNG/JPG under public/design-portfolio
// to WebP (max 1400px wide, quality 80) and removes the heavy original.
// GIFs are left untouched — they are the animated content.
// Run with: node scripts/optimize-images.mjs
import { readdir, stat, unlink } from 'node:fs/promises'
import { join, extname } from 'node:path'
import sharp from 'sharp'

const ROOT = new URL('../public/design-portfolio', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')

let before = 0
let after = 0

for (const dir of await readdir(ROOT)) {
  const folder = join(ROOT, dir)
  if (!(await stat(folder)).isDirectory()) continue
  for (const file of await readdir(folder)) {
    const ext = extname(file).toLowerCase()
    if (!['.png', '.jpg', '.jpeg'].includes(ext)) continue
    const src = join(folder, file)
    const out = join(folder, file.replace(/\.(png|jpe?g)$/i, '.webp'))
    const size = (await stat(src)).size
    before += size
    await sharp(src).resize({ width: 1400, withoutEnlargement: true }).webp({ quality: 80 }).toFile(out)
    after += (await stat(out)).size
    await unlink(src)
    console.log(`${dir}/${file} -> webp  (${(size / 1024).toFixed(0)}KB -> ${((await stat(out)).size / 1024).toFixed(0)}KB)`)
  }
}

console.log(`\nTOTAL: ${(before / 1048576).toFixed(1)}MB -> ${(after / 1048576).toFixed(1)}MB`)
