'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePaginatedData } from '@/hooks/queries/usePaginatedData';

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
}

function getCellValue<T>(row: T, key: string): unknown {
  return (row as Record<string, unknown>)[key];
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

export default function DataTable<T extends { id: number | string }>({
  title,
  url,
  columns,
  editBasePath,
  idKey = 'id',
}: DataTableProps<T>) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isError } = usePaginatedData<T>(url, page, debouncedSearch);

  // Page size is determined by the API; infer from a full page (next != null),
  // otherwise fall back to total count or default 15.
  const pageSize = data?.next
    ? data.results.length
    : (data?.count ?? 15);

  const totalPages = data ? Math.ceil(data.count / pageSize) : 1;
  const from = data ? (page - 1) * pageSize + 1 : 0;
  const to = data ? Math.min(page * pageSize, data.count) : 0;

  function getPageNumbers(): (number | '...')[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  }

  return (
    <div>
      {/* Page title */}
      <h1 className="text-2xl font-bold text-foreground mb-6">{title}</h1>

      {/* Card */}
      <div className="bg-card-bg border border-card-border rounded-lg overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-b border-card-border flex-wrap">
          {/* Search */}
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 text-sm rounded border border-card-border bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent w-48"
          />

          {/* Add new */}
          <Link
            href={`${editBasePath}/new`}
            className="px-4 py-1.5 text-sm font-semibold rounded bg-accent hover:bg-accent/90 text-white transition-colors"
          >
            Add new
          </Link>

          {/* Filter icon (amber) */}
          <button
            className="p-1.5 rounded bg-amber-500 hover:bg-amber-600 text-white transition-colors"
            aria-label="Filter"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
          </button>

          {/* Export icon (amber) */}
          <button
            className="p-1.5 rounded bg-amber-500 hover:bg-amber-600 text-white transition-colors"
            aria-label="Export"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>

          {/* Download icon (teal) */}
          <button
            className="p-1.5 rounded bg-teal-500 hover:bg-teal-600 text-white transition-colors"
            aria-label="Download"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>

          {/* Dropdown chevron */}
          <button
            className="p-1.5 rounded border border-card-border hover:bg-black/5 text-foreground/50 transition-colors"
            aria-label="More options"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Table */}
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
              {isLoading && (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-card-border">
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3">
                        <div className="h-4 rounded bg-card-border animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="h-7 w-7 rounded bg-card-border animate-pulse" />
                    </td>
                  </tr>
                ))
              )}

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

              {!isLoading && !isError && data?.results.map((row) => {
                const rowIdValue = String((row as Record<string, unknown>)[idKey] ?? row.id);
                return (
                <tr
                  key={row.id}
                  className="border-b border-card-border last:border-0 hover:bg-black/[0.03] transition-colors"
                >
                  {columns.map((col) => {
                    const value = getCellValue(row, col.key);
                    return (
                      <td key={col.key} className="px-4 py-3 text-sm text-foreground">
                        {col.render ? col.render(value, row) : formatCellValue(value)}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3">
                    <Link
                      href={`${editBasePath}/${rowIdValue}`}
                      className="inline-flex items-center justify-center w-7 h-7 rounded bg-teal-600 hover:bg-teal-700 text-white transition-colors"
                      aria-label="Edit"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </Link>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.count > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-card-border flex-wrap gap-2">
            <p className="text-sm text-foreground/50">
              Showing {from}–{to} of {data.count}
            </p>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="px-2.5 py-1 text-sm rounded border border-card-border hover:bg-black/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-foreground"
              >
                ‹ Prev
              </button>

              {getPageNumbers().map((p, i) =>
                p === '...' ? (
                  <span key={`ellipsis-${i}`} className="px-2 py-1 text-sm text-foreground/40">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 text-sm rounded border transition-colors ${
                      p === page
                        ? 'bg-accent text-white border-accent'
                        : 'border-card-border hover:bg-black/5 text-foreground'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page === totalPages}
                className="px-2.5 py-1 text-sm rounded border border-card-border hover:bg-black/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-foreground"
              >
                Next ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
