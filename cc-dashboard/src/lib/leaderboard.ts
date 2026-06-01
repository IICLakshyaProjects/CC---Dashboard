import { createSign } from "crypto";

export type MetricKey =
  | "walkinScheduled"
  | "admission"
  | "walkinTurned"
  | "admissionYesterday"
  | "walkinTurnedYesterday";

export type MetricLabel =
  | "Walkin Scheduled"
  | "Admission"
  | "Walkin Turned"
  | "Admission Yesterday"
  | "Walkin Turned Yesterday";

export const METRICS: Array<{ key: MetricKey; label: MetricLabel }> = [
  { key: "walkinScheduled", label: "Walkin Scheduled" },
  { key: "admission", label: "Admission" },
  { key: "walkinTurned", label: "Walkin Turned" },
  { key: "admissionYesterday", label: "Admission Yesterday" },
  { key: "walkinTurnedYesterday", label: "Walkin Turned Yesterday" },
];

export type RawLeaderboardRow = Record<string, unknown>;

export type AgentRecord = {
  name: string;
  emailId: string;
  campaign: string;
  teamName: string;
  walkinScheduled: number;
  admission: number;
  walkinTurned: number;
  admissionYesterday: number;
  walkinTurnedYesterday: number;
  photoLink: string;
  updatedAt: string;
};

export type RankedAgent = AgentRecord & {
  rank: number;
  metricValue: number;
};

export type CampaignLeaderboard = {
  campaign: string;
  agents: RankedAgent[];
};

export type MetricLeaderboard = {
  metric: MetricKey;
  metricLabel: MetricLabel;
  campaigns: CampaignLeaderboard[];
  updatedAt: string;
  sourceError?: string;
};

const GOOGLE_SHEETS_DOC_BASE = "https://docs.google.com/spreadsheets/d";
const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/spreadsheets.readonly",
].join(" ");

type AccessTokenCache = {
  token: string;
  expiresAt: number;
} | null;

type GoogleApiErrorDetail = {
  reason?: string;
  metadata?: Record<string, string>;
};

type GoogleApiErrorResponse = {
  error?: {
    code?: number;
    message?: string;
    details?: GoogleApiErrorDetail[];
  };
};

let accessTokenCache: AccessTokenCache = null;

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
}

function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/,/g, "").trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function normalizeCampaignKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function shouldIncludeCampaign(campaign: string): boolean {
  const normalized = normalizeCampaignKey(campaign);
  if (!normalized) return false;
  if (normalized === "leave") return false;
  if (normalized === "m1agent") return false;
  if (normalized === "unassigned") return false;
  return true;
}

function pickField(row: RawLeaderboardRow, keys: string[]): unknown {
  const normalized = new Map<string, unknown>();
  Object.entries(row).forEach(([key, value]) => {
    normalized.set(key.toLowerCase().replace(/\s+/g, ""), value);
  });

  for (const key of keys) {
    const normalizedKey = key.toLowerCase().replace(/\s+/g, "");
    if (normalized.has(normalizedKey)) return normalized.get(normalizedKey);
  }

  return undefined;
}

function normalizeRow(row: RawLeaderboardRow): AgentRecord {
  const name = asString(pickField(row, ["name", "agent_name", "agent name"]), "Unknown");
  const emailId = asString(pickField(row, ["email id", "email_id", "email"]), "");
  const campaign = asString(pickField(row, ["campaign", "Campaign"]), "Unassigned");
  const teamName = asString(
    pickField(row, ["team", "team name", "team_name", "teamname", "team name "]),
    "",
  );
  const walkinScheduled = asNumber(
    pickField(row, ["walkin scheduled", "walkin_scheduled", "walkin"]),
  );
  const admission = asNumber(pickField(row, ["admission"]));
  const walkinTurned = asNumber(
    pickField(row, ["walkin turned", "walkin_turned", "walkin turned count"]),
  );
  const admissionYesterday = asNumber(
    pickField(row, ["admission yesterday", "admission_yesterday", "admission yesterday count"]),
  );
  const walkinTurnedYesterday = asNumber(
    pickField(row, [
      "walkin turned yesterday",
      "walkin_turned_yesterday",
      "walkin turned yesterday count",
    ]),
  );
  const photoLink = asString(
    pickField(row, ["photo link", "photo_link", "photo", "image", "image url"]),
    "",
  );
  const updatedAt = asString(
    pickField(row, ["updated_at", "updated at", "timestamp", "date"]),
    new Date().toISOString(),
  );

  return {
    name,
    emailId,
    campaign,
    teamName,
    walkinScheduled,
    admission,
    walkinTurned,
    admissionYesterday,
    walkinTurnedYesterday,
    photoLink,
    updatedAt,
  };
}

function normalizeRowsFromValues(values: string[][]): RawLeaderboardRow[] {
  if (values.length === 0) return [];

  const headers = values[0].map((header) => header.trim());
  return values.slice(1).map((rowValues) => {
    return headers.reduce<RawLeaderboardRow>((row, header, index) => {
      row[header] = rowValues[index] ?? "";
      return row;
    }, {});
  });
}

function getEnvSpreadsheetId(): string {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) {
    throw new Error("Missing GOOGLE_SHEETS_SPREADSHEET_ID");
  }
  return spreadsheetId;
}

function getServiceAccountEmail(): string {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  if (!email) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_EMAIL");
  }
  return email;
}

function getServiceAccountPrivateKey(): string {
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY");
  }
  return privateKey.replace(/\\n/g, "\n");
}

function parseCsvTable(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      row.push(cell);
      cell = "";
      continue;
    }

    if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    if (char === "\r") {
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function formatGoogleSheetsApiError(responseStatus: number, body: string): string {
  const fallback = `Google Sheets API request failed (${responseStatus})`;

  if (!body) return fallback;

  try {
    const parsed = JSON.parse(body) as GoogleApiErrorResponse;
    const error = parsed.error;
    const message = error?.message?.trim();
    const details = error?.details ?? [];
    const serviceDisabled = details.some(
      (detail) => detail.reason === "SERVICE_DISABLED" || detail.metadata?.serviceTitle === "Google Sheets API",
    );

    if (responseStatus === 403 && serviceDisabled) {
      const activationUrl = details.find((detail) => detail.metadata?.activationUrl)?.metadata?.activationUrl;
      const projectId =
        details.find((detail) => detail.metadata?.containerInfo)?.metadata?.containerInfo ?? "your Google Cloud project";

      return activationUrl
        ? `Google Sheets API is disabled for project ${projectId}. Enable it here: ${activationUrl} and retry after a few minutes.`
        : `Google Sheets API is disabled for project ${projectId}. Enable the API in Google Cloud Console and retry after a few minutes.`;
    }

    if (responseStatus === 401) {
      const serviceAccount = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? "your service account";
      return `Google Sheets file access is unauthorized for ${serviceAccount}. Share the spreadsheet with that account as a viewer, or publish an exportable read-only sheet/Apps Script endpoint.`;
    }

    if (message) {
      return `Google Sheets API request failed (${responseStatus}): ${message}`;
    }
  } catch {
    // Fall through to the generic message below.
  }

  return fallback;
}

function getConfiguredSheetName(): string {
  const range = process.env.GOOGLE_SHEETS_RANGE?.trim();
  if (!range) return "Sheet1";

  const sheetName = range.split("!")[0]?.trim();
  return sheetName || "Sheet1";
}

function base64UrlEncode(input: string | Uint8Array): string {
  const buffer = typeof input === "string" ? Buffer.from(input, "utf8") : Buffer.from(input);
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function createJwtAssertion(): string {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "RS256",
    typ: "JWT",
  };
  const payload = {
    iss: getServiceAccountEmail(),
    scope: GOOGLE_SCOPES,
    aud: GOOGLE_OAUTH_TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };

  const headerPart = base64UrlEncode(JSON.stringify(header));
  const payloadPart = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${headerPart}.${payloadPart}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsignedToken);
  signer.end();

  const signature = signer.sign(getServiceAccountPrivateKey());
  return `${unsignedToken}.${base64UrlEncode(signature)}`;
}

async function getAccessToken(): Promise<string> {
  const cachedToken = accessTokenCache;
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const assertion = createJwtAssertion();
  const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Failed to authorize service account (${response.status}): ${body || response.statusText}`,
    );
  }

  const payload = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };

  if (!payload.access_token) {
    throw new Error("Google token endpoint did not return an access token");
  }

  accessTokenCache = {
    token: payload.access_token,
    expiresAt: Date.now() + (payload.expires_in ?? 3600) * 1000,
  };

  return payload.access_token;
}

async function fetchAuthorizedText(url: string): Promise<string> {
  const token = await getAccessToken();
  return fetchText(url, token);
}

async function fetchAnonymousText(url: string): Promise<string> {
  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(formatGoogleSheetsApiError(response.status, body || response.statusText));
  }

  return await response.text();
}

async function fetchText(url: string, token?: string): Promise<string> {
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(formatGoogleSheetsApiError(response.status, body || response.statusText));
  }

  return await response.text();
}

async function readSourceRows(): Promise<RawLeaderboardRow[]> {
  const spreadsheetId = getEnvSpreadsheetId();
  const sheetName = getConfiguredSheetName();
  const exportUrl = `${GOOGLE_SHEETS_DOC_BASE}/${encodeURIComponent(spreadsheetId)}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}&headers=1`;

  let csv: string;
  try {
    csv = await fetchAuthorizedText(exportUrl);
  } catch {
    csv = await fetchAnonymousText(exportUrl);
  }

  const values = parseCsvTable(csv);
  if (values.length === 0) return [];

  return normalizeRowsFromValues(values);
}

function getMetricValue(agent: AgentRecord, metric: MetricKey): number {
  return agent[metric];
}

function sortAgents(metric: MetricKey, agents: AgentRecord[]): RankedAgent[] {
  return [...agents]
    .sort((left, right) => {
      const metricDiff = getMetricValue(right, metric) - getMetricValue(left, metric);
      if (metricDiff !== 0) return metricDiff;

      const timeDiff = new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime();
      if (timeDiff !== 0) return timeDiff;

      return left.name.localeCompare(right.name);
    })
    .slice(0, 3)
    .map((agent, index) => ({
      ...agent,
      rank: index + 1,
      metricValue: getMetricValue(agent, metric),
    }));
}

export async function loadMetricLeaderboard(metric: MetricKey): Promise<MetricLeaderboard> {
  const rows = await readSourceRows();
  const agents = rows.map(normalizeRow);
  const campaignGroups = new Map<string, { campaign: string; agents: AgentRecord[] }>();

  for (const agent of agents) {
    if (!shouldIncludeCampaign(agent.campaign)) continue;

    const key = normalizeCampaignKey(agent.campaign);
    const existing = campaignGroups.get(key);
    if (existing) {
      existing.agents.push(agent);
      continue;
    }

    campaignGroups.set(key, {
      campaign: agent.campaign,
      agents: [agent],
    });
  }

  return {
    metric,
    metricLabel: METRICS.find((entry) => entry.key === metric)?.label ?? "Walkin Scheduled",
    campaigns: Array.from(campaignGroups.values()).map((group) => ({
      campaign: group.campaign,
      agents: sortAgents(metric, group.agents),
    })),
    updatedAt: new Date().toISOString(),
  };
}

export function createEmptyMetricLeaderboard(metric: MetricKey, sourceError?: string): MetricLeaderboard {
  return {
    metric,
    metricLabel: METRICS.find((entry) => entry.key === metric)?.label ?? "Walkin Scheduled",
    campaigns: [],
    updatedAt: new Date().toISOString(),
    sourceError,
  };
}

export function getMetricLabel(metric: MetricKey): MetricLabel {
  return METRICS.find((entry) => entry.key === metric)?.label ?? "Walkin Scheduled";
}

export function metricFromLabel(label: string | null | undefined): MetricKey {
  if (!label) return "walkinScheduled";
  const normalized = label.toLowerCase().replace(/\s+/g, "");

  if (normalized === "admission") return "admission";
  if (normalized === "walkinturned") return "walkinTurned";
  if (normalized === "admissionyesterday") return "admissionYesterday";
  if (normalized === "walkinturnedyesterday") return "walkinTurnedYesterday";
  return "walkinScheduled";
}

export function toMetricKey(value: string | null | undefined): MetricKey {
  return metricFromLabel(value);
}
