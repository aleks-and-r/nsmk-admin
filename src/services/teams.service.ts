import apiClient from '@/lib/axios';
import type { PaginatedResponse } from '@/types/api';

export interface TeamPlayer {
  id: number;
  name: string;
}

export interface Team {
  id: number;
  club: number;
  age_group_label: string;
  season: number;
  name: string;
  is_active: boolean;
  club_name: string;
  season_name: string;
  players: TeamPlayer[];
  coaches: unknown[];
}

export const getTeams = async (): Promise<PaginatedResponse<Team>> => {
  const { data } = await apiClient.get<PaginatedResponse<Team>>('teams/');
  return data;
};

export const getTeamById = async (id: string): Promise<Team> => {
  const { data } = await apiClient.get<Team>(`teams/${id}/`);
  return data;
};
