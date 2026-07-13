import { verifySession } from "@/lib/dal";
import { getKtcReport } from "@/lib/jira";
import { signOut } from "@/auth";
import { DashboardCharts } from "@/components/DashboardCharts";
import { IssueTable } from "@/components/IssueTable";

export const revalidate = 300;

export default async function DashboardPage() {
  const session = await verifySession();
  const { months, issues } = await getKtcReport();

  const totalIssues = issues.length;
  const totalDone = issues.filter((i) => i.isDone).length;
  const donePct = totalIssues ? Math.round((totalDone / totalIssues) * 100) : 0;
  const busiest = months.reduce(
    (a, b) => (b.total > (a?.total ?? -1) ? b : a),
    months[0]
  );
  const latest = months[months.length - 1];

  return (
    <>
      <nav className="topbar">
        <div className="topbar-brand">
          <div className="topbar-logo">M</div>
          <span className="topbar-title">Muze Ops Portal — KTC Monthly Report</span>
        </div>
        <div className="topbar-right">
          <span className="topbar-email">{session.user?.email}</span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button type="submit" className="signout-btn">
              Sign out
            </button>
          </form>
        </div>
      </nav>
      <div className="container">
        <div className="page-header">
          <h1>KTC Website — Monthly Overview</h1>
          <p>ภาพรวมทุกเดือน · ข้อมูลจาก Jira (KTC) แบบสด</p>
        </div>

        <div className="metrics">
          <div className="metric-card">
            <div className="m-label">Total Issues</div>
            <div className="m-value c-blue">{totalIssues}</div>
            <div className="m-sub">{months.length} months tracked</div>
          </div>
          <div className="metric-card">
            <div className="m-label">Done</div>
            <div className="m-value c-green">{totalDone}</div>
            <div className="m-sub">{donePct}% overall</div>
          </div>
          <div className="metric-card">
            <div className="m-label">เดือนที่มี ticket มากสุด</div>
            <div className="m-value c-purple" style={{ fontSize: 20 }}>
              {busiest?.month ?? "—"}
            </div>
            <div className="m-sub">{busiest?.total ?? 0} issues</div>
          </div>
          <div className="metric-card">
            <div className="m-label">เดือนล่าสุด</div>
            <div className="m-value c-amber" style={{ fontSize: 20 }}>
              {latest?.month ?? "—"}
            </div>
            <div className="m-sub">
              {latest?.total ?? 0} issues
              {latest?.momPct != null &&
                ` · MoM ${latest.momPct > 0 ? "+" : ""}${latest.momPct.toFixed(1)}%`}
            </div>
          </div>
        </div>

        <DashboardCharts months={months} />

        <div className="table-section">
          <div className="table-header">
            <h3>Monthly breakdown</h3>
            <span className="count-badge">{months.length} months</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Total</th>
                <th style={{ minWidth: 180 }}>Done %</th>
                <th>Escalated</th>
                <th>IRTask</th>
                <th>First Tier Yes</th>
                <th>MoM Change</th>
              </tr>
            </thead>
            <tbody>
              {months.map((m) => {
                const donePctMonth = m.total ? Math.round((m.done / m.total) * 100) : 0;
                return (
                  <tr key={m.sortKey}>
                    <td>{m.month}</td>
                    <td>{m.total}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            flex: 1,
                            height: 8,
                            background: "var(--surface2)",
                            borderRadius: 4,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${donePctMonth}%`,
                              background: "#10B981",
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#10B981" }}>
                          {donePctMonth}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${m.escalated ? "badge-esc" : "badge-done"}`}>
                        {m.escalated}
                      </span>
                    </td>
                    <td>{m.irtaskCount}</td>
                    <td>{m.firstTierYes}</td>
                    <td>
                      {m.momPct == null
                        ? "—"
                        : `${m.momPct > 0 ? "+" : ""}${m.momPct.toFixed(1)}%`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <IssueTable issues={issues} />
      </div>
    </>
  );
}
