import apiClient from '@/lib/axios';
import type { PaginatedResponse } from '@/types/api';

export interface LeagueMembership {
  id: number;
  league: number;
  team: number;
  in_competition: boolean;
  is_withdrawn: boolean;
  team_name: string;
}

export interface LeagueMembershipPayload {
  league: number;
  team: number;
  in_competition?: boolean;
  is_withdrawn?: boolean;
}

export const getLeagueMemberships = async (params: {
  league?: number;
  team?: number;
}): Promise<PaginatedResponse<LeagueMembership>> => {
  const query = new URLSearchParams();
  if (params.league != null) query.set('league', String(params.league));
  if (params.team != null) query.set('team', String(params.team));
  const { data } = await apiClient.get<PaginatedResponse<LeagueMembership>>(
    `league-memberships/?${query}`,
  );
  return data;
};

export const createLeagueMembership = async (
  payload: LeagueMembershipPayload,
): Promise<LeagueMembership> => {
  const { data } = await apiClient.post<LeagueMembership>('league-memberships/', payload);
  return data;
};

export const updateLeagueMembership = async (
  id: number,
  payload: Partial<LeagueMembershipPayload>,
): Promise<LeagueMembership> => {
  const { data } = await apiClient.patch<LeagueMembership>(`league-memberships/${id}/`, payload);
  return data;
};

export const deleteLeagueMembership = async (id: number): Promise<void> => {
  await apiClient.delete(`league-memberships/${id}/`);
};
