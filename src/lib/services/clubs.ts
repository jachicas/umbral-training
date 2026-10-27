import { apiClubRepository } from "@/lib/db/repositories/clubs-repo.api";
import type { Club, ClubInput, Me, NewClubInput } from "@/lib/domain/clubs";

/* The API keeps and validates the clubs; this is a pass-through for the pages. */

export const listClubs = (): Promise<Club[]> => apiClubRepository.list();
export const getClub = (id: string): Promise<Club> => apiClubRepository.get(id);
export const createClub = (input: NewClubInput): Promise<Club> => apiClubRepository.create(input);
export const updateClub = (id: string, input: ClubInput): Promise<Club> => apiClubRepository.update(id, input);
export const uploadClubLogo = (id: string, form: FormData): Promise<Club> => apiClubRepository.uploadLogo(id, form);
export const removeClubLogo = (id: string): Promise<Club> => apiClubRepository.removeLogo(id);
export const resendCoachInvite = (id: string): Promise<Club> => apiClubRepository.resendCoachInvite(id);
export const suspendClub = (id: string): Promise<Club> => apiClubRepository.suspend(id);
export const reactivateClub = (id: string): Promise<Club> => apiClubRepository.reactivate(id);
export const getMe = (): Promise<Me> => apiClubRepository.me();
