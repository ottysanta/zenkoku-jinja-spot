type Props = {
  children: React.ReactNode;
  title?: string;
};

export function KeyPoint({ children, title }: Props) {
  return (
    <div className="my-6 rounded-2xl border-l-4 border-vermilion bg-vermilion/5 px-5 py-4">
      {title && (
        <p className="text-xs font-bold text-vermilion uppercase tracking-wider mb-1">
          {title}
        </p>
      )}
      <div className="text-stone-700 leading-relaxed text-sm">{children}</div>
    </div>
  );
}
