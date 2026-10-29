interface SparklineProps {
  values: readonly number[];
  stroke: string;
  width?: number;
  height?: number;
}

const PADDING = 2;

/** Dekoracyjny wykres liniowy; liczby są podane obok w tekście, więc ukryty dla czytników. */
export function Sparkline({ values, stroke, width = 120, height = 32 }: SparklineProps) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const stepX = (width - PADDING * 2) / (values.length - 1);
  const points = values.map((value, index) => {
    const x = PADDING + index * stepX;
    const y = height - PADDING - (value / max) * (height - PADDING * 2);
    return [x, y] as const;
  });
  const line = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${points[points.length - 1][0].toFixed(1)},${height} L${PADDING},${height} Z`;
  const lineLength = Math.ceil(width * 2);
  const gradientId = `spark-${stroke.replace(/[^a-z0-9]/gi, "")}`;
  const [lastX, lastY] = points[points.length - 1];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-line-draw"
        style={{ ["--line-length" as string]: lineLength }}
      />
      <circle cx={lastX} cy={lastY} r="2.5" fill={stroke} />
    </svg>
  );
}
