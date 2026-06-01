interface Props {
  name: string;
  price: string;
  image?: string;
  description?: string;
}

export default function ProductCard({ name, price, image, description }: Props) {
  return (
    <div className="group relative rounded-2xl border border-white/10 bg-zinc-950/90 overflow-hidden transition-all duration-300 hover:border-red-500/30 hover:shadow-[0_0_30px_rgba(239,68,68,0.05)]">
      <div className="aspect-[4/5] bg-zinc-900 flex items-center justify-center overflow-hidden">
        {image ? (
          <img src={image} alt={name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700">DAWGS</span>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-white">{name}</h3>
        {description && <p className="mt-1 text-[9px] text-zinc-500 leading-relaxed">{description}</p>}
        <p className="mt-2 text-sm font-black text-[#C8FF00]">{price}</p>
      </div>
    </div>
  );
}
