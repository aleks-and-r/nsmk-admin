import apiClient from '@/lib/axios';

export interface Season {
  id: string;
  name: string;
  [key: string]: unknown;
}

export const getSeasons = async (): Promise<Season[]> => {
  const { data } = await apiClient.get<Season[]>('seasons');
  return data;
};

export const getSeasonById = async (id: string): Promise<Season> => {
  const { data } = await apiClient.get<Season>(`seasons/${id}`);
  return data;
};
