"use client";

export interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  danger?: boolean;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = "Yes",
  cancelLabel = "Cancel",
  loading = false,
  danger = true,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => !loading && onCancel()}
      />

      {/* Dialog */}
      <div className="relative bg-card-bg border border-card-border rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
        {title && (
          <h3 className="text-base font-semibold text-foreground mb-2">
            {title}
          </h3>
        )}
        <p className="text-sm text-foreground/70 mb-6">{message}</p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm rounded border border-card-border hover:bg-black/5 disabled:opacity-50 text-foreground transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-semibold rounded disabled:opacity-50 text-white transition-colors ${
              danger
                ? "bg-red-500 hover:bg-red-600"
                : "bg-accent hover:bg-accent/90"
            }`}
          >
            {loading ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
