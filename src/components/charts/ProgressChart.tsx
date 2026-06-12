"use client";

import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

// ProgressChart — evolução de peso (área com gradiente)
export function ProgressChart({ data }: { data: { date: string; peso: number | null }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="pesoFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} domain={["auto", "auto"]} unit="kg" />
        <Tooltip formatter={(v) => [`${v} kg`, "Peso"]} />
        <Area type="monotone" dataKey="peso" stroke="#10b981" strokeWidth={2.5} fill="url(#pesoFill)" connectNulls />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// BodyMeasurementChart — evolução de medidas (cintura, abdômen, quadril)
export function BodyMeasurementChart({
  data,
}: {
  data: { date: string; cintura?: number | null; abdomen?: number | null; quadril?: number | null }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} domain={["auto", "auto"]} unit="cm" />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="cintura" name="Cintura" stroke="#2563eb" strokeWidth={2} connectNulls dot={false} />
        <Line type="monotone" dataKey="abdomen" name="Abdômen" stroke="#10b981" strokeWidth={2} connectNulls dot={false} />
        <Line type="monotone" dataKey="quadril" name="Quadril" stroke="#f59e0b" strokeWidth={2} connectNulls dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// AdherenceChart — adesão semanal a treino/dieta (%)
export function AdherenceChart({ data }: { data: { label: string; treino: number; dieta: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="treino" name="Treino" fill="#2563eb" radius={[6, 6, 0, 0]} />
        <Bar dataKey="dieta" name="Dieta" fill="#10b981" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
