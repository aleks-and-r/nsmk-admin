"use client";

import DataTable from "@/components/admin/DataTable";

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
  return (
    <DataTable<Club>
      title="Clubs"
      url="clubs/"
      columns={clubColumns}
      editBasePath="/clubs"
    />
  );
}
