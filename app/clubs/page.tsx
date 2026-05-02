"use client";

import { useQueryClient } from "@tanstack/react-query";
import DataTable from "@/components/admin/DataTable";
import { importClubs } from "@/services/clubs.service";

interface Club {
  id: number;
  name: string;
  short_name: string;
  owner: string;
}

const clubColumns = [
  { key: "name", header: "Name" },
  { key: "short_name", header: "Short Name" },
  { key: "owner", header: "Owner" },
];

export default function ClubsPage() {
  const queryClient = useQueryClient();

  async function handleImport(file: File) {
    await importClubs(file);
    await queryClient.invalidateQueries({ queryKey: ["clubs/"] });
  }

  return (
    <DataTable<Club>
      title="Clubs"
      url="clubs/"
      columns={clubColumns}
      editBasePath="/clubs"
      onImport={handleImport}
    />
  );
}
