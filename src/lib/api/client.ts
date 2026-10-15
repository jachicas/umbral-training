import { redirect } from "next/navigation";
import { getAccessToken } from "@/lib/supabase/auth";
import { apiUrl } from "@/lib/supabase/env";

/** 422 from the API: Spanish messages keyed by the API's request field ("goal.raceDate"). */
export class ApiValidationError extends Error {
  constructor(public readonly errors: Record<string, string[]>) {
    super(Object.values(errors)[0]?.[0] ?? "Datos no válidos.");
  }
}

export class ApiNotFoundError extends Error {}

type Method = "GET" | "POST" | "PUT" | "DELETE";

/**
 * Calls the Laravel API as the signed-in user and returns the response's
 * `data`. Server-side only: the token never reaches the browser.
 */
export async function apiFetch<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${apiUrl()}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${await getAccessToken()}`,
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
