import { designsForProduct } from "./designs";
import type { Product } from "./products";
export default function DesignChoices({ product, value, onChange }: { product: Product; value?: string; onChange: (id: string | undefined) => void }) {
  return <div className="ob-choice ob-design-choice" role="group" aria-label="Shirt design">
    <span className="ob-size-name">Front design</span>
    <span className="ob-sizes"><button type="button" aria-pressed={!value} onClick={() => onChange(undefined)}>Plain shirt</button>
      {designsForProduct(product).map(d => <button key={d.id} type="button" aria-pressed={value === d.id} onClick={() => onChange(d.id)}>{d.title}</button>)}
    </span>
  </div>;
}
