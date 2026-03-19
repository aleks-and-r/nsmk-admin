import { useQuery } from '@tanstack/react-query';
import {
  getLeagues,
  getLeagueById,
  getLeagueLeaders,
  getLeagueResults,
  getLeagueSchedule,
  getLeagueStandings,
} from '@/services/leagues.service';

export const useLeagues = () => {
  return useQuery({
    queryKey: ['leagues'],
    queryFn: getLeagues,
  });
};

export const useLeague = (id: string) => {
  return useQuery({
    queryKey: ['leagues', id],
    queryFn: () => getLeagueById(id),
    enabled: !!id,
  });
};

export const useLeagueLeaders = (id: string) => {
  return useQuery({
    queryKey: ['leagues', id, 'leaders'],
    queryFn: () => getLeagueLeaders(id),
    enabled: !!id,
  });
};

export const useLeagueResults = (id: string) => {
  return useQuery({
    queryKey: ['leagues', id, 'results'],
    queryFn: () => getLeagueResults(id),
    enabled: !!id,
  });
};

export const useLeagueSchedule = (id: string) => {
  return useQuery({
    queryKey: ['leagues', id, 'schedule'],
    queryFn: () => getLeagueSchedule(id),
    enabled: !!id,
  });
};

export const useLeagueStandings = (id: string) => {
  return useQuery({
    queryKey: ['leagues', id, 'standings'],
    queryFn: () => getLeagueStandings(id),
    enabled: !!id,
  });
};
