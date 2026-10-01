# Builder tee assets

`garment-models.ts` is the source for the one supported builder garment. The existing `logo-tee` product points to it through `garmentId`; its card `image` is independent and is never used on the mannequin. The older sample catalog stays intact, and the T-shirt choices now include the plain sample tee and the local Printful demo item, both using this same garment.

The four views currently reuse the mannequin-aligned SVG tee placeholders. To replace a view, set it to `{ kind: "asset", mask: "/outfit-builder/tee-front.png" }`. Supply a transparent PNG or SVG alpha silhouette on a 300 × 640 canvas, aligned to the reference mannequin. The renderer colors its alpha mask with the selected shirt color. For side views, provide a separate `armMask` for the near sleeve, since the mannequin's near arm covers the torso layer. Both side assets face right in source coordinates; the existing viewer mirrors the left view. Do not include artwork or a marketing/mockup background in these assets. This first asset contract is for flat color silhouettes, not shaded photographic fabric.

Print zones use the same canvas coordinates. `designs.ts` contains independent black and white artwork variants; the renderer chooses contrasting ink from the garment color. Only the front zone is supported by the demo, so the design disappears at side/back angles and returns at the front. Artwork should fit its own SVG view box. It moves and scales with the existing garment placement/body transform.

The selected design and print zone belong to the outfit piece. They survive color changes, viewer rotation, preview, test-cart conversion and outfit encoding. A plain tee needs no design. Room and wall settings remain in their existing independent environment state. Provider metadata does not connect to Printful or validate a supplier model or size chart.

Validation: `npm run typecheck`, `node --test app/shop/outfit-builder/outfit.test.mjs`.

## Local Printful demo product

`i-renamed-the-pain` in `products.ts` uses the supplied Black and Maroon PNGs at their original filenames. Each color stores its browsing-only `previewImage`; `productPreviewImage` resolves it for `GarmentThumb`. Neither file is a garment view asset. The product lists Unisex classic tee, Printful, DTG, and sizes S–5XL; no supplier chart or API connection is supplied.

The catalog requires a cents value for existing totals and the test cart. This item reuses $28, marked internally as `priceKind: "demo"`; the page-level preview notice explains sample pricing, while cards show a simple price. This is not a verified Printful retail price. Its default design is `i-renamed-the-pain`, with separate SVG artwork reading “I RENAMED / THE / PAIN.”. Product `designIds` limits this item to its own artwork; the older frequency design remains available only for the original sample tee. Choosing Plain shirt persists through subsequent color changes.

## Realistic person

`PersonLayer.tsx` draws the base person under all clothing. It uses a realistic photo for each angle that has one, and the drawn mannequin for every other angle. Photos go in `public/outfit-builder/person/` as `front`, `left`, `right`, `back` (`.webp` or `.png`). The page checks for them when it's built (`person.server.ts`), so nothing is requested until a file exists. The full photo brief (canvas, alignment points, pose, clothing, hair, lighting) is at the top of `person.ts`.

Layer order per angle: garment parts drawn behind the body, then the person photo, then garment torsos, designs and other `main` layers, then the optional `<view>-foreground` cut-out, then side-view sleeves and wrist items. From the front, the tee's torso and sleeves sit over the photo, so the shoulders and upper arms go under the sleeves and the forearms and hands stay visible. A side photo is only used together with its `-foreground` near-arm cut-out. Without that cut-out the tee's torso would cover the near arm, so the drawn side view stays. A missing `left` photo falls back to the mirrored `right` photo.

Height, build and weight scale a photo as a whole: height sets its size, and the chest width sets how wide it is. Clothing still follows the drawn body's per-level shape, so builds far from the reference are an approximation. For an exact fit, use a photo per build. Tone and body type (male/female) don't change a photo yet; they still apply to the drawn angles.
