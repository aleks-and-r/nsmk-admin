import { useQuery } from '@tanstack/react-query';
import { getTeams, getTeamById } from '@/services/teams.service';
import { getTeamMembershipsByPlayer } from '@/services/team-memberships.service';

export const useTeams = () => {
  return useQuery({
    queryKey: ['teams/'],
    queryFn: getTeams,
    staleTime: 1000 * 60 * 5,
  });
};

export const useTeam = (id: string) => {
  return useQuery({
    queryKey: ['teams/', id],
    queryFn: () => getTeamById(id),
    staleTime: 1000 * 60 * 5,
    enabled: !!id,
  });
};

export const usePlayerTeamMemberships = (playerId: number | undefined) => {
  return useQuery({
    queryKey: ['team-memberships/', { player: playerId }],
    queryFn: () => getTeamMembershipsByPlayer(playerId!),
    staleTime: 1000 * 60 * 5,
    enabled: !!playerId,
  });
};
