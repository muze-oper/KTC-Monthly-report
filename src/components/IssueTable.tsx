"use client";

import { Fragment, useMemo, useState } from "react";
import type { Issue } from "@/lib/jira";

function fmtDate(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function IssueTable({ issues }: { issues: Issue[] }) {
  const [monthFilter, setMonthFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);

  const months = useMemo(
    () => [...new Set(issues.map((i) => i.month))].sort(),
    [issues]
  );
  const statuses = useMemo(
    () => [...new Set(issues.map((i) => i.status))].sort(),
    [issues]
  );

  const filtered = issues.filter(
    (i) =>
      (!monthFilter || i.month === monthFilter) &&
      (!statusFilter || i.status === statusFilter)
  );

  return (
    <div className="table-section">
      <div className="table-header">
        <h3>Ticket details</h3>
        <span className="count-badge">{filtered.length} issues</span>
      </div>
      <div className="filter-row">
        <button
          className={`filt ${monthFilter === null ? "active" : ""}`}
          onClick={() => setMonthFilter(null)}
        >
          All months
        </button>
        {months.map((m) => (
          <button
            key={m}
            className={`filt ${monthFilter === m ? "active" : ""}`}
            onClick={() => setMonthFilter(m === monthFilter ? null : m)}
          >
            {m}
          </button>
        ))}
        <span style={{ width: 1, alignSelf: "stretch", background: "var(--border)" }} />
        <button
          className={`filt ${statusFilter === null ? "active" : ""}`}
          onClick={() => setStatusFilter(null)}
        >
          All statuses
        </button>
        {statuses.map((s) => (
          <button
            key={s}
            className={`filt ${statusFilter === s ? "active" : ""}`}
            onClick={() => setStatusFilter(s === statusFilter ? null : s)}
          >
            {s}
          </button>
        ))}
      </div>
      <table>
        <thead>
          <tr>
            <th style={{ width: 80 }}>Key</th>
            <th>Summary</th>
            <th style={{ width: 130 }}>Category</th>
            <th style={{ width: 80 }}>Severity</th>
            <th style={{ width: 90 }}>First Tier</th>
            <th style={{ width: 100 }}>Status</th>
            <th style={{ width: 90 }}>Created</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((issue) => {
            const isOpen = openKey === issue.key;
            return (
              <Fragment key={issue.key}>
                <tr
                  className={`issue-row ${isOpen ? "open" : ""}`}
                  onClick={() => setOpenKey(isOpen ? null : issue.key)}
                >
                  <td>
                    <a
                      className="key-text"
                      href={issue.webUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {issue.key}
                    </a>
                  </td>
                  <td>{issue.summary}</td>
                  <td>{issue.category || <span className="no-data">—</span>}</td>
                  <td>
                    {issue.severity ? (
                      <span className={`sev-badge sev-${issue.severity}`}>
                        {issue.severity}
                      </span>
                    ) : (
                      <span className="no-data">—</span>
                    )}
                  </td>
                  <td>
                    {issue.firstTier === "Yes" && <span className="ft-yes">Yes</span>}
                    {issue.firstTier === "No" && <span className="ft-no">No</span>}
                    {!issue.firstTier && <span className="ft-none">—</span>}
                  </td>
                  <td>
                    <span className={`badge ${issue.isEscalated ? "badge-esc" : issue.isDone ? "badge-done" : ""}`}>
                      {issue.status}
                    </span>
                  </td>
                  <td className="no-data">{fmtDate(issue.created)}</td>
                </tr>
                {isOpen && (
                  <tr className="detail-row">
                    <td colSpan={7}>
                      <div className="detail-inner">
                        <div>
                          <div className="blk-label">Description</div>
                          <div className="desc-box">
                            {issue.desc || <span className="no-data">No description</span>}
                          </div>
                          {issue.irtask && (
                            <div style={{ marginTop: 8 }}>
                              <span className="irtask-text">{issue.irtask}</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="blk-label">
                            Comments ({issue.comments.length})
                          </div>
                          {issue.comments.length === 0 ? (
                            <div className="no-comments">No comments</div>
                          ) : (
                            <div className="comments-list">
                              {issue.comments.map((c, idx) => (
                                <div className="cbubble" key={idx}>
                                  <span className="cauthor">{c.author}</span>
                                  <span className="cdate">{fmtDate(c.date)}</span>
                                  <div className="comment-body">{c.text}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
