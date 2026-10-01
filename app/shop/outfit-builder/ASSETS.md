# Outfit Builder images

The builder is an outfit board. Customers pick real products, and the board shows those products' own
images together over a background. Nothing is worn by a model, drawn, generated, or recolored.

**Product rule:** every product in `catalog.ts` is a real item you can offer or link to (Printful, Apliiq,
OrgToolTank, or another approved partner), shown with its real product image. Never add a stand-in image.

## Where images go (under `public/outfit-builder/`)

| What | Folder | Example |
|---|---|---|
| Printful products | `products/printful/` | `unisex-classic-tee-black-front-6abc103a5d2c3.png` |
| Apliiq products | `products/apliiq/` | `apliiq-crewneck-heather-front.png` |
| OrgToolTank products | `products/orgtooltank/` | `logo-cap-black.png` |
| Backgrounds | `scenes/` | `studio.webp`, `brick-wall.webp`, `living-room.webp`, `street.webp` |

Keep the partner's original file name when it helps you match it back to the listing. Then add the product
to `PRODUCTS` in `catalog.ts`:

```ts
{
  id: "apliiq-crewneck-heather", name: "Crewneck, Heather", category: "shirts", source: "Apliiq", available: true,
  image: "/outfit-builder/products/apliiq/apliiq-crewneck-heather-front.png",
  price: 4200,                                      // cents; leave out until the real price is set
  productUrl: "https://…", affiliateUrl: "https://…", // optional
  thumbnail: "/outfit-builder/products/apliiq/apliiq-crewneck-heather-thumb.webp", // optional
},
```

Categories: `shirts`, `pants`, `jackets`, `shoes`, `hats`, `accessories`. One product per category is on the
board at a time.

## Image format and size

- **Product images:** square, **2000 × 2000 px**, **transparent PNG** (WebP also works). Show just the product,
  front view, centered, with a little margin and no background. Printful's mockup downloads already match this.
  A white background works but looks like a box on colored backgrounds.
- **Thumbnails (optional):** 600 × 600 px WebP. Without one, the card uses the product image.
- **Backgrounds:** 1800 × 2400 px (3:4 portrait, the board's shape), WebP or JPG. Other sizes are cropped to fill.
  Plain and Custom color need no image.

Product images are shown whole with `object-fit: contain` in a fixed spot on the board. They're never
stretched or cropped, so any proportion works, but square keeps every product at a consistent size.

## Missing images

In `npm run dev`, a product or background whose file is missing shows a marked "image needed" slot with
its exact path. On the live site, anything missing is
left out. Images are found when the page renders: in dev, drop the file in and reload; in production, rebuild.

Tests: `node --test app/shop/outfit-builder/catalog.test.mjs` (checks that every listed product's image exists).
