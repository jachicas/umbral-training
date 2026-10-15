/**
 * Server-only settings. None are `NEXT_PUBLIC_`: sign-in runs in Server
 * Actions, so the browser never talks to Supabase or the API directly, and
 * the Docker image doesn't need them at build time.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set.`);
  return value;
}

export const supabaseUrl = () => required("SUPABASE_URL");
export const supabasePublishableKey = () => required("SUPABASE_PUBLISHABLE_KEY");
export const apiUrl = () => required("API_URL").replace(/\/$/, "");
