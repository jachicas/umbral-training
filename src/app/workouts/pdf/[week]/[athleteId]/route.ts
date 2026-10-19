import { getWeekPdf } from "@/lib/services/workouts";
import { download } from "../../download";

/** The athlete's week as they receive it. */
export async function GET(_request: Request, ctx: RouteContext<"/workouts/pdf/[week]/[athleteId]">) {
  const { week, athleteId } = await ctx.params;
  return download(() => getWeekPdf(athleteId, week));
}
