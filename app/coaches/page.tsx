"use client";

import DataTable from "@/components/admin/DataTable";

interface Coach {
  id: number;
  short_id: string;
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
  return (
    <DataTable<Coach>
      title="Coaches"
      url="coaches/"
      columns={coachColumns}
      editBasePath="/coaches"
      idKey="short_id"
    />
  );
}
