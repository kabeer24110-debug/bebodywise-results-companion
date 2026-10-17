import type { Product } from '../types';

/*
 * Illustrated placeholder for a product. These are drawings, not official product photos.
 * Each format gets its own silhouette; the tint follows the product category.
 */
const TINT: Record<Product['category'], { bg: string; body: string; cap: string }> = {
  body: { bg: '#E6EEE9', body: '#F7FAF8', cap: '#7A9783' },
  underarm: { bg: '#F4E4DF', body: '#FCF6F4', cap: '#B98078' },
  hair: { bg: '#E9E6DA', body: '#FAF9F4', cap: '#8C8A5E' },
  sun: { bg: '#F3E8D3', body: '#FFFBF3', cap: '#C2A06A' },
};

export function ProductArt({ product, size = 'md' }: { product: Product; size?: 'sm' | 'md' | 'lg' }) {
  const t = TINT[product.category];
  const h = size === 'sm' ? 'h-24' : size === 'lg' ? 'h-64' : 'h-40';
  return (
    <div className={`relative ${h} w-full overflow-hidden rounded-xl`} style={{ background: t.bg }} aria-hidden>
      <svg viewBox="0 0 160 120" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet">
        <ellipse cx="80" cy="110" rx="34" ry="4" fill="#000" opacity="0.06" />
        {shape(product.format, t)}
      </svg>
      <span className="absolute bottom-1.5 right-2 text-[10px] text-muted/80">Illustration</span>
    </div>
  );
}

function shape(f: Product['format'], t: { body: string; cap: string }) {
  const stroke = { stroke: '#D9D2C7', strokeWidth: 0.8 };
  switch (f) {
    case 'wash':
      return (<g><rect x="62" y="38" width="36" height="70" rx="9" fill={t.body} {...stroke} /><rect x="74" y="24" width="12" height="15" rx="2" fill={t.cap} /><rect x="74" y="20" width="22" height="5" rx="2" fill={t.cap} /><rect x="68" y="58" width="24" height="1.2" fill={t.cap} opacity=".5" /></g>);
    case 'lotion':
      return (<g><rect x="60" y="34" width="40" height="74" rx="12" fill={t.body} {...stroke} /><rect x="68" y="22" width="24" height="14" rx="4" fill={t.cap} /><rect x="66" y="60" width="28" height="1.2" fill={t.cap} opacity=".5" /></g>);
    case 'roll-on':
      return (<g><rect x="63" y="52" width="34" height="56" rx="10" fill={t.body} {...stroke} /><rect x="65" y="30" width="30" height="24" rx="10" fill={t.cap} /><rect x="69" y="72" width="22" height="1.2" fill={t.cap} opacity=".5" /></g>);
    case 'serum':
      return (<g><rect x="68" y="40" width="24" height="68" rx="7" fill={t.body} {...stroke} /><rect x="70" y="22" width="20" height="20" rx="7" fill={t.cap} /><rect x="72" y="64" width="16" height="1.2" fill={t.cap} opacity=".5" /></g>);
    case 'gummies':
      return (<g><path d="M56 40 Q56 34 62 34 L98 34 Q104 34 104 40 L106 104 Q106 108 102 108 L58 108 Q54 108 54 104 Z" fill={t.body} {...stroke} /><rect x="58" y="30" width="44" height="8" rx="3" fill={t.cap} /><circle cx="72" cy="90" r="4" fill={t.cap} opacity=".6" /><circle cx="84" cy="94" r="4" fill={t.cap} opacity=".45" /><circle cx="90" cy="88" r="3.5" fill={t.cap} opacity=".55" /></g>);
    case 'sunscreen':
      return (<g><path d="M64 30 L96 30 L100 92 Q100 96 96 96 L64 96 Q60 96 60 92 Z" fill={t.body} {...stroke} /><rect x="70" y="96" width="20" height="12" rx="3" fill={t.cap} /><rect x="66" y="54" width="28" height="1.2" fill={t.cap} opacity=".5" /></g>);
  }
}
