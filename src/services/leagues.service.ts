import apiClient from '@/lib/axios';
import type { PaginatedResponse } from '@/types/api';

export interface LeagueTeam {
  id: number;
  club: number;
  age_group_label: string;
  season: number;
  name: string;
  is_active: boolean;
  club_name: string;
  season_name: string;
}

export interface League {
  id: number;
  season: number;
  name: string;
  age_group: string;
  reference_birth_year: number;
  points_for_win: number;
  points_for_loss: number;
  points_for_forfeit: number;
  is_active: boolean;
  season_name: string;
  teams: LeagueTeam[];
}

export const getLeagues = async (): Promise<PaginatedResponse<League>> => {
  const { data } = await apiClient.get<PaginatedResponse<League>>('leagues/');
  return data;
};

export const getLeagueById = async (id: string): Promise<League> => {
  const { data } = await apiClient.get<League>(`leagues/${id}/`);
  return data;
};

export interface LeaguePayload {
  season: number;
  name: string;
  age_group: string;
  reference_birth_year: number;
  points_for_win: number;
  points_for_loss: number;
  points_for_forfeit: number;
  is_active: boolean;
}

export const createLeague = async (payload: LeaguePayload): Promise<League> => {
  const { data } = await apiClient.post<League>('leagues/', payload);
  return data;
};

export const updateLeague = async (
  id: string,
  payload: Partial<LeaguePayload>,
): Promise<League> => {
  const { data } = await apiClient.patch<League>(`leagues/${id}/`, payload);
  return data;
};

export const deleteLeague = async (id: string): Promise<void> => {
  await apiClient.delete(`leagues/${id}/`);
};

export const getLeagueLeaders = async (id: string): Promise<unknown> => {
  const { data } = await apiClient.get(`leagues/${id}/leaders/`);
  return data;
};

export const getLeagueResults = async (id: string): Promise<unknown> => {
  const { data } = await apiClient.get(`leagues/${id}/results/`);
  return data;
};

export const getLeagueSchedule = async (id: string): Promise<unknown> => {
  const { data } = await apiClient.get(`leagues/${id}/schedule/`);
  return data;
};

export const getLeagueStandings = async (id: string): Promise<unknown> => {
  const { data } = await apiClient.get(`leagues/${id}/standings/`);
  return data;
};
