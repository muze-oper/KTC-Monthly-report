import "server-only";
import { adfToText } from "./adf";

const JIRA_BASE_URL = process.env.JIRA_BASE_URL ?? "";
const JIRA_EMAIL = process.env.JIRA_EMAIL ?? "";
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN ?? "";
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY ?? "KTC";

// Field mapping confirmed against the live `mymuze.atlassian.net` KTC project.
const FIELD = {
  category: "customfield_11417", // e.g. "Technical Issue", "Promotion", "Inquiry"
  severity: "customfield_11418", // "Urgent" | "High" | "Medium" | "Low"
  firstTier: "customfield_11552", // "Yes" | "No"
  irtask: "customfield_11668", // free text, e.g. "IRTASK-2607-00071"
} as const;

export type Comment = { author: string; date: string; text: string };

export type Issue = {
  key: string;
  webUrl: string;
  category: string;
  severity: string;
  firstTier: "Yes" | "No" | "";
  irtask: string;
  status: string;
  isDone: boolean;
  isEscalated: boolean;
  summary: string;
  month: string; // e.g. "July 2026"
  monthSortKey: string; // e.g. "2026-07"
  assignee: string;
  created: string;
  desc: string;
  comments: Comment[];
};

export type MonthAgg = {
  month: string;
  sortKey: string;
  total: number;
  done: number;
  escalated: number;
  irtaskCount: number;
  firstTierYes: number;
  momPct: number | null;
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function authHeader() {
  const token = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64");
  return `Basic ${token}`;
}

function monthFromSummary(summary: string): { month: string; sortKey: string } | null {
  const match = summary.match(/\[\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\s*\]/);
  if (!match) return null;
  const [, , monthName, year] = match;
  const idx = MONTH_NAMES.findIndex(
    (m) => m.toLowerCase() === monthName.toLowerCase()
  );
  if (idx === -1) return null;
  return {
    month: `${MONTH_NAMES[idx]} ${year}`,
    sortKey: `${year}-${String(idx + 1).padStart(2, "0")}`,
  };
}

function monthFromCreated(created: string): { month: string; sortKey: string } {
  const date = new Date(created);
  const month = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).format(date);
  const [monthName, year] = month.split(" ");
  const idx = MONTH_NAMES.findIndex((m) => m === monthName);
  return { month, sortKey: `${year}-${String(idx + 1).padStart(2, "0")}` };
}

type JiraApiIssue = {
  key: string;
  fields: Record<string, unknown>;
};

function normalizeIssue(raw: JiraApiIssue): Issue {
  const f = raw.fields;
  const summary = (f.summary as string) ?? "";
  const bracket = monthFromSummary(summary);
  const { month, sortKey } = bracket ?? monthFromCreated(f.created as string);

  const status = f.status as { name: string; statusCategory?: { key: string } };
  const category = f[FIELD.category] as { value?: string } | null;
  const severity = f[FIELD.severity] as { value?: string } | null;
  const firstTier = f[FIELD.firstTier] as { value?: string } | null;
  const assignee = f.assignee as { displayName?: string } | null;
  const rawComments = (f.comment as { comments?: Record<string, unknown>[] } | undefined)?.comments ?? [];

  return {
    key: raw.key,
    webUrl: `${JIRA_BASE_URL}/browse/${raw.key}`,
    category: category?.value ?? "",
    severity: severity?.value ?? "",
    firstTier: (firstTier?.value as "Yes" | "No" | undefined) ?? "",
    irtask: (f[FIELD.irtask] as string) ?? "",
    status: status?.name ?? "",
    isDone: status?.statusCategory?.key === "done",
    isEscalated: status?.name === "Escalated",
    summary,
    month,
    monthSortKey: sortKey,
    assignee: assignee?.displayName ?? "Unassigned",
    created: f.created as string,
    desc: adfToText(f.description),
    comments: rawComments.map((c) => ({
      author: (c.author as { displayName?: string } | undefined)?.displayName ?? "Unknown",
      date: (c.created as string) ?? "",
      text: adfToText(c.body),
    })),
  };
}

async function fetchAllIssues(): Promise<Issue[]> {
  if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
    throw new Error(
      "Missing Jira env vars: JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN must be set"
    );
  }

  const fields = [
    "summary", "status", "assignee", "created", "description", "comment",
    FIELD.category, FIELD.severity, FIELD.firstTier, FIELD.irtask,
  ];

  const issues: Issue[] = [];
  let nextPageToken: string | undefined;

  do {
    const res = await fetch(`${JIRA_BASE_URL}/rest/api/3/search/jql`, {
      method: "POST",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        jql: `project = ${JIRA_PROJECT_KEY} ORDER BY created DESC`,
        fields,
        maxResults: 100,
        nextPageToken,
      }),
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      throw new Error(`Jira API error ${res.status}: ${await res.text()}`);
    }

    const data = (await res.json()) as {
      issues: JiraApiIssue[];
      nextPageToken?: string;
      isLast: boolean;
    };

    issues.push(...data.issues.map(normalizeIssue));
    nextPageToken = data.isLast ? undefined : data.nextPageToken;
  } while (nextPageToken);

  return issues;
}

function aggregateByMonth(issues: Issue[]): MonthAgg[] {
  const byMonth = new Map<string, { month: string; sortKey: string; issues: Issue[] }>();

  for (const issue of issues) {
    const entry = byMonth.get(issue.monthSortKey);
    if (entry) {
      entry.issues.push(issue);
    } else {
      byMonth.set(issue.monthSortKey, {
        month: issue.month,
        sortKey: issue.monthSortKey,
        issues: [issue],
      });
    }
  }

  const sorted = [...byMonth.values()].sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  let prevTotal: number | null = null;
  return sorted.map(({ month, sortKey, issues: monthIssues }) => {
    const total = monthIssues.length;
    const done = monthIssues.filter((i) => i.isDone).length;
    const escalated = monthIssues.filter((i) => i.isEscalated).length;
    const irtaskCount = monthIssues.filter((i) => i.irtask).length;
    const firstTierYes = monthIssues.filter((i) => i.firstTier === "Yes").length;
    const momPct = prevTotal ? ((total - prevTotal) / prevTotal) * 100 : null;
    prevTotal = total;
    return { month, sortKey, total, done, escalated, irtaskCount, firstTierYes, momPct };
  });
}

export type ReportData = {
  issues: Issue[];
  months: MonthAgg[];
  fetchedAt: string;
};

export async function getKtcReport(): Promise<ReportData> {
  const issues = await fetchAllIssues();
  const months = aggregateByMonth(issues);
  return { issues, months, fetchedAt: new Date().toISOString() };
}
