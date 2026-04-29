"use client";

import { useState, type ReactNode } from "react";
import {
  BarChart3,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Users,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

type Metrics = {
  total_recommend_requests: number;
  total_feedback: number;
  helpful_yes: number;
  helpful_no: number;
};

type FeedbackRow = {
  id: number;
  recommendation_id: string;
  helpful: boolean;
  comment: string | null;
  created_at: string;
};

function apiBase() {
  if (typeof window !== "undefined") return "/api/proxy";
  return process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:8000";
}

async function adminGet<T>(path: string, adminId: string, adminPass: string): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    headers: { "X-Admin-Id": adminId, "X-Admin-Password": adminPass },
    cache: "no-store",
  });
  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try { const d = (await res.json()) as { detail?: string }; if (d.detail) msg = d.detail; } catch { /* */ }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

function StatCard({ icon, label, value, color }: { icon: ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-4 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: color + "18" }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <div className="text-2xl font-extrabold text-green-900">{value.toLocaleString()}</div>
        <div className="text-xs font-medium text-green-600 mt-0.5">{label}</div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [adminId, setAdminId]       = useState("");
  const [password, setPassword]     = useState("");
  const [metrics, setMetrics]   = useState<Metrics | null>(null);
  const [feedback, setFeedback] = useState<FeedbackRow[] | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  async function load() {
    setError(null); setLoading(true); setMetrics(null); setFeedback(null);
    try {
      const [m, f] = await Promise.all([
        adminGet<Metrics>("/admin/metrics", adminId.trim(), password.trim()),
        adminGet<FeedbackRow[]>("/admin/feedback", adminId.trim(), password.trim()),
      ]);
      setMetrics(m); setFeedback(f);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally { setLoading(false); }
  }

  const satisfactionPct = metrics && metrics.total_feedback > 0
    ? Math.round((metrics.helpful_yes / metrics.total_feedback) * 100)
    : null;

  return (
    <div className="min-h-screen" style={{ background: "#f0fdf4" }}>
      {/* Header */}
      <header style={{ background: "linear-gradient(135deg, #14532d 0%, #15803d 55%, #16a34a 100%)" }}>
        <div className="mx-auto max-w-2xl px-4 pt-8 pb-12 flex flex-col gap-4">
          <a href="/" className="flex items-center gap-1.5 text-green-200 text-sm hover:text-white transition-colors w-fit">
            <ArrowLeft size={14} /> Back to Kishan Sathi
          </a>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
              <ShieldCheck size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white">Admin Dashboard</h1>
              <p className="text-green-200 text-sm">Monitor usage and farmer feedback</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 -mt-6 pb-16 flex flex-col gap-5">
        {/* Auth card */}
        <div className="bg-white rounded-3xl shadow-md border border-green-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={18} className="text-green-600" />
            <h2 className="text-base font-bold text-green-900">Authentication</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={adminId}
              onChange={e => setAdminId(e.target.value)}
              placeholder="Admin ID"
              type="text"
              className="flex-1 px-4 py-3 rounded-xl border-2 border-green-200 bg-green-50 text-green-900 text-sm placeholder:text-green-300 outline-none focus:border-green-500 focus:bg-white transition-all"
            />
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && adminId.trim() && password.trim() && !loading && load()}
              placeholder="Password"
              type="password"
              className="flex-1 px-4 py-3 rounded-xl border-2 border-green-200 bg-green-50 text-green-900 text-sm placeholder:text-green-300 outline-none focus:border-green-500 focus:bg-white transition-all"
            />
            <button
              type="button"
              onClick={load}
              disabled={loading || !adminId.trim() || !password.trim()}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm shadow transition-all active:scale-95 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #15803d, #22c55e)" }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <BarChart3 size={16} />}
              {loading ? "Loading" : "Load"}
            </button>
          </div>
          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />{error}
            </div>
          )}
        </div>

        {/* Metrics */}
        {metrics && (<>
          {/* Satisfaction banner */}
          {satisfactionPct !== null && (
            <div className="rounded-2xl border border-green-200 px-5 py-4 flex items-center gap-4"
              style={{ background: "linear-gradient(135deg, #15803d, #22c55e)" }}>
              <div className="text-4xl font-extrabold text-white">{satisfactionPct}%</div>
              <div>
                <div className="text-white font-bold">Farmer Satisfaction</div>
                <div className="text-green-100 text-sm">Based on {metrics.total_feedback} feedback responses</div>
              </div>
              <CheckCircle2 className="ml-auto text-green-200" size={36} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={<Users size={22} />}      label="Recommendations"  value={metrics.total_recommend_requests} color="#16a34a" />
            <StatCard icon={<MessageSquare size={22} />} label="Total Feedback" value={metrics.total_feedback}          color="#0891b2" />
            <StatCard icon={<ThumbsUp size={22} />}   label="Helpful (Yes)"   value={metrics.helpful_yes}              color="#16a34a" />
            <StatCard icon={<ThumbsDown size={22} />} label="Not Helpful (No)" value={metrics.helpful_no}              color="#dc2626" />
          </div>

          {/* Feedback list */}
          {feedback && (
            <div className="bg-white rounded-3xl shadow-sm border border-green-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare size={18} className="text-green-600" />
                <h2 className="text-base font-bold text-green-900">Recent Feedback</h2>
                <span className="ml-auto text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                  Last {feedback.length}
                </span>
              </div>

              {feedback.length === 0 ? (
                <div className="py-8 text-center text-green-500 text-sm">No feedback yet.</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {feedback.map(row => (
                    <div key={row.id}
                      className="rounded-2xl border p-3.5 flex flex-col gap-1.5 transition-all"
                      style={{ borderColor: row.helpful ? "#bbf7d0" : "#fecaca", background: row.helpful ? "#f0fdf4" : "#fff5f5" }}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {row.helpful
                            ? <ThumbsUp size={16} className="text-green-600" />
                            : <ThumbsDown size={16} className="text-red-500" />}
                          <span className="text-sm font-bold" style={{ color: row.helpful ? "#15803d" : "#b91c1c" }}>
                            {row.helpful ? "Helpful" : "Not Helpful"}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">{new Date(row.created_at).toLocaleString()}</span>
                      </div>
                      {row.comment && (
                        <p className="text-sm text-gray-700 pl-6">{row.comment}</p>
                      )}
                      <div className="text-xs text-gray-400 pl-6 font-mono truncate">
                        ID: {row.recommendation_id}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>)}

        <p className="text-center text-xs text-green-500">Kishan Sathi Admin — Authorized access only</p>
      </main>
    </div>
  );
}
