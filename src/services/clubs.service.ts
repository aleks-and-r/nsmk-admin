import apiClient from '@/lib/axios';

export interface Club {
  id: string;
  name: string;
  shortName: string;
  city: string;
  founded: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
}

export const getClubs = async (): Promise<Club[]> => {
  const { data } = await apiClient.get<Club[]>('clubs');
  return data;
};

export const getClubById = async (id: string): Promise<Club> => {
  const { data } = await apiClient.get<Club>(`/clubs/${id}`);
  return data;
};
