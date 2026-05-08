"use client";

interface TablePaginationProps {
  page: number;
  totalPages: number;
  count: number;
  from: number;
  to: number;
  onPageChange: (page: number) => void;
}

function getPageNumbers(page: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7)
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (page > 3) pages.push("...");
  for (
    let i = Math.max(2, page - 1);
    i <= Math.min(totalPages - 1, page + 1);
    i++
  ) {
    pages.push(i);
  }
  if (page < totalPages - 2) pages.push("...");
  pages.push(totalPages);
  return pages;
}

export default function TablePagination({
  page,
  totalPages,
  count,
  from,
  to,
  onPageChange,
}: TablePaginationProps) {
  if (count === 0) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-card-border flex-wrap gap-2">
      <p className="text-sm text-foreground/50">
        Showing {from}–{to} of {count}
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="px-2.5 py-1 text-sm rounded border border-card-border hover:bg-black/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-foreground"
        >
          ‹ Prev
        </button>

        {getPageNumbers(page, totalPages).map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="px-2 py-1 text-sm text-foreground/40">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 text-sm rounded border transition-colors ${
                p === page
                  ? "bg-accent text-white border-accent"
                  : "border-card-border hover:bg-black/5 text-foreground"
              }`}
            >
              {p}
            </button>
          ),
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="px-2.5 py-1 text-sm rounded border border-card-border hover:bg-black/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-foreground"
        >
          Next ›
        </button>
      </div>
    </div>
  );
}
