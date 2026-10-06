"use client";

export interface TabItem<T extends string> {
  id: T;
  label: string;
  badge?: string;
  count?: number;
}

export function PillTabs<T extends string>({
  tabs,
  activeTab,
  onChange,
  className = "",
}: {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex items-center p-1.5 rounded-xl border border-site-border bg-site-surface-2/60 backdrop-blur-sm gap-1 ${className}`}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 select-none ${
              isActive
                ? "bg-site-surface text-site-text shadow-sm border border-site-border"
                : "text-site-text-2 hover:text-site-text hover:bg-site-surface/50"
            }`}
          >
            <span>{tab.label}</span>
            {tab.badge && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-site-accent/10 text-site-accent font-bold">
                {tab.badge}
              </span>
            )}
            {typeof tab.count === "number" && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-site-surface-2 text-site-text-2 font-medium">
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
