import apiClient from '@/lib/axios';
import type { PaginatedResponse } from '@/types/api';

export interface TeamMembership {
  id: number;
  player: number;
  team: number;
  number: number | null;
  loan: boolean;
  is_active: boolean;
  joined_at: string | null;
  left_at: string | null;
  player_name: string;
  team_name: string;
}

export interface TeamMembershipPayload {
  player: number;
  team: number;
  number?: number | null;
  loan?: boolean;
  is_active?: boolean;
  joined_at?: string | null;
  left_at?: string | null;
}

export const createTeamMembership = async (
  payload: TeamMembershipPayload,
): Promise<TeamMembership> => {
  const { data } = await apiClient.post<TeamMembership>(
    'team-memberships/',
    payload,
  );
  return data;
};

export const getTeamMembershipsByPlayer = async (
  playerId: number,
): Promise<PaginatedResponse<TeamMembership>> => {
  const { data } = await apiClient.get<PaginatedResponse<TeamMembership>>(
    `team-memberships/?player=${playerId}`,
  );
  return data;
};

export const getTeamMembershipsByTeam = async (
  teamId: number,
): Promise<PaginatedResponse<TeamMembership>> => {
  const { data } = await apiClient.get<PaginatedResponse<TeamMembership>>(
    `team-memberships/?team=${teamId}`,
  );
  return data;
};

export const updateTeamMembership = async (
  id: number,
  payload: Partial<TeamMembershipPayload>,
): Promise<TeamMembership> => {
  const { data } = await apiClient.patch<TeamMembership>(`team-memberships/${id}/`, payload);
  return data;
};

export const deleteTeamMembership = async (id: number): Promise<void> => {
  await apiClient.delete(`team-memberships/${id}/`);
};

export const reactivateTeamMembership = async (
  id: number,
  patch: Partial<TeamMembershipPayload>,
): Promise<TeamMembership> => {
  const { data } = await apiClient.patch<TeamMembership>(
    `team-memberships/${id}/?include_inactive=true`,
    patch,
  );
  return data;
};

export const findInactiveTeamMembership = async (
  playerId: number,
  teamId: number,
): Promise<TeamMembership | null> => {
  const { data } = await apiClient.get<PaginatedResponse<TeamMembership>>(
    `team-memberships/?include_inactive=true&player=${playerId}&team=${teamId}`,
  );
  return data.results.find((m) => !m.is_active) ?? null;
};

export const bulkUpdateTeamMemberships = async (
  ids: number[],
  patch: { is_active: boolean },
): Promise<void> => {
  await apiClient.patch('team-memberships/bulk/', ids.map((id) => ({ id, ...patch })));
};
