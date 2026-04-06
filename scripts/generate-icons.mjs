/**
 * Generates PNG icons for the PWA from favicon.svg
 * Run once:  npm run pwa-icons
 */
import { createRequire } from 'module'
import { readFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const require  = createRequire(import.meta.url)
const sharp    = require('sharp')
const __dir    = dirname(fileURLToPath(import.meta.url))
const rootDir  = join(__dir, '..')
const publicDir = join(rootDir, 'public')
const iconsDir  = join(publicDir, 'icons')

mkdirSync(iconsDir, { recursive: true })

const svgBuf = readFileSync(join(publicDir, 'favicon.svg'))

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

console.log('\n🎨 Generating PWA icons…\n')

for (const size of sizes) {
  const out = join(iconsDir, `icon-${size}x${size}.png`)
  await sharp(svgBuf).resize(size, size).png().toFile(out)
  console.log(`  ✓ icon-${size}x${size}.png`)
}

// Apple touch icon (must be 180×180 PNG)
await sharp(svgBuf).resize(180, 180).png().toFile(join(iconsDir, 'apple-touch-icon.png'))
console.log('  ✓ apple-touch-icon.png')

// Maskable icon — add 20% padding so the soccer ball sits in the safe zone
const maskSize = 512
const padded   = Math.round(maskSize * 0.8)
await sharp(svgBuf)
  .resize(padded, padded)
  .extend({
    top: Math.round((maskSize - padded) / 2),
    bottom: Math.round((maskSize - padded) / 2),
    left: Math.round((maskSize - padded) / 2),
    right: Math.round((maskSize - padded) / 2),
    background: { r: 0, g: 90, b: 60, alpha: 1 },
  })
  .png()
  .toFile(join(iconsDir, 'icon-maskable-512x512.png'))
console.log('  ✓ icon-maskable-512x512.png')

console.log('\n✅ All icons generated in public/icons/\n')
