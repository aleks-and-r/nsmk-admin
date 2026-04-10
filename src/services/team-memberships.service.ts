import apiClient from '@/lib/axios';

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
