"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ApiCounter, ThroughputPoint } from "@/lib/types";

const AXIS = {
  stroke: "#6b7c99",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

const TOOLTIP_STYLE = {
  backgroundColor: "#0e1626",
  border: "1px solid #2a3a59",
  borderRadius: "0.5rem",
  fontSize: 12,
  color: "#e9eefb",
} as const;

export function ThroughputChart({
  data,
}: {
  data: ThroughputPoint[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <defs>
          <linearGradient id="throughputFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity={0.32} />
            <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#1b2740" vertical={false} />
        <XAxis dataKey="window" {...AXIS} />
        <YAxis {...AXIS} width={56} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: "#2a3a59" }} />
        <Area
          type="monotone"
          dataKey="requests"
          name="Requests"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#throughputFill)"
        />
        <Area
          type="monotone"
          dataKey="failed"
          name="Failed"
          stroke="#ef4444"
          strokeWidth={1.5}
          fill="transparent"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function TransactionOutcomeChart({
  data,
}: {
  data: ApiCounter[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={data}
        margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
        barGap={2}
      >
        <CartesianGrid stroke="#1b2740" vertical={false} />
        <XAxis dataKey="label" {...AXIS} />
        <YAxis {...AXIS} width={56} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#131d31" }} />
        <Legend
          wrapperStyle={{ fontSize: 11, color: "#93a4c0", paddingTop: 8 }}
        />
        <Bar dataKey="success" name="Successful" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
        <Bar dataKey="failed" name="Failed" stackId="a" fill="#ef4444" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LatencyBars({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid stroke="#1b2740" vertical={false} />
        <XAxis dataKey="label" {...AXIS} />
        <YAxis {...AXIS} width={64} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#131d31" }} />
        <Bar dataKey="value" name="p95 latency (ms)" radius={[3, 3, 0, 0]}>
          {data.map((entry) => (
            <Cell
              key={entry.label}
              fill={entry.value > 1500 ? "#f59e0b" : "#2563eb"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
