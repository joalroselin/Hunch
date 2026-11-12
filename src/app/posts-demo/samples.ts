import snapshot from "@/components/hunch/screens/demo-snapshot.json"
import { shortPrice } from "@/components/hunch/screens/shared"
import type { Version } from "@/lib/hunch/types"

// Elle's winner and runner-up from the sample candle run.
const run = snapshot.run as unknown as { product: { name: string; price: string }; versions: Version[] }
const pick = (code: string) => run.versions.find((v) => v.code === code)!

export const sampleBrand = run.product.name
export const samplePrice = shortPrice(run.product.price) ?? run.product.price

export const sampleVersions: Version[] = [pick(snapshot.report.verdict.winnerCode), pick(snapshot.report.verdict.runnerUpCode)]

// Abstract warm backdrop used only to check photo layouts. Shows no product.
const standInSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#d9a066"/><stop offset="0.55" stop-color="#9a5c2e"/><stop offset="1" stop-color="#4a2a14"/></linearGradient>
<filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="70"/></filter>
<filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.09 0"/></filter>
</defs>
<rect width="1200" height="1500" fill="url(#g)"/>
<g filter="url(#b)">
<circle cx="300" cy="380" r="240" fill="#f6c879" opacity="0.85"/>
<circle cx="900" cy="600" r="200" fill="#e98b3a" opacity="0.7"/>
<circle cx="560" cy="1050" r="280" fill="#b4562a" opacity="0.6"/>
<circle cx="1000" cy="220" r="120" fill="#fff1c9" opacity="0.6"/>
</g>
<rect width="1200" height="1500" filter="url(#n)"/>
</svg>`

export const standInPhoto = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(standInSvg)}`
