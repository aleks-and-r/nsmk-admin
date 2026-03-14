import { useQuery } from "@tanstack/react-query";
import { getPlayers, getTopScorers } from "@/services/players.service";

export const usePlayers = () => {
  return useQuery({
    queryKey: ["players"],
    queryFn: getPlayers,
    staleTime: 1000 * 60 * 5,
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
