"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import type { MonthAgg } from "@/lib/jira";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export function DashboardCharts({ months }: { months: MonthAgg[] }) {
  const labels = months.map((m) => m.month);
  const done = months.map((m) => m.done);
  const escalated = months.map((m) => m.escalated);
  const mom = months.map((m) => m.momPct);

  return (
    <div className="charts-grid">
      <div className="chart-card">
        <h3>Issues per month — Done vs Escalated</h3>
        <div style={{ position: "relative", height: 260 }}>
          <Bar
            data={{
              labels,
              datasets: [
                {
                  label: "Done",
                  data: done,
                  backgroundColor: "#10B981",
                  borderRadius: 4,
                  stack: "s",
                },
                {
                  label: "Escalated",
                  data: escalated,
                  backgroundColor: "#F59E0B",
                  borderRadius: 4,
                  stack: "s",
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: "top" } },
              scales: {
                x: { stacked: true, grid: { display: false } },
                y: { stacked: true, beginAtZero: true },
              },
            }}
          />
        </div>
      </div>
      <div className="chart-card">
        <h3>Month-over-Month change (%)</h3>
        <div style={{ position: "relative", height: 260 }}>
          <Bar
            data={{
              labels,
              datasets: [
                {
                  label: "MoM %",
                  data: mom,
                  backgroundColor: mom.map((v) =>
                    v === null ? "transparent" : v > 0 ? "#EF4444" : "#10B981"
                  ),
                  borderRadius: 4,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
            }}
          />
        </div>
      </div>
    </div>
  );
}
