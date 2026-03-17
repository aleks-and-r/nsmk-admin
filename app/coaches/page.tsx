"use client";

import DataTable from "@/components/admin/DataTable";

interface Coach {
  id: number;
  full_name: string;
  birth_year: number;
}

const coachColumns = [
  { key: "full_name", header: "Name" },
  { key: "birth_year", header: "Year of Birth" },
];

export default function CoachesPage() {
  return (
    <DataTable<Coach>
      title="Coaches"
      url="coaches/"
      columns={coachColumns}
      editBasePath="/coaches"
    />
  );
}
