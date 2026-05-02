function EmptyState({ title, message, compact = false }) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-[18px] border border-dashed border-line bg-[#0d1320] text-center ${
        compact ? "px-4 py-5" : "min-h-[220px] px-6 py-8"
      }`}
    >
      <p className="text-sm font-semibold text-textPrimary">{title}</p>
      <p className="mt-2 max-w-sm text-sm leading-6 text-textSecondary">{message}</p>
    </div>
  );
}

export default EmptyState;
