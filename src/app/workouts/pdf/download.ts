import { unstable_rethrow } from "next/navigation";
import type { DownloadFile } from "@/lib/domain/repositories";

/** The file as a download, or the API's message as plain text when there's nothing to download. */
export async function download(load: () => Promise<DownloadFile>): Promise<Response> {
  try {
    const file = await load();
    return new Response(file.body, {
      headers: { "Content-Type": file.contentType, "Content-Disposition": file.disposition },
    });
  } catch (error) {
    unstable_rethrow(error); // a sign-in redirect
    const message = error instanceof Error ? error.message : "No se pudo generar el PDF.";
    return new Response(message, { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}
