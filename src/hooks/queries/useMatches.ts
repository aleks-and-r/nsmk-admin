import { useQuery } from '@tanstack/react-query';
import { getMatches, getMatchById } from '@/services/matches.service';

export const useMatches = () => {
  return useQuery({
    queryKey: ['matches'],
    queryFn: getMatches,
    staleTime: 1000 * 60 * 5,
  });
};

export const useMatch = (id: string) => {
  return useQuery({
    queryKey: ['matches', id],
    queryFn: () => getMatchById(id),
    staleTime: 1000 * 60 * 5,
    enabled: !!id,
  });
};
