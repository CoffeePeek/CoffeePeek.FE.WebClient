import { flexRender, getCoreRowModel, useReactTable, type ColumnDef, type RowData } from '@tanstack/react-table';
import { cn } from '../../lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './Table';

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string;
    headerClassName?: string;
  }
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  emptyText?: string;
  loading?: boolean;
  loadingRows?: number;
  tableClassName?: string;
  getRowId?: (row: TData, index: number) => string;
  getRowClassName?: (row: TData) => string | undefined;
  onRowClick?: (row: TData) => void;
}

export function DataTable<TData>({
  columns,
  data,
  emptyText = 'Нет данных',
  loading = false,
  loadingRows = 8,
  tableClassName,
  getRowId,
  getRowClassName,
  onRowClick,
}: DataTableProps<TData>) {
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel(), getRowId });
  const columnCount = table.getAllLeafColumns().length;

  return (
    <Table className={tableClassName}>
      <TableHeader>
        {table.getHeaderGroups().map((group) => (
          <TableRow key={group.id} className="hover:bg-transparent">
            {group.headers.map((header) => (
              <TableHead key={header.id} className={header.column.columnDef.meta?.headerClassName}>
                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {loading ? Array.from({ length: loadingRows }, (_, index) => (
          <TableRow key={index}>
            <TableCell colSpan={columnCount} className="px-5 py-2">
              <div className="h-8 animate-pulse rounded bg-stone-100 dark:bg-white/5" />
            </TableCell>
          </TableRow>
        )) : table.getRowModel().rows.length ? table.getRowModel().rows.map((row) => (
          <TableRow
            key={row.id}
            className={cn(onRowClick && 'cursor-pointer', getRowClassName?.(row.original))}
            onClick={onRowClick ? () => onRowClick(row.original) : undefined}
          >
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id} className={cell.column.columnDef.meta?.className}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        )) : (
          <TableRow><TableCell colSpan={columnCount} className="h-20 text-center text-text-muted">{emptyText}</TableCell></TableRow>
        )}
      </TableBody>
    </Table>
  );
}
