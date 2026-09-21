# Mazda 3 exterior rotation assets

The only current frame is `/illustrations/mazda-3-graphite.webp` (front three-quarter).
It stays at its existing URL; no invented or duplicated angles are supplied.

Add genuine matching exterior views here, then update `app/mazda3Frames.ts` with
only existing files in circular order. Example eight-view order:

1. mazda3-01-front.png
2. mazda3-02-front-right.png
3. mazda3-03-right.png
4. mazda3-04-rear-right.png
5. mazda3-05-rear.png
6. mazda3-06-rear-left.png
7. mazda3-07-left.png
8. mazda3-08-front-left.png

Left/right refer to the vehicle's sides. Identify the current drawing's matching
angle when placing it in the sequence; do not label it as a straight front view.
Use 1774 × 887 images with a consistent ground baseline, camera distance, vehicle
center, graphite style, wheels, trim, and white/transparent background. No logos,
emblems, signatures, or mirroring. Optimized WebP files are also supported.

Any frame count works without component changes. The component preloads and decodes
all listed images and enables rotation only when all have loaded. A single image
remains static with an honest coming-soon message. Failed frames disable rotation.
There is no automatic rotation or inertia. Rotation stops on the selected frame;
angular resolution depends on the number of supplied views. Pointer dragging,
touch swiping, left/right keys, and previous/next buttons use the same circular list.
