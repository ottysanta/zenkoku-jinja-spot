type Props = {
  name: string;
  location: string;
  deity: string;
  benefit: string;
  access?: string;
  image?: string;
};

export function ShrineSpotlight({ name, location, deity, benefit, access, image }: Props) {
  return (
    <div className="my-6 rounded-2xl border border-stone-200 overflow-hidden bg-white">
      {image && (
        <img
          src={image}
          alt={name}
          className="w-full object-cover"
          style={{ maxHeight: "280px" }}
          loading="lazy"
        />
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h4 className="text-lg font-bold text-stone-800">{name}</h4>
            <p className="text-sm text-stone-400">{location}</p>
          </div>
          <span className="text-2xl shrink-0">⛩</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg bg-stone-50 p-2">
            <p className="text-xs text-stone-400 mb-0.5">祭神</p>
            <p className="font-medium text-stone-700">{deity}</p>
          </div>
          <div className="rounded-lg bg-stone-50 p-2">
            <p className="text-xs text-stone-400 mb-0.5">ご利益</p>
            <p className="font-medium text-stone-700">{benefit}</p>
          </div>
        </div>
        {access && (
          <p className="mt-3 text-xs text-stone-400">{access}</p>
        )}
      </div>
    </div>
  );
}
