import apiClient from '@/lib/axios';

export interface Match {
  id: string;
  homeClub: string;
  awayClub: string;
  homeScore: number;
  awayScore: number;
  date: string;
  round: number;
  status: 'scheduled' | 'live' | 'finished';
}

export const getMatches = async (): Promise<Match[]> => {
  const { data } = await apiClient.get<Match[]>('matches');
  return data;
};

export const getMatchById = async (id: string): Promise<Match> => {
  const { data } = await apiClient.get<Match>(`/matches/${id}`);
  return data;
};
