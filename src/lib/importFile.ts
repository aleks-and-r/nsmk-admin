import * as XLSX from 'xlsx';
import apiClient from './axios';

// XLSX/XLS files are converted to UTF-8 CSV before upload because the
// backend parser only accepts UTF-8 encoded text.
async function toCSVFile(file: File): Promise<File> {
  if (!/\.(xlsx|xls)$/i.test(file.name)) return file;
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const csv = XLSX.utils.sheet_to_csv(ws);
  const csvName = file.name.replace(/\.(xlsx|xls)$/i, '.csv');
  return new File([csv], csvName, { type: 'text/csv;charset=utf-8;' });
}

export async function importFile(endpoint: string, file: File): Promise<unknown> {
  const csvFile = await toCSVFile(file);
  const fd = new FormData();
  fd.append('file', csvFile);
  const { data } = await apiClient.post(endpoint, fd);
  return data;
}
