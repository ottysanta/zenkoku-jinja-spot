type Props = {
  title: string;
  body: string;
  href: string;
  label: string;
  variant?: "primary" | "line";
};

export function CtaBox({ title, body, href, label, variant = "primary" }: Props) {
  const isLine = variant === "line";
  return (
    <div
      className={`my-10 rounded-2xl p-6 text-center ${
        isLine
          ? "bg-[#06C755]/10 border border-[#06C755]/30"
          : "bg-gradient-to-br from-vermilion/10 to-moss/10 border border-vermilion/20"
      }`}
    >
      <h3 className="text-lg font-bold text-stone-800 mb-2">{title}</h3>
      <p className="text-sm text-stone-600 mb-5 leading-relaxed">{body}</p>
      <a
        href={href}
        target={isLine ? "_blank" : undefined}
        rel={isLine ? "noopener noreferrer" : undefined}
        className={`inline-block font-bold px-8 py-3 rounded-full text-sm transition-colors shadow-md ${
          isLine
            ? "bg-[#06C755] text-white hover:bg-[#06C755]/90"
            : "bg-vermilion text-white hover:bg-vermilion/90"
        }`}
      >
        {label}
      </a>
    </div>
  );
}
