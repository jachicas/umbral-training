/**
 * Server-only settings. None are `NEXT_PUBLIC_`: sign-in runs in Server
 * Actions and the API is called server-side, so the browser never talks to
 * the API and the Docker image doesn't need them at build time.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set.`);
  return value;
}

export const apiUrl = () => required("API_URL").replace(/\/$/, "");
