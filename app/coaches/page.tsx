"use client";

import { useQueryClient } from "@tanstack/react-query";
import DataTable from "@/components/admin/DataTable";
import { importCoaches } from "@/services/coaches.service";

interface Coach {
  id: number;
  first_name: string;
  last_name: string;
  birth_year: number;
}

const coachColumns = [
  {
    key: "first_name",
    header: "Name",
    render: (_: unknown, row: Coach) => `${row.first_name} ${row.last_name}`,
  },
  { key: "birth_year", header: "Year of Birth" },
];

export default function CoachesPage() {
  const queryClient = useQueryClient();

  async function handleImport(file: File) {
    await importCoaches(file);
    await queryClient.invalidateQueries({ queryKey: ["coaches/"] });
  }

  return (
    <DataTable<Coach>
      title="Coaches"
      url="coaches/"
      columns={coachColumns}
      editBasePath="/coaches"
      idKey="id"
      onImport={handleImport}
    />
  );
}
