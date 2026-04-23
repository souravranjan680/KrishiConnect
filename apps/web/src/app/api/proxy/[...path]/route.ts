import { NextResponse } from "next/server";

function apiBaseUrlServer(): string {
  const raw = (
    process.env.API_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    "http://localhost:8000"
  ).replace(/\/$/, "");
  return raw;
}

function buildTargetUrl(req: Request, pathParts: string[] | string | undefined): string {
  const base = apiBaseUrlServer();
  const parts = Array.isArray(pathParts) ? pathParts : pathParts ? [pathParts] : [];
  const joined = parts.map((p) => encodeURIComponent(p)).join("/");

  const incoming = new URL(req.url);
  const qs = incoming.search;

  return `${base}/${joined}${qs}`;
}

function filteredHeaders(req: Request): Headers {
  const headers = new Headers();
  for (const [key, value] of req.headers.entries()) {
    const k = key.toLowerCase();
    if (k === "host" || k === "connection" || k === "content-length") continue;
    // Let the upstream set its own encoding.
    if (k === "accept-encoding") continue;
    headers.set(key, value);
  }
  return headers;
}

async function proxy(req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path } = await ctx.params;
  const target = buildTargetUrl(req, path);

  const method = req.method.toUpperCase();
  const hasBody = !(method === "GET" || method === "HEAD");

  const upstream = await fetch(target, {
    method,
    headers: filteredHeaders(req),
    body: hasBody ? await req.arrayBuffer() : undefined,
    cache: "no-store",
    redirect: "manual",
  });

  // Stream body through; preserve status + most headers.
  const resHeaders = new Headers(upstream.headers);
  // Avoid leaking hop-by-hop headers.
  resHeaders.delete("content-encoding");
  resHeaders.delete("transfer-encoding");
  resHeaders.delete("content-length");

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: resHeaders,
  });
}

export async function GET(req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, ctx);
}
export async function POST(req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, ctx);
}
export async function PUT(req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, ctx);
}
export async function PATCH(req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, ctx);
}
export async function DELETE(req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, ctx);
}
export async function OPTIONS(req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, ctx);
}
export async function HEAD(req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, ctx);
}
