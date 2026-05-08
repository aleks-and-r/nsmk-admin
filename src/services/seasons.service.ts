import apiClient from '@/lib/axios';
import { importFile } from '@/lib/importFile';
import type { PaginatedResponse } from '@/types/api';

export interface SeasonLeague {
  id: number;
  name: string;
}

export interface Season {
  id: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  leagues: SeasonLeague[];
}

export interface SeasonPayload {
  name: string;
  start_date?: string | null;
  end_date?: string | null;
  is_active: boolean;
}

export const getSeasons = async (): Promise<PaginatedResponse<Season>> => {
  const { data } = await apiClient.get<PaginatedResponse<Season>>('seasons/');
  return data;
};

export const getSeasonById = async (id: string): Promise<Season> => {
  const { data } = await apiClient.get<Season>(`seasons/${id}/`);
  return data;
};

export const createSeason = async (payload: SeasonPayload): Promise<Season> => {
  const { data } = await apiClient.post<Season>('seasons/', payload);
  return data;
};

export const updateSeason = async (
  id: string,
  payload: Partial<SeasonPayload>,
): Promise<Season> => {
  const { data } = await apiClient.patch<Season>(`seasons/${id}/`, payload);
  return data;
};

export const importSeasons = (file: File) => importFile('seasons/import/', file);
