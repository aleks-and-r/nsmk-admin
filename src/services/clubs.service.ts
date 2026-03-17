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

export interface ClubDetail {
  id: number;
  name: string;
  short_name: string;
  owner: string;
  email: string;
  phone: string;
  website: string;
  facebook_url: string;
  twitter_url: string;
  instagram_url: string;
}

export const getClubs = async (): Promise<Club[]> => {
  const { data } = await apiClient.get<Club[]>('clubs/');
  return data;
};

export const getClubById = async (id: string): Promise<ClubDetail> => {
  const { data } = await apiClient.get<ClubDetail>(`clubs/${id}/`);
  return data;
};

export const createClub = async (
  payload: FormData | Partial<ClubDetail>,
): Promise<ClubDetail> => {
  const { data } = await apiClient.post<ClubDetail>('clubs/', payload);
  return data;
};

export const updateClub = async (
  id: string,
  payload: FormData | Partial<ClubDetail>,
): Promise<ClubDetail> => {
  const { data } = await apiClient.patch<ClubDetail>(`clubs/${id}/`, payload);
  return data;
};
