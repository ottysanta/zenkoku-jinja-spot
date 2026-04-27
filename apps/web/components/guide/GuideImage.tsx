type Props = {
  src: string;
  alt: string;
  caption?: string;
};

export function GuideImage({ src, alt, caption }: Props) {
  return (
    <figure className="my-8 -mx-4 sm:mx-0">
      <img
        src={src}
        alt={alt}
        className="w-full sm:rounded-2xl object-cover"
        style={{ maxHeight: "460px" }}
        loading="lazy"
      />
      {caption && (
        <figcaption className="text-center text-xs text-stone-400 mt-2 px-4">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
