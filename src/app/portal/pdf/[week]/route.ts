import { getPortalWeekPdf } from "@/lib/services/portal";
import { download } from "@/app/workouts/pdf/download";

/** The athlete's own week as a PDF, once the coach sent it. */
export async function GET(_request: Request, ctx: RouteContext<"/portal/pdf/[week]">) {
  const { week } = await ctx.params;
  return download(() => getPortalWeekPdf(week));
}
