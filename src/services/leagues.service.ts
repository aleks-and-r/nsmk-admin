import apiClient from '@/lib/axios';
import { importFile } from '@/lib/importFile';
import type { PaginatedResponse } from '@/types/api';

export interface LeagueTeam {
  id: number;
  league: number;
  team: number;
  in_competition: boolean;
  is_withdrawn: boolean;
  team_name: string;
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
  reference_birth_year?: number;
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

export interface TeamStatsSummary {
  team_name: string;
  season_name: string;
  league_name: string;
  games_played: number;
  points: number;
  ft_made: number;
  two_pt_made: number;
  three_pt_made: number;
  fouls: number;
  ppg: number;
  ft_made_pg: number;
  two_pt_made_pg: number;
  three_pt_made_pg: number;
  fouls_pg: number;
}

export interface RefreshSummariesResponse {
  detail: string;
  league_id: number;
  skipped: boolean;
}

export const getLeagueTeamStats = async (leagueId: string): Promise<TeamStatsSummary[]> => {
  const { data } = await apiClient.get<TeamStatsSummary[]>(`leagues/${leagueId}/team-stats/`);
  return data;
};

export const refreshLeagueSummaries = async (leagueId: string): Promise<RefreshSummariesResponse> => {
  const { data } = await apiClient.post<RefreshSummariesResponse>(`leagues/${leagueId}/refresh-summaries/`);
  return data;
};

export const importLeagues = (file: File) => importFile('leagues/import/', file);
