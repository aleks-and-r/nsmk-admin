import type {
  Club,
  Coach,
  Game,
  League,
  LeagueMembership,
  Player,
  PlayerGameStat,
  Round,
  Season,
  Team,
  TeamMembership,
  User,
  Venue,
} from '@prisma/client';

const date = (d: Date | null | undefined): string | null =>
  d ? d.toISOString().slice(0, 10) : null;

const datetime = (d: Date | null | undefined): string | null => d?.toISOString() ?? null;

const fullName = (first: string, last: string, middle = '') =>
  [first, middle, last].filter(Boolean).join(' ');

// ── auth ──────────────────────────────────────────────────────────────────

export const serializeUser = (u: User) => ({
  id: u.id,
  username: u.username,
  email: u.email,
  first_name: u.firstName,
  last_name: u.lastName,
});

// ── clubs ─────────────────────────────────────────────────────────────────

export const serializeClub = (c: Club) => ({
  id: c.id,
  name: c.name,
  short_name: c.shortName,
  owner: c.owner,
  contact_email: c.contactEmail,
  contact_phone: c.contactPhone,
  website: c.website,
  facebook_url: c.facebookUrl,
  twitter_url: c.twitterUrl,
  instagram_url: c.instagramUrl,
  image: c.logo,
});

// ── coaches ───────────────────────────────────────────────────────────────

export const serializeCoach = (c: Coach) => ({
  id: c.id,
  first_name: c.firstName,
  last_name: c.lastName,
  middle_name: c.middleName,
  email: c.email,
  birth_year: c.birthYear,
  full_name: fullName(c.firstName, c.lastName, c.middleName),
});

// ── players ───────────────────────────────────────────────────────────────

type PlayerWithRelations = Player & {
  club?: Club | null;
  teamMemberships?: (TeamMembership & { team: Team & { club: Club } })[];
};

export const serializePlayer = (p: PlayerWithRelations) => {
  const clubs = new Map<number, { id: number; name: string }>();
  if (p.club) clubs.set(p.club.id, { id: p.club.id, name: p.club.name });
  for (const m of p.teamMemberships ?? []) {
    clubs.set(m.team.club.id, { id: m.team.club.id, name: m.team.club.name });
  }

  return {
    id: p.id,
    first_name: p.firstName,
    last_name: p.lastName,
    birth_year: p.birthYear,
    birth_date: date(p.birthDate),
    position: p.position,
    full_name: fullName(p.firstName, p.lastName),
    club: p.clubId,
    club_name: p.club?.name ?? null,
    is_active: p.isActive,
    image: p.photo,
    clubs: [...clubs.values()],
  };
};

// ── seasons ───────────────────────────────────────────────────────────────

type SeasonWithLeagues = Season & { leagues?: League[] };

export const serializeSeason = (s: SeasonWithLeagues) => ({
  id: s.id,
  name: s.name,
  start_date: date(s.startDate),
  end_date: date(s.endDate),
  is_active: s.isActive,
  leagues: (s.leagues ?? []).map((l) => ({ id: l.id, name: l.name })),
});

// ── leagues ───────────────────────────────────────────────────────────────

type LeagueWithRelations = League & {
  season?: Season | null;
  memberships?: (LeagueMembership & { team: Team })[];
};

export const serializeLeague = (l: LeagueWithRelations) => ({
  id: l.id,
  season: l.seasonId,
  name: l.name,
  age_group: l.ageGroup,
  reference_birth_year: l.referenceBirthYear,
  points_for_win: l.pointsForWin,
  points_for_loss: l.pointsForLoss,
  points_for_forfeit: l.pointsForForfeit,
  is_active: l.isActive,
  season_name: l.season?.name ?? '',
  teams: (l.memberships ?? []).map((m) => ({
    id: m.id,
    league: m.leagueId,
    team: m.teamId,
    in_competition: m.inCompetition,
    is_withdrawn: m.isWithdrawn,
    team_name: m.team.name,
  })),
});

// ── teams ─────────────────────────────────────────────────────────────────

type TeamWithRelations = Team & {
  club?: Club | null;
  season?: Season | null;
  memberships?: (TeamMembership & { player: Player })[];
};

export const serializeTeam = (t: TeamWithRelations) => ({
  id: t.id,
  club: t.clubId,
  age_group_label: t.ageGroupLabel,
  season: t.seasonId,
  name: t.name,
  is_active: t.isActive,
  club_name: t.club?.name ?? '',
  season_name: t.season?.name ?? '',
  players: (t.memberships ?? []).map((m) => ({
    id: m.player.id,
    name: fullName(m.player.firstName, m.player.lastName),
  })),
  coaches: [],
});

// ── venues ────────────────────────────────────────────────────────────────

export const serializeVenue = (v: Venue) => ({
  id: v.id,
  name: v.name,
  address: v.address,
  city: v.city,
  court_count: v.courtCount,
  is_active: v.isActive,
});

// ── games ─────────────────────────────────────────────────────────────────

type GameWithRelations = Game & {
  league?: League | null;
  round?: Round | null;
  homeTeam?: Team | null;
  awayTeam?: Team | null;
  venue?: Venue | null;
};

const quarterDisplay = (g: Game): string => {
  const pairs = [
    [g.homeQ1, g.awayQ1],
    [g.homeQ2, g.awayQ2],
    [g.homeQ3, g.awayQ3],
    [g.homeQ4, g.awayQ4],
  ].filter(([h, a]) => h != null || a != null);

  return pairs.map(([h, a]) => `${h ?? 0}:${a ?? 0}`).join(', ');
};

export const serializeGame = (g: GameWithRelations) => ({
  id: g.id,
  league: g.leagueId,
  round: g.roundId,
  playoff_bracket: g.playoffBracket,
  home_team: g.homeTeamId,
  away_team: g.awayTeamId,
  venue: g.venueId,
  scheduled_at: datetime(g.scheduledAt),
  court_name: g.courtName,
  home_score: g.homeScore,
  away_score: g.awayScore,
  home_q1: g.homeQ1,
  home_q2: g.homeQ2,
  home_q3: g.homeQ3,
  home_q4: g.homeQ4,
  away_q1: g.awayQ1,
  away_q2: g.awayQ2,
  away_q3: g.awayQ3,
  away_q4: g.awayQ4,
  status: g.status,
  notes: g.notes,
  league_name: g.league?.name ?? '',
  round_name: g.round?.name ?? '',
  home_team_name: g.homeTeam?.name ?? '',
  away_team_name: g.awayTeam?.name ?? '',
  venue_name: g.venue?.name ?? '',
  quarter_scores_display: quarterDisplay(g),
});

// ── memberships ───────────────────────────────────────────────────────────

type TeamMembershipWithRelations = TeamMembership & {
  player?: Player | null;
  team?: Team | null;
};

export const serializeTeamMembership = (m: TeamMembershipWithRelations) => ({
  id: m.id,
  player: m.playerId,
  team: m.teamId,
  number: m.number,
  loan: m.loan,
  is_active: m.isActive,
  joined_at: date(m.joinedAt),
  left_at: date(m.leftAt),
  player_name: m.player ? fullName(m.player.firstName, m.player.lastName) : '',
  team_name: m.team?.name ?? '',
});

type LeagueMembershipWithRelations = LeagueMembership & {
  league?: League | null;
  team?: Team | null;
};

export const serializeLeagueMembership = (m: LeagueMembershipWithRelations) => ({
  id: m.id,
  league: m.leagueId,
  team: m.teamId,
  in_competition: m.inCompetition,
  is_withdrawn: m.isWithdrawn,
  team_name: m.team?.name ?? '',
  league_name: m.league?.name ?? '',
});

// ── stats ─────────────────────────────────────────────────────────────────

type StatWithRelations = PlayerGameStat & {
  player?: Player | null;
  team?: Team | null;
};

export const serializePlayerGameStat = (s: StatWithRelations) => ({
  id: s.id,
  game: s.gameId,
  player: s.playerId,
  player_name: s.player ? fullName(s.player.firstName, s.player.lastName) : '',
  team: s.teamId,
  team_name: s.team?.name ?? '',
  ft_made: s.ftMade,
  two_pt_made: s.twoPtMade,
  three_pt_made: s.threePtMade,
  fouls: s.fouls,
  points: s.ftMade + s.twoPtMade * 2 + s.threePtMade * 3,
});
