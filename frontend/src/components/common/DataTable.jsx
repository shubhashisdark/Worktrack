import React from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState } from './States';

export function DataTable({
  columns = [],
  data = [],
  rowKey = (row) => row._id,
  loading = false,
  error = null,
  onRetry,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters,
  toolbarRight,
  sortBy,
  sortOrder,
  onSortChange,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  bulkActions,
  meta,
  onPageChange,
  onRowClick,
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting your search or filter criteria.',
  emptyAction,
}) {
  const allVisibleIds = data.map((r) => rowKey(r));
  const allSelected = selectable && allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.includes(id));

  const toggleAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange(selectedIds.filter((id) => !allVisibleIds.includes(id)));
    } else {
      onSelectionChange(Array.from(new Set([...selectedIds, ...allVisibleIds])));
    }
  };

  const toggleRow = (id) => {
    if (!onSelectionChange) return;
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((item) => item !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleSort = (colKey) => {
    if (!onSortChange) return;
    if (sortBy === colKey) {
      onSortChange(colKey, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(colKey, 'asc');
    }
  };

  const hasToolbar = onSearchChange || filters || toolbarRight;

  return (
    <div className="overflow-hidden rounded-[10px] border border-[#E8EAED] bg-white">
      {hasToolbar && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[#E8EAED] px-4 py-3">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            {onSearchChange && (
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9AA0A6]" />
                <input
                  type="text"
                  value={searchValue ?? ''}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-8 w-full rounded-md border border-[#E8EAED] bg-[#F8F9FB] pl-8 pr-7 text-[13px] text-[#202124] placeholder:text-[#9AA0A6] focus:border-[#3867D6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3867D6]/15"
                />
                {searchValue && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => onSearchChange('')}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-[#747B87] hover:bg-[#E8EAED] hover:text-[#202124]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
            {filters}
          </div>
          {toolbarRight && <div className="flex items-center gap-2">{toolbarRight}</div>}
        </div>
      )}

      {selectable && selectedIds.length > 0 && bulkActions && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8EAED] bg-[#EEF2FC] px-4 py-2">
          <span className="text-[12px] font-medium text-[#3867D6]">
            {selectedIds.length} selected
          </span>
          <div className="flex items-center gap-2">{bulkActions}</div>
        </div>
      )}

      {error ? (
        <div className="p-4">
          <ErrorState message={error} onRetry={onRetry} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#E8EAED] bg-[#F8F9FB]">
                {selectable && (
                  <th className="w-10 px-4 py-2.5">
                    <input
                      type="checkbox"
                      aria-label="Select all rows"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="h-3.5 w-3.5 rounded border-[#D5D9E0] accent-[#3867D6]"
                    />
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      'whitespace-nowrap px-4 py-2.5 text-[12px] font-medium text-[#747B87]',
                      col.align === 'right' && 'text-right',
                      col.headerClassName
                    )}
                  >
                    {col.sortable && onSortChange ? (
                      <button
                        type="button"
                        onClick={() => handleSort(col.sortKey || col.key)}
                        className="inline-flex items-center gap-1 hover:text-[#202124]"
                      >
                        {col.header}
                        {sortBy === (col.sortKey || col.key) ? (
                          sortOrder === 'asc' ? (
                            <ArrowUp className="h-3 w-3 text-[#3867D6]" />
                          ) : (
                            <ArrowDown className="h-3 w-3 text-[#3867D6]" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-45" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EAED]">
              {loading ? (
                Array.from({ length: 5 }).map((_, rIdx) => (
                  <tr key={rIdx}>
                    {selectable && (
                      <td className="px-4 py-3">
                        <div className="h-3.5 w-3.5 animate-pulse rounded bg-[#ECEEF2]" />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3">
                        <div className="h-4 w-24 animate-pulse rounded bg-[#ECEEF2]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (selectable ? 1 : 0)}>
                    <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
                  </td>
                </tr>
              ) : (
                data.map((row) => {
                  const id = rowKey(row);
                  const isSelected = selectable && selectedIds.includes(id);
                  return (
                    <tr
                      key={id}
                      onClick={() => onRowClick && onRowClick(row)}
                      className={cn(
                        'text-[13px] text-[#202124] transition-colors',
                        onRowClick && 'cursor-pointer hover:bg-[#F8F9FB]',
                        isSelected && 'bg-[#EEF2FC]/45'
                      )}
                    >
                      {selectable && (
                        <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            aria-label="Select row"
                            checked={isSelected}
                            onChange={() => toggleRow(id)}
                            className="h-3.5 w-3.5 rounded border-[#D5D9E0] accent-[#3867D6]"
                          />
                        </td>
                      )}
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={cn(
                            'px-4 py-2.5 align-middle',
                            col.align === 'right' && 'text-right',
                            col.cellClassName
                          )}
                        >
                          {col.render ? col.render(row) : row[col.key] ?? '—'}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.total > 0 && onPageChange && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E8EAED] bg-[#F8F9FB] px-4 py-2.5 text-[12px] text-[#747B87]">
          <div>
            Showing <span className="font-medium text-[#202124]">{(meta.page - 1) * meta.limit + 1}</span>–
            <span className="font-medium text-[#202124]">{Math.min(meta.page * meta.limit, meta.total)}</span> of{' '}
            <span className="font-medium text-[#202124]">{meta.total}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => onPageChange(meta.page - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </Button>
            <span className="px-2 tabular-nums text-[#202124]">
              Page {meta.page} of {meta.totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={meta.page >= meta.totalPages}
              onClick={() => onPageChange(meta.page + 1)}
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
