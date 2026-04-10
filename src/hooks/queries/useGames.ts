import { useQuery } from '@tanstack/react-query';
import {
  getGames,
  getGameById,
  getGameStats,
} from '@/services/games.service';

export const useGames = () => {
  return useQuery({
    queryKey: ['games'],
    queryFn: getGames,
  });
};

export const useGame = (id: string) => {
  return useQuery({
    queryKey: ['games', id],
    queryFn: () => getGameById(id),
    enabled: !!id,
  });
};

export const useGameStats = (id: string) => {
  return useQuery({
    queryKey: ['games', id, 'stats'],
    queryFn: () => getGameStats(id),
    enabled: !!id,
  });
};
