"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { downloadExport } from "@/lib/download";
import { usePaginatedData } from "@/hooks/queries/usePaginatedData";
import TableToolbar from "./TableToolbar";
import TablePagination from "./TablePagination";
import EditIcon from "@/components/icons/EditIcon";
import DeleteIcon from "@/components/icons/DeleteIcon";

export interface TableColumn<T> {
  key: string;
  header: string;
  render?: (value: unknown, row: T) => ReactNode;
}

interface DataTableProps<T extends { id: number | string }> {
  title: string;
  url: string;
  columns: TableColumn<T>[];
  editBasePath: string;
  idKey?: string;
  onDelete?: (id: string) => void;
  extraActions?: (row: T) => ReactNode;
  onImport?: (file: File) => Promise<void>;
}

function getCellValue<T>(row: T, key: string): unknown {
  return (row as Record<string, unknown>)[key];
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

export default function DataTable<T extends { id: number | string }>({
  title,
  url,
  columns,
  editBasePath,
  idKey = "id",
  onDelete,
  extraActions,
  onImport,
}: DataTableProps<T>) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isError } = usePaginatedData<T>(
    url,
    page,
    debouncedSearch,
  );

  // Page size inferred from a full page (next != null), else fall back to count or 15.
  const pageSize = data?.next ? data.results.length : (data?.count ?? 15);
  const totalPages = data ? Math.ceil(data.count / pageSize) : 1;
  const from = data ? (page - 1) * pageSize + 1 : 0;
  const to = data ? Math.min(page * pageSize, data.count) : 0;

  async function handleExport() {
    setExporting(true);
    try {
      await downloadExport(`${url}export/`);
    } finally {
      setExporting(false);
    }
  }

  async function handleImport(file: File) {
    setImporting(true);
    try {
      await onImport?.(file);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">{title}</h1>

      <div className="bg-card-bg border border-card-border rounded-lg overflow-hidden">
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          editBasePath={editBasePath}
          exporting={exporting}
          onExport={handleExport}
          importing={importing}
          onImport={onImport ? handleImport : undefined}
        />

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-card-border">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground/50"
                  >
                    {col.header}
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground/50">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-card-border">
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3">
                        <div
                          className="h-4 rounded bg-card-border animate-pulse"
                          style={{ width: `${60 + Math.random() * 40}%` }}
                        />
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="h-7 w-7 rounded bg-card-border animate-pulse" />
                    </td>
                  </tr>
                ))}

              {isError && (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-4 py-8 text-center text-sm text-red-500"
                  >
                    Failed to load data. Please try again.
                  </td>
                </tr>
              )}

              {!isLoading && !isError && data?.results.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-4 py-8 text-center text-sm text-foreground/40"
                  >
                    No results found.
                  </td>
                </tr>
              )}

              {!isLoading &&
                !isError &&
                data?.results.map((row) => {
                  const rowId = String(
                    (row as Record<string, unknown>)[idKey] ?? row.id,
                  );
                  return (
                    <tr
                      key={row.id}
                      className="border-b border-card-border last:border-0 hover:bg-black/[0.03] transition-colors"
                    >
                      {columns.map((col) => {
                        const value = getCellValue(row, col.key);
                        return (
                          <td
                            key={col.key}
                            className="px-4 py-3 text-sm text-foreground"
                          >
                            {col.render
                              ? col.render(value, row)
                              : formatCellValue(value)}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {extraActions?.(row)}
                          <Link
                            href={`${editBasePath}/${rowId}`}
                            className="inline-flex items-center justify-center w-7 h-7 rounded bg-btn-edit hover:bg-btn-edit/90 text-white transition-colors"
                            aria-label="Edit"
                          >
                            <EditIcon className="w-3.5 h-3.5" />
                          </Link>
                          {onDelete && (
                            <button
                              type="button"
                              onClick={() => onDelete(rowId)}
                              className="inline-flex items-center justify-center w-7 h-7 rounded bg-red-500/80 hover:bg-red-500 text-white transition-colors"
                              aria-label="Delete"
                            >
                              <DeleteIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <TablePagination
          page={page}
          totalPages={totalPages}
          count={data?.count ?? 0}
          from={from}
          to={to}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
