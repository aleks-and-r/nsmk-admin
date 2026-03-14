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

export const getPlayers = async (): Promise<Player[]> => {
  const { data } = await apiClient.get<Player[]>("players/");
  return data;
};

export const getTopScorers = async (leagueId: string): Promise<Player[]> => {
  const { data } = await apiClient.get<Player[]>(`/players/top-scorers`, {
    params: { leagueId },
  });
  return data;
};
