import apiClient from '@/lib/axios';
import type { PaginatedResponse } from '@/types/api';

export type GameStatus =
  | 'scheduled'
  | 'in_progress'
  | 'finished'
  | 'cancelled'
  | 'postponed';

export interface Game {
  id: number;
  league: number;
  round: number | null;
  home_team: number;
  away_team: number;
  scheduled_at: string;
  home_score: number | null;
  away_score: number | null;
  status: GameStatus;
  league_name: string;
  round_name: string;
  home_team_name: string;
  away_team_name: string;
}

export interface GameDetail {
  id: number;
  league: number;
  round: number | null;
  playoff_bracket: number | null;
  home_team: number;
  away_team: number;
  venue: number | null;
  scheduled_at: string;
  court_name: string;
  home_score: number | null;
  away_score: number | null;
  home_q1: number | null;
  home_q2: number | null;
  home_q3: number | null;
  home_q4: number | null;
  away_q1: number | null;
  away_q2: number | null;
  away_q3: number | null;
  away_q4: number | null;
  status: GameStatus;
  notes: string;
  league_name: string;
  round_name: string;
  home_team_name: string;
  away_team_name: string;
  venue_name: string;
  quarter_scores_display: string;
}

export interface GamePayload {
  league: number;
  round?: number | null;
  playoff_bracket?: number | null;
  home_team: number;
  away_team: number;
  venue?: number | null;
  scheduled_at: string;
  court_name?: string;
  status: GameStatus;
  notes?: string;
}

export interface GameScorePayload {
  home_q1?: number | null;
  home_q2?: number | null;
  home_q3?: number | null;
  home_q4?: number | null;
  away_q1?: number | null;
  away_q2?: number | null;
  away_q3?: number | null;
  away_q4?: number | null;
  status?: GameStatus;
}

export const getGames = async (): Promise<PaginatedResponse<Game>> => {
  const { data } = await apiClient.get<PaginatedResponse<Game>>('games/');
  return data;
};

export const getGameById = async (id: string): Promise<GameDetail> => {
  const { data } = await apiClient.get<GameDetail>(`games/${id}/`);
  return data;
};

export const createGame = async (payload: GamePayload): Promise<GameDetail> => {
  const { data } = await apiClient.post<GameDetail>('games/', payload);
  return data;
};

export const updateGame = async (
  id: string,
  payload: Partial<GamePayload>,
): Promise<GameDetail> => {
  const { data } = await apiClient.patch<GameDetail>(`games/${id}/`, payload);
  return data;
};

export const updateGameScore = async (
  id: string,
  payload: GameScorePayload,
): Promise<GameDetail> => {
  const { data } = await apiClient.patch<GameDetail>(
    `games/${id}/score/`,
    payload,
  );
  return data;
};

export const getGameStats = async (id: string): Promise<GameDetail> => {
  const { data } = await apiClient.get<GameDetail>(`games/${id}/stats/`);
  return data;
};
