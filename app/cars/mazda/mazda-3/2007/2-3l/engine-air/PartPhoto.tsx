import fs from "node:fs";
import path from "node:path";
import Image from "next/image";

/**
 * Product-style part photo on a white panel. `src` is a path under /public.
 * Until the file exists, a neutral placeholder is shown instead of a broken image.
 */
export default function PartPhoto({ src, alt }: { src: string; alt: string }) {
  const exists = fs.existsSync(path.join(process.cwd(), "public", src));
  return (
    <div className="relative mx-auto aspect-[8/7] w-full max-w-md overflow-hidden rounded-xl bg-white">
      {exists ? (
        <Image src={src} alt={alt} fill sizes="(min-width: 1024px) 28rem, 90vw" className="object-contain" />
      ) : (
        <div className="flex h-full items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 p-6 text-center text-lg font-bold text-neutral-500">Part photo coming</div>
      )}
    </div>
  );
}
