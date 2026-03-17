'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

interface ImageUploadProps {
  onFileChange: (file: File | null) => void;
  currentImageUrl?: string;
}

export default function ImageUpload({ onFileChange, currentImageUrl }: ImageUploadProps) {
  const [expanded, setExpanded] = useState(true);
  const [preview, setPreview] = useState<string | null>(currentImageUrl ?? null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(file: File) {
    setError('');
    if (file.size > MAX_SIZE_BYTES) {
      setError('Image must be smaller than 2MB.');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    onFileChange(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  }

  function handleClear() {
    setPreview(null);
    setError('');
    onFileChange(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="border border-card-border rounded-lg overflow-hidden mb-5">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-background border-b border-card-border">
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
          Image
        </span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-foreground/70">
            Ratio: <strong>1:1</strong>, Size: <strong>500x500</strong>
          </span>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="p-1 rounded hover:bg-black/5 transition-colors text-foreground/50"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div className="p-4 bg-card-bg">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleInputChange}
          />

          {preview ? (
            <div className="flex items-start gap-4">
              <div className="relative w-32 h-32 rounded border border-card-border overflow-hidden shrink-0">
                <Image src={preview} alt="Preview" fill className="object-cover" unoptimized />
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="px-3 py-1.5 text-sm rounded border border-card-border hover:bg-black/5 transition-colors text-foreground"
                >
                  Change image
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-3 py-1.5 text-sm rounded border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-card-border rounded-lg p-10 text-center cursor-pointer hover:bg-black/[0.03] transition-colors"
              onClick={() => inputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8 mx-auto mb-2 text-foreground/20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-foreground/40">
                Click to browse or drag & drop an image
              </p>
              <p className="text-xs text-foreground/30 mt-1">Max size: 2MB</p>
            </div>
          )}

          {error && (
            <p className="mt-2 text-sm text-red-500">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
