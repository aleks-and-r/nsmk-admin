import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ADMIN_USERNAME = process.env.SEED_ADMIN_USERNAME ?? 'admin';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'admin123';

async function main() {
  await prisma.user.upsert({
    where: { username: ADMIN_USERNAME },
    update: {},
    create: {
      username: ADMIN_USERNAME,
      email: 'admin@nsmk.local',
      firstName: 'NSMK',
      lastName: 'Admin',
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
    },
  });

  const season = await prisma.season.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: '2025/2026',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-06-30'),
      isActive: true,
    },
  });

  const league = await prisma.league.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Pioniri U14',
      ageGroup: 'U14',
      referenceBirthYear: 2012,
      seasonId: season.id,
    },
  });

  const venue = await prisma.venue.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'SPENS Mala sala', city: 'Novi Sad', courtCount: 2 },
  });

  const clubNames = ['KK Vojvodina', 'KK Novi Sad', 'KK Dunav'];
  const teams = [];

  for (const [index, name] of clubNames.entries()) {
    const club = await prisma.club.upsert({
      where: { id: index + 1 },
      update: {},
      create: {
        name,
        shortName: name.replace('KK ', ''),
        owner: 'NSMK',
        contactEmail: `info@${name.toLowerCase().replace(/\s+/g, '')}.rs`,
      },
    });

    const team = await prisma.team.upsert({
      where: { id: index + 1 },
      update: {},
      create: {
        name: `${club.shortName} U14`,
        ageGroupLabel: 'U14',
        clubId: club.id,
        seasonId: season.id,
      },
    });
    teams.push(team);

    await prisma.leagueMembership.upsert({
      where: { leagueId_teamId: { leagueId: league.id, teamId: team.id } },
      update: {},
      create: { leagueId: league.id, teamId: team.id },
    });

    for (let p = 1; p <= 5; p++) {
      const player = await prisma.player.upsert({
        where: { id: index * 5 + p },
        update: {},
        create: {
          firstName: `Igrac${p}`,
          lastName: club.shortName,
          birthYear: 2012,
          position: 'G',
          clubId: club.id,
        },
      });

      await prisma.teamMembership.upsert({
        where: { playerId_teamId: { playerId: player.id, teamId: team.id } },
        update: {},
        create: { playerId: player.id, teamId: team.id, number: p },
      });
    }
  }

  await prisma.game.upsert({
    where: { id: 1 },
    update: {},
    create: {
      leagueId: league.id,
      homeTeamId: teams[0].id,
      awayTeamId: teams[1].id,
      venueId: venue.id,
      scheduledAt: new Date('2025-10-04T10:00:00Z'),
      status: 'scheduled',
    },
  });

  console.log(`Seeded. Login with ${ADMIN_USERNAME} / ${ADMIN_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
