"use client";

import { useQueryClient } from "@tanstack/react-query";
import DataTable from "@/components/admin/DataTable";
import { importPlayers } from "@/services/players.service";

interface Player {
  id: number;
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
  const queryClient = useQueryClient();

  async function handleImport(file: File) {
    await importPlayers(file);
    await queryClient.invalidateQueries({ queryKey: ["players/"] });
  }

  return (
    <DataTable<Player>
      title="Players"
      url="players/"
      columns={playerColumns}
      editBasePath="/players"
      idKey="id"
      onImport={handleImport}
    />
  );
}
