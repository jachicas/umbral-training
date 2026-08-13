const WIDTH = 84;
const HEIGHT = 26;
const PAD = 3;

/** Evolution of a race time: faster (lower seconds) plots higher on the line. */
export function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) {
    const cy = HEIGHT / 2;
    return (
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} aria-hidden="true">
        <circle cx={WIDTH - PAD} cy={cy} r={2.5} fill={color} />
      </svg>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const stepX = (WIDTH - PAD * 2) / (values.length - 1);

  const points = values.map((v, i) => {
    const x = PAD + i * stepX;
    // faster (lower seconds) => smaller y => higher on the chart
    const y = PAD + ((v - min) / span) * (HEIGHT - PAD * 2);
    return [x, y] as const;
  });

  const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const [lastX, lastY] = points[points.length - 1];

  return (
    <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} aria-hidden="true">
      <path d={path} fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r={2.5} fill={color} />
    </svg>
  );
}
