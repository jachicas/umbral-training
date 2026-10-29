/** Form fields an error can be shown next to; "general" is the form-level message. */
export type ValidationField =
  | "fullName"
  | "email"
  | "phone"
  | "birthDate"
  | "race"
  | "raceName"
  | "raceDate"
  | "raceLocation"
  | "raceSport"
  | "raceSportLabel"
  | "raceFormat"
  | "raceDistances"
  | "targetPace"
  | "targetTime"
  | "amount"
  | "time"
  | "recordedOn"
  | "paidOn"
  | "months"
  | "receipt"
  | "note"
  | "runPace"
  | "swimPace"
  | "ftp"
  | "maxHr"
  | "restHr"
  | "weeklyDays"
  | "weeklyHours"
  | "feeling"
  | "effort"
  | "completion"
  | "pain"
  | "painNote"
  | "comment"
  | "name"
  | "coachName"
  | "coachEmail"
  | "primaryColor"
  | "accentColor"
  | "sidebarColor"
  | "logo"
  | "general";

/** Input the web app couldn't even parse (e.g. "4:7x" as a pace), caught before calling the API. */
export class FieldValidationError extends Error {
  constructor(
    public field: ValidationField,
    message: string
  ) {
    super(message);
  }
}

/** A list of entries sent at once (a sheet of times) that was refused: the first message per entry, by position. */
export class EntryErrors extends Error {
  constructor(public entries: Record<number, string>) {
    super(Object.values(entries)[0] ?? "Datos no válidos.");
  }
}

/** Rule violations reported by the API (422), mapped to form fields. */
export class ValidationErrors extends Error {
  constructor(public errors: Partial<Record<ValidationField, string>>) {
    super(Object.values(errors)[0] ?? "Datos no válidos.");
  }
}
