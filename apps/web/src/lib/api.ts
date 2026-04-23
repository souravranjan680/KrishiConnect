import type {
  FeedbackRequest,
  RecommendRequest,
  RecommendResponse,
} from "@/lib/types";

function apiBaseUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:8000").replace(/\/$/, "");

  // In production, Vercel pages are served over HTTPS. If the API base URL is
  // accidentally configured as http://, browsers will block requests as mixed
  // content. Auto-upgrade to https:// for non-local hosts.
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    if (raw.startsWith("http://") && !raw.includes("localhost") && !raw.includes("127.0.0.1")) {
      return raw.replace(/^http:\/\//, "https://");
    }
  }

  return raw;
}

async function http<T>(path: string, init: RequestInit): Promise<T> {
  let res: Response;
  const url =
    typeof window !== "undefined"
      ? `/api/proxy${path}`
      : `${apiBaseUrl()}${path}`;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
    });
  } catch (e) {
    // Fetch throws TypeError on network errors (DNS, CORS, mixed-content, offline).
    throw new Error(
      `Network error while calling API (${url}). Check NEXT_PUBLIC_API_BASE_URL and CORS/HTTPS configuration.`
    );
  }

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const data = (await res.json()) as { detail?: unknown };
      if (typeof data.detail === "string") msg = data.detail;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }

  return (await res.json()) as T;
}

export async function recommendCrop(
  req: RecommendRequest
): Promise<RecommendResponse> {
  return http<RecommendResponse>("/recommend", {
    method: "POST",
    body: JSON.stringify(req),
    cache: "no-store",
  });
}

export async function submitFeedback(req: FeedbackRequest): Promise<void> {
  await http<{ ok: true }>("/feedback", {
    method: "POST",
    body: JSON.stringify(req),
    cache: "no-store",
  });
}

export async function chatWithAI(
  message: string,
  lang: "hi" | "en" = "en",
  context?: { village?: string; lat?: number; lon?: number },
  history?: { role: string; text: string }[]
): Promise<string> {
  const res = await http<{ reply: string }>("/chat", {
    method: "POST",
    body: JSON.stringify({
      message,
      lang,
      ...(context || {}),
      ...(history && history.length > 0 ? { history } : {}),
    }),
    cache: "no-store",
  });
  return res.reply;
}
