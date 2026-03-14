import apiClient from '@/lib/axios';

export interface Team {
  id: string;
  name: string;
  [key: string]: unknown;
}

export const getTeams = async (): Promise<Team[]> => {
  const { data } = await apiClient.get<Team[]>('teams');
  return data;
};

export const getTeamById = async (id: string): Promise<Team> => {
  const { data } = await apiClient.get<Team>(`teams/${id}`);
  return data;
};
