import Vehicle360Viewer from "./Vehicle360Viewer";
import { mazda3Frames } from "./mazda3Frames";

/** Full-content-width graphite artwork, optimized for responsive delivery. */
export default function Mazda3Illustration() {
  return (
    <figure className="mx-auto mt-12 w-full md:mt-16">
      <Vehicle360Viewer frames={mazda3Frames} label="2007 Mazda 3 sedan" />
      <figcaption className="mt-6 text-center text-xs font-medium uppercase tracking-[0.16em] text-neutral-500 sm:text-sm">
        2007 Mazda 3 Sedan <span aria-hidden="true"> / </span> 2.3L
      </figcaption>
    </figure>
  );
}
