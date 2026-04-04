"use client";

import DataTable from "@/components/admin/DataTable";

interface Season {
  id: number;
  code: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

const seasonColumns = [
  { key: "name", header: "Name" },
  { key: "code", header: "Code" },
  { key: "start_date", header: "Start Date" },
  { key: "end_date", header: "End Date" },
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

export default function SeasonsPage() {
  return (
    <DataTable<Season>
      title="Seasons"
      url="seasons/"
      columns={seasonColumns}
      editBasePath="/seasons"
    />
  );
}
