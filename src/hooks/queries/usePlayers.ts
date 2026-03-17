import { useQuery } from "@tanstack/react-query";
import { getPlayers, getPlayerById, getTopScorers } from "@/services/players.service";

export const usePlayers = () => {
  return useQuery({
    queryKey: ["players"],
    queryFn: getPlayers,
    staleTime: 1000 * 60 * 5,
  });
};

export const usePlayerById = (id: string) => {
  return useQuery({
    queryKey: ["players", id],
    queryFn: () => getPlayerById(id),
    staleTime: 1000 * 60 * 5,
    enabled: !!id,
  });
};

export const useTopScorers = (leagueId: string) => {
  return useQuery({
    queryKey: ["topScorers", leagueId],
    queryFn: () => getTopScorers(leagueId),
    staleTime: 1000 * 60 * 5,
    enabled: !!leagueId,
  });
};
