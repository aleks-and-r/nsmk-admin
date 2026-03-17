import apiClient from "@/lib/axios";

export interface Player {
  id: string;
  name: string;
  clubId: string;
  clubName: string;
  position: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
}

export interface PlayerDetail {
  id: number;
  short_id: string;
  first_name: string;
  last_name: string;
  birth_year: number;
  birth_date: string;
  position: string;
  full_name: string;
  club: number | null;
  club_name: string | null;
  is_active: boolean;
}

export const getPlayers = async (): Promise<Player[]> => {
  const { data } = await apiClient.get<Player[]>("players/");
  return data;
};

export const getPlayerById = async (id: string): Promise<PlayerDetail> => {
  const { data } = await apiClient.get<PlayerDetail>(`players/${id}/`);
  return data;
};

export const createPlayer = async (
  payload: FormData | Partial<PlayerDetail>,
): Promise<PlayerDetail> => {
  const { data } = await apiClient.post<PlayerDetail>('players/', payload);
  return data;
};

export const updatePlayer = async (
  id: string,
  payload: FormData | Partial<PlayerDetail>,
): Promise<PlayerDetail> => {
  const { data } = await apiClient.patch<PlayerDetail>(`players/${id}/`, payload);
  return data;
};

export const getTopScorers = async (leagueId: string): Promise<Player[]> => {
  const { data } = await apiClient.get<Player[]>(`/players/top-scorers`, {
    params: { leagueId },
  });
  return data;
};
