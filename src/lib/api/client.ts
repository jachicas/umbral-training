import { redirect } from "next/navigation";
import { getAccessToken } from "@/lib/supabase/auth";
import { apiUrl } from "@/lib/supabase/env";
import { getViewedClubId } from "./viewing";

/** 422 from the API: Spanish messages keyed by the API's request field ("goal.raceDate"). */
export class ApiValidationError extends Error {
  constructor(public readonly errors: Record<string, string[]>) {
    super(Object.values(errors)[0]?.[0] ?? "Datos no válidos.");
  }
}

export class ApiNotFoundError extends Error {}

type Method = "GET" | "POST" | "PUT" | "DELETE";

/** A file the API serves (a PDF, a zip), passed through as is. */
export interface ApiFile {
  body: ArrayBuffer;
  contentType: string;
  /** The API's Content-Disposition, with the file name. */
  disposition: string;
}

/**
 * The signed-in user's token, and the club the super admin is reading, if
 * any (the API ignores it for anyone else).
 */
async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { Accept: "application/json", Authorization: `Bearer ${await getAccessToken()}` };
  const clubId = await getViewedClubId();
  if (clubId) headers["X-Club-Id"] = clubId;
  return headers;
}

/**
 * Calls the Laravel API as the signed-in user and returns the response's
 * `data`. Server-side only: the token never reaches the browser.
 */
export async function apiFetch<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${apiUrl()}${path}`, {
    method,
    headers: {
      ...(await authHeaders()),
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  if (response.ok) {
    // 204 No Content (deletes) has no body to parse.
    if (response.status === 204) return undefined as T;
    const json = (await response.json()) as { data: T };
    return json.data;
  }

  const json = (await response.json().catch(() => ({}))) as { message?: string; errors?: Record<string, string[]> };

  switch (response.status) {
    case 401:
      redirect("/login");
    case 404:
      throw new ApiNotFoundError(json.message ?? "No encontrado.");
    case 422:
      throw new ApiValidationError(json.errors ?? {});
    default:
      // 403 ("Esta cuenta no es de un coach.") and anything unexpected.
      throw new Error(json.message ?? `La API respondió ${response.status}.`);
  }
}

/** POSTs a multipart form (a file upload) as the signed-in user. Errors are thrown like apiFetch's. */
export async function apiUpload<T>(path: string, form: FormData): Promise<T> {
  const response = await fetch(`${apiUrl()}${path}`, {
    method: "POST",
    // fetch sets the multipart Content-Type with its boundary.
    headers: await authHeaders(),
    body: form,
    cache: "no-store",
  });

  if (response.ok) return ((await response.json()) as { data: T }).data;

  const json = (await response.json().catch(() => ({}))) as { message?: string; errors?: Record<string, string[]> };
  if (response.status === 401) redirect("/login");
  if (response.status === 404) throw new ApiNotFoundError(json.message ?? "No encontrado.");
  if (response.status === 422) throw new ApiValidationError(json.errors ?? {});
  // 413: the web server in front of the API refused the file.
  if (response.status === 413) throw new ApiValidationError({ receipt: ["El comprobante pesa demasiado."] });
  throw new Error(json.message ?? `La API respondió ${response.status}.`);
}

/** GETs a file from the API as the signed-in user. Errors are thrown like apiFetch's. */
export async function apiFile(path: string): Promise<ApiFile> {
  const response = await fetch(`${apiUrl()}${path}`, {
    headers: await authHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    const json = (await response.json().catch(() => ({}))) as { message?: string; errors?: Record<string, string[]> };
    if (response.status === 401) redirect("/login");
    if (response.status === 404) throw new ApiNotFoundError(json.message ?? "No encontrado.");
    if (response.status === 422) throw new ApiValidationError(json.errors ?? {});
    throw new Error(json.message ?? `La API respondió ${response.status}.`);
  }

  return {
    body: await response.arrayBuffer(),
    contentType: response.headers.get("Content-Type") ?? "application/octet-stream",
    disposition: response.headers.get("Content-Disposition") ?? "attachment",
  };
}
