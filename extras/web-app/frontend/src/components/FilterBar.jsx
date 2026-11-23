function FilterBar({ filters, setFilters, filterOptions, disabled = false }) {
  return (
    <section className="rounded-lg glass-border bg-surface px-4 py-4 shadow-panel">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-textSecondary">Segment filters</p>
          <p className="mt-1 text-sm text-textSecondary">Use the toolbar to isolate churn behavior by segment.</p>
        </div>

        <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Object.entries(filterOptions).map(([key, options]) => (
            <label key={key} className="block min-w-0">
              <span className="mb-2 block text-[11px] uppercase tracking-wide text-textSecondary">
                {key.replaceAll("_", " ")}
              </span>
              <select
                value={filters[key]}
                disabled={disabled}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    [key]: event.target.value
                  }))
                }
                className="w-full min-w-0 rounded-md glass-border bg-elevated px-3.5 py-2.5 text-sm text-textPrimary outline-none transition focus:border-primary/55 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FilterBar;
