"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import DataTable from "@/components/admin/DataTable";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { deleteVenue, importVenues } from "@/services/venues.service";

interface VenueRow {
  id: number;
  name: string;
  address: string;
  city: string;
  court_count: number;
  is_active: boolean;
}

const venueColumns = [
  { key: "name", header: "Name" },
  { key: "city", header: "City" },
  { key: "address", header: "Address" },
  { key: "court_count", header: "Courts" },
  {
    key: "is_active",
    header: "Status",
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

export default function VenuesPage() {
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const queryClient = useQueryClient();

  async function handleDelete() {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      await deleteVenue(deleteTargetId);
      await queryClient.invalidateQueries({ queryKey: ["venues/"] });
      setDeleteTargetId(null);
    } finally {
      setDeleting(false);
    }
  }

  async function handleImport(file: File) {
    await importVenues(file);
    await queryClient.invalidateQueries({ queryKey: ["venues/"] });
  }

  return (
    <>
      <DataTable<VenueRow>
        title="Venues"
        url="venues/"
        columns={venueColumns}
        editBasePath="/venues"
        onDelete={(id) => setDeleteTargetId(id)}
        onImport={handleImport}
      />

      <ConfirmDialog
        open={!!deleteTargetId}
        title="Delete venue"
        message="Are you sure? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTargetId(null)}
        loading={deleting}
      />
    </>
  );
}
