"use client";

import { useRef } from "react";
import Link from "next/link";
import Button from "./Button";
import ExportIcon from "@/components/icons/ExportIcon";
import ImportIcon from "@/components/icons/ImportIcon";
import ChevronDownIcon from "@/components/icons/ChevronDownIcon";

interface TableToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  editBasePath: string;
  exporting: boolean;
  onExport: () => void;
  importing: boolean;
  onImport?: (file: File) => Promise<void>;
}

export default function TableToolbar({
  search,
  onSearchChange,
  editBasePath,
  exporting,
  onExport,
  importing,
  onImport,
}: TableToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !onImport) return;
    try {
      await onImport(file);
    } finally {
      e.target.value = "";
    }
  }

  return (
    <div className="flex items-center justify-end gap-2 px-4 py-3 border-b border-card-border flex-wrap">
      <input
        type="text"
        placeholder="Search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="px-3 py-1.5 text-sm rounded border border-card-border bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent w-48"
      />

      <Link
        href={`${editBasePath}/new`}
        className="px-4 py-1.5 text-sm font-semibold rounded bg-accent hover:bg-accent/90 text-white transition-colors"
      >
        Add new
      </Link>

      <Button
        variant="raw"
        size="icon"
        onClick={onExport}
        disabled={exporting}
        className="bg-btn-export hover:bg-btn-export/90 text-white"
        aria-label="Export"
        title="Export to CSV"
      >
        <ExportIcon className="w-4 h-4" />
      </Button>

      <Button
        variant="raw"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        disabled={importing || !onImport}
        className="bg-btn-download hover:bg-btn-download/90 disabled:opacity-40 disabled:cursor-not-allowed text-white"
        aria-label="Import"
        title={onImport ? "Import CSV / XLSX" : "Import not available"}
      >
        <ImportIcon className="w-4 h-4" />
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={handleImportFile}
      />

      <Button
        variant="raw"
        size="icon"
        className="border border-card-border hover:bg-black/5 text-foreground/50"
        aria-label="More options"
      >
        <ChevronDownIcon className="w-4 h-4" />
      </Button>
    </div>
  );
}
