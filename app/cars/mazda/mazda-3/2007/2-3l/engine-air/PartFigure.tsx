import type { FigureContent } from "./guides/types";

export default function PartFigure({ id, figure }: { id: string; figure: FigureContent }) {
  return (
    <section aria-labelledby={id} className="flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 px-5 py-4 md:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">{figure.eyebrow}</p>
        <h2 id={id} className="mt-2 text-xl font-black tracking-tight md:text-2xl">{figure.title}</h2>
      </div>
      <figure className="flex flex-1 flex-col">
        <div className="flex flex-1 items-center p-3 md:p-5">
          <div className="w-full">
            {figure.art ?? <div className="flex aspect-[16/10] items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-6 text-center text-lg font-bold text-neutral-500">Illustration in progress</div>}
          </div>
        </div>
        <figcaption className="border-y border-neutral-200 bg-neutral-50 px-5 py-4 text-sm leading-6 text-neutral-600 md:px-6">{figure.caption}</figcaption>
      </figure>
      {figure.key && (
        <ol className="grid gap-x-6 gap-y-4 px-5 py-5 sm:grid-cols-2 md:px-6">
          {figure.key.map(item => (
            <li key={item.marker} className="flex gap-3">
              <span aria-hidden="true" className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white">{item.marker}</span>
              <div><p className="font-bold leading-7"><span className="sr-only">{item.marker}: </span>{item.label}</p><p className="text-sm leading-6 text-neutral-600">{item.detail}</p></div>
            </li>
          ))}
        </ol>
      )}
      {figure.note && <p className="px-5 py-5 text-sm leading-6 text-neutral-600 md:px-6">{figure.note}</p>}
    </section>
  );
}
