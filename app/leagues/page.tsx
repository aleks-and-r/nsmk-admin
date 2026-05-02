"use client";

import { useQueryClient } from "@tanstack/react-query";
import DataTable from "@/components/admin/DataTable";
import { importLeagues } from "@/services/leagues.service";

interface League {
  id: number;
  name: string;
  season_name: string;
  age_group: string;
  reference_birth_year: number;
  is_active: boolean;
}

const leagueColumns = [
  { key: "name", header: "Name" },
  { key: "season_name", header: "Season" },
  { key: "age_group", header: "Age Group" },
  { key: "reference_birth_year", header: "Birth Year" },
  {
    key: "is_active",
    header: "Active",
    render: (value: unknown) => (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
          value
            ? "bg-green-500/10 text-green-600"
            : "bg-foreground/10 text-foreground/50"
        }`}
      >
        {value ? "Active" : "Inactive"}
      </span>
    ),
  },
];

export default function LeaguesPage() {
  const queryClient = useQueryClient();

  async function handleImport(file: File) {
    await importLeagues(file);
    await queryClient.invalidateQueries({ queryKey: ["leagues/"] });
  }

  return (
    <DataTable<League>
      title="Leagues"
      url="leagues/"
      columns={leagueColumns}
      editBasePath="/leagues"
      onImport={handleImport}
    />
  );
}
