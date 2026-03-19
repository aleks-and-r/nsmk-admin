import apiClient from '@/lib/axios';

export interface CoachDetail {
  id: number;
  first_name: string;
  last_name: string;
  middle_name: string;
  email: string;
  birth_year: number;
  full_name: string;
}

export const getCoachById = async (id: string): Promise<CoachDetail> => {
  const { data } = await apiClient.get<CoachDetail>(`coaches/${id}/`);
  return data;
};

export const createCoach = async (
  payload: FormData | Partial<CoachDetail>,
): Promise<CoachDetail> => {
  const { data } = await apiClient.post<CoachDetail>('coaches/', payload);
  return data;
};

export const updateCoach = async (
  id: string,
  payload: FormData | Partial<CoachDetail>,
): Promise<CoachDetail> => {
  const { data } = await apiClient.patch<CoachDetail>(`coaches/${id}/`, payload);
  return data;
};
