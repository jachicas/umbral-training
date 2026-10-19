import { getWeekPdfZip } from "@/lib/services/workouts";
import { download } from "../download";

/** Every athlete's PDF of the week, in a zip. */
export async function GET(_request: Request, ctx: RouteContext<"/workouts/pdf/[week]">) {
  const { week } = await ctx.params;
  return download(() => getWeekPdfZip(week));
}
