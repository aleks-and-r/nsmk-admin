"use client";

import DataTable from "@/components/admin/DataTable";

interface TeamRow {
  id: number;
  name: string;
  club_name: string;
  season_name: string;
  age_group_label: string;
  is_active: boolean;
}

const teamColumns = [
  { key: "name", header: "Name" },
  { key: "club_name", header: "Club" },
  { key: "season_name", header: "Season" },
  { key: "age_group_label", header: "Age Group" },
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

export default function TeamsPage() {
  return (
    <DataTable<TeamRow>
      title="Teams"
      url="teams/"
      columns={teamColumns}
      editBasePath="/teams"
    />
  );
}
