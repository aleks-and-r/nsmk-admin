import { useQuery } from '@tanstack/react-query';
import { getLeagueMemberships } from '@/services/league-memberships.service';

export const useLeagueMembershipsByLeague = (leagueId: string) => {
  return useQuery({
    queryKey: ['league-memberships/', { league: leagueId }],
    queryFn: () => getLeagueMemberships({ league: Number(leagueId) }),
    staleTime: 1000 * 60 * 5,
    enabled: !!leagueId,
  });
};

export const useLeagueMembershipsByTeam = (teamId: string) => {
  return useQuery({
    queryKey: ['league-memberships/', { team: teamId }],
    queryFn: () => getLeagueMemberships({ team: Number(teamId) }),
    staleTime: 1000 * 60 * 5,
    enabled: !!teamId,
  });
};
