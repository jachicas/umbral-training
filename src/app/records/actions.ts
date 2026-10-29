"use server";

import { revalidatePath } from "next/cache";
import * as athletesService from "@/lib/services/athletes";
import { EntryErrors, type SheetEntry } from "@/lib/services/athletes";

export interface RecordSheetResult {
  savedCount?: number;
  /** The first message per refused entry, by its position in what was sent. */
  errors?: Record<number, string>;
  error?: string;
}

export async function saveRecordSheetAction(entries: SheetEntry[]): Promise<RecordSheetResult> {
  let savedCount: number;
  try {
    savedCount = (await athletesService.addRaceRecordSheet(entries)).length;
  } catch (error) {
    if (error instanceof EntryErrors) return { errors: error.entries };
    return { error: error instanceof Error ? error.message : "No se pudieron guardar las marcas." };
  }
  revalidatePath("/records", "layout");
  revalidatePath("/athletes", "layout");
  return { savedCount };
}
