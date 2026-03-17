"use client";

import DataTable from "@/components/admin/DataTable";

interface Player {
  id: number;
  short_id: string;
  full_name: string;
  position: string;
  birth_year: number;
}

const playerColumns = [
  { key: "full_name", header: "Name" },
  { key: "position", header: "Position" },
  { key: "birth_year", header: "Year of Birth" },
];

export default function PlayersPage() {
  return (
    <DataTable<Player>
      title="Players"
      url="players/"
      columns={playerColumns}
      editBasePath="/players"
      idKey="short_id"
    />
  );
}
