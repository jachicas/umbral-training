import type { AccessStatus, Discipline, PaymentPeriodStatus } from "@/lib/domain/types";

export interface AthleteRowVM {
  id: string;
  fullName: string;
  email?: string;
  avatarColor: string;
  disciplines: Discipline[];
  isRaceGoal: boolean;
  objectiveLabel: string;
  paymentStatus: PaymentPeriodStatus;
  /** False until the coach agrees a fee — the status reads "Sin configurar" instead. */
  paymentConfigured: boolean;
  accessStatus: AccessStatus;
}
