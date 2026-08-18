import type { DayCounts } from "../lib/usageLog";
import { useLanguage } from "../lib/i18n";

interface UsageBarChartProps {
  data: DayCounts[];
}

const COLORS: Record<"aldim" | "atladim" | "gecikti" | "sorun", string> = {
  aldim: "var(--primary)",
  atladim: "var(--danger-border)",
  gecikti: "var(--warning-border)",
  sorun: "#b3491f",
};

const KEYS: ("aldim" | "atladim" | "gecikti" | "sorun")[] = ["aldim", "atladim", "gecikti", "sorun"];

export default function UsageBarChart({ data }: UsageBarChartProps) {
  const { t } = useLanguage();
  const width = 640;
  const height = 220;
  const padding = 28;
  const barGap = 6;
  const barWidth = (width - padding * 2) / data.length - barGap;

  const maxTotal = Math.max(1, ...data.map((d) => d.aldim + d.atladim + d.gecikti + d.sorun));
  const scale = (height - padding * 2) / maxTotal;

  const statusLabel: Record<string, string> = {
    aldim: t.notes_status_aldim,
    atladim: t.notes_status_atladim,
    gecikti: t.notes_status_gecikti,
    sorun: t.notes_status_sorun,
  };

  return (
    <div className="usage-chart">
      <svg viewBox={`0 0 ${width} ${height}`} className="usage-chart__svg">
        {data.map((day, i) => {
          const x = padding + i * (barWidth + barGap);
          let yCursor = height - padding;
          return (
            <g key={day.date}>
              {KEYS.map((key) => {
                const value = day[key];
                if (value === 0) return null;
                const barHeight = value * scale;
                yCursor -= barHeight;
                return (
                  <rect
                    key={key}
                    x={x}
                    y={yCursor}
                    width={barWidth}
                    height={barHeight}
                    fill={COLORS[key]}
                    rx={2}
                  >
                    <title>
                      {day.date} — {statusLabel[key]}: {value}
                    </title>
                  </rect>
                );
              })}
              <text
                x={x + barWidth / 2}
                y={height - padding + 14}
                textAnchor="middle"
                className="usage-chart__axis-label"
              >
                {day.date.slice(5)}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="usage-chart__legend">
        {KEYS.map((key) => (
          <span key={key} className="usage-chart__legend-item">
            <span className="usage-chart__legend-dot" style={{ background: COLORS[key] }} />
            {statusLabel[key]}
          </span>
        ))}
      </div>
    </div>
  );
}
