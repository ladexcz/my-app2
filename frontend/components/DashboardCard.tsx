"use client";

type DashboardCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function DashboardCard({
  title,
  value,
  subtitle,
  icon,
  actionLabel,
  onAction,
}: DashboardCardProps) {
  return (
    <div className="rounded-[2rem] border border-[#E0E0E0] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#2E7D32]">{title}</p>
          <p className="mt-3 text-3xl font-semibold text-[#1B1B1B]">{value}</p>
          {subtitle ? <p className="mt-2 text-sm text-[#4F4F4F]">{subtitle}</p> : null}
        </div>
        {icon ? (
          <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-[#E8F5E9] text-2xl">
            {icon}
          </div>
        ) : null}
      </div>
      {actionLabel ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 w-full rounded-3xl bg-[#2E7D32] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#256229]"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
