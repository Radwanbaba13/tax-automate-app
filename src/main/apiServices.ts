import log from 'electron-log';

let cachedToken: string | null = null;
let tokenExpiry = 0;

function getBaseUrl(): string {
  const url = process.env.API_SERVICES_URL;
  if (!url) throw new Error('API_SERVICES_URL is not configured');
  return url.replace(/\/$/, '');
}

function getApiKey(): string {
  const key = process.env.API_SERVICES_SANKARI_API_KEY;
  if (!key) throw new Error('API_SERVICES_SANKARI_API_KEY is not configured');
  return key;
}

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const res = await fetch(`${getBaseUrl()}/api/v1/sankari/auth/token`, {
    method: 'POST',
    headers: { 'X-API-Key': getApiKey() },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API auth failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { token: string; expiresAt: string };
  cachedToken = data.token;
  tokenExpiry = Date.now() + 55 * 60 * 1000; // cache for 55 min (token lives 1h)
  log.info('API services: obtained new auth token');
  return cachedToken;
}

interface FileData {
  name: string;
  type: string;
  base64: string;
}

export interface CompareResult {
  status: 'PASSED' | 'FAILED';
  discrepancyCount: number;
  missingDataCount: number;
  discrepancies: Array<{
    payer: string;
    form: string;
    box: string;
    field: string;
    expected: string;
    entered: string;
    errorType: string;
  }>;
  missingData: Array<{
    payer: string;
    form: string;
    box: string;
    field: string;
  }>;
  summary: string;
  cost: number;
  timeSeconds: number;
  usage: { inputTokens: number; outputTokens: number };
}

export async function compareDocuments(
  dtMaxFiles: FileData[],
  clientSlipsFiles: FileData[],
  prompt?: string,
): Promise<CompareResult> {
  const token = await getToken();
  const form = new FormData();

  for (const file of dtMaxFiles) {
    const blob = new Blob([Buffer.from(file.base64, 'base64')], {
      type: file.type || 'application/octet-stream',
    });
    form.append('dtMaxFiles', blob, file.name);
  }

  for (const file of clientSlipsFiles) {
    const blob = new Blob([Buffer.from(file.base64, 'base64')], {
      type: file.type || 'application/octet-stream',
    });
    form.append('clientSlipsFiles', blob, file.name);
  }

  if (prompt) {
    form.append('prompt', prompt);
  }

  const res = await fetch(
    `${getBaseUrl()}/api/v1/sankari/data-review/compare`,
    {
      method: 'POST',
      headers: {
        'X-API-Key': getApiKey(),
        Authorization: `Bearer ${token}`,
      },
      body: form,
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Data review failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<CompareResult>;
}

export async function generateEmail(options: {
  customerInquiry?: string;
  templateContent?: string;
}): Promise<{ subject: string; body: string }> {
  const token = await getToken();

  const res = await fetch(
    `${getBaseUrl()}/api/v1/sankari/llm/generate-email`,
    {
      method: 'POST',
      headers: {
        'X-API-Key': getApiKey(),
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Generate email failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<{ subject: string; body: string }>;
}

export async function refineEmail(
  emailBody: string,
): Promise<{ body: string }> {
  const token = await getToken();

  const res = await fetch(
    `${getBaseUrl()}/api/v1/sankari/llm/refine-email`,
    {
      method: 'POST',
      headers: {
        'X-API-Key': getApiKey(),
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ emailBody }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Refine email failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<{ body: string }>;
}

export async function suggestReplies(query: string): Promise<{
  suggestions: [string, string, string];
  sources: Array<{
    subject: string;
    score: number;
    date: string;
    customerText: string;
    agentText: string;
  }>;
}> {
  const token = await getToken();

  const res = await fetch(`${getBaseUrl()}/api/v1/sankari/rag/suggest`, {
    method: 'POST',
    headers: {
      'X-API-Key': getApiKey(),
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    const text = await res.text();
    let body: any;
    try { body = JSON.parse(text); } catch { /* ignore */ }
    if (res.status === 422) {
      if (body?.error === 'IRRELEVANT_QUERY') {
        const err = new Error(body.reason || 'Query is not relevant to customer support') as Error & { code: string };
        err.code = 'IRRELEVANT_QUERY';
        throw err;
      }
      if (body?.error === 'NO_RELEVANT_CASES') {
        const err = new Error('No similar past cases found for this query') as Error & { code: string };
        err.code = 'NO_RELEVANT_CASES';
        throw err;
      }
    }
    throw new Error(`RAG suggest failed (${res.status}): ${text}`);
  }

  return res.json();
}
