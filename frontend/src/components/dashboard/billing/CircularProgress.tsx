import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
} from "recharts";

type CircularProgressProps = {
  value: number;
  max: number; // -1 means unlimited
  color?: string;
  label: string;
};

export default function CircularProgress({
  value,
  max,
  color = "#0040CE",
  label,
}: CircularProgressProps) {
  const isUnlimited = max === -1;

  // Guard against divide-by-zero/Infinity/NaN when max is 0 or -1.
  const percentage = isUnlimited
    ? 100
    : max > 0
    ? Math.min((value / max) * 100, 100)
    : 0;

  const data = [
    {
      name: label,
      value: percentage,
      fill: isUnlimited ? "#94a3b8" : color, // muted fill for unlimited state
    },
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-36 w-36">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="75%"
            outerRadius="100%"
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <RadialBar dataKey="value" cornerRadius={20} background />
          </RadialBarChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xl font-bold">
            {isUnlimited ? "∞" : `${Math.round(percentage)}%`}
          </div>
          <div className="text-xs text-muted-foreground">
            {isUnlimited ? `${value} used` : `${value} / ${max}`}
          </div>
        </div>
      </div>

      <span className="mt-2 text-sm font-medium">{label}</span>
    </div>
  );
}