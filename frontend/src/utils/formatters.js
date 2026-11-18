import { format, formatDistanceToNow, isValid } from 'date-fns';

export function formatDate(dateVal, pattern = 'MMM d, yyyy') {
  if (!dateVal) return '—';
  const d = new Date(dateVal);
  return isValid(d) ? format(d, pattern) : '—';
}

export function formatDateTime(dateVal) {
  if (!dateVal) return '—';
  const d = new Date(dateVal);
  return isValid(d) ? format(d, 'MMM d, yyyy · HH:mm') : '—';
}

export function formatTime(dateVal) {
  if (!dateVal) return '—';
  const d = new Date(dateVal);
  return isValid(d) ? format(d, 'HH:mm') : '—';
}

export function formatRelative(dateVal) {
  if (!dateVal) return '—';
  const d = new Date(dateVal);
  return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : '—';
}

export function formatMinutes(totalMinutes) {
  if (!totalMinutes || totalMinutes <= 0) return '0h 0m';
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hrs}h ${mins}m`;
}

export function getInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'WT';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function exportToCsv(filename, rows) {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escapeCell = (val) => {
    const str = val === null || val === undefined ? '' : String(val);
    if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
  };
  const csv = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => headers.map((h) => escapeCell(row[h])).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
