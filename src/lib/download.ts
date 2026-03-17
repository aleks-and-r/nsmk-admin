import apiClient from '@/lib/axios';

export async function downloadExport(url: string): Promise<void> {
  const { data: blob, headers } = await apiClient.get(url, {
    responseType: 'blob',
  });
  const contentDisposition = (headers['content-disposition'] as string) ?? '';
  const match = contentDisposition.match(/filename="?([^"]+)"?/);
  const filename =
    match?.[1] ?? `${url.replace(/\//g, '_').replace(/^_|_$/g, '')}.csv`;
  const href = URL.createObjectURL(blob as Blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(href);
}
