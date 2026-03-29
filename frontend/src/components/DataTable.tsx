import { List } from 'react-window';
import type { RowComponentProps } from 'react-window';
import type { ColumnMeta, ColumnType } from '../types/dataset';

interface DataTableProps {
  columns: ColumnMeta[];
  data: Record<string, unknown>[];
}

const TYPE_BADGE_CLASSES: Record<ColumnType, string> = {
  numeric: 'bg-primary-light text-primary-hover',
  categorical: 'bg-slate-50 text-slate-600',
  datetime: 'bg-sky-50 text-sky-700',
  text: 'bg-border-light text-text-muted',
};

const COL_WIDTH = 160;
const ROW_HEIGHT = 32;
const TABLE_MAX_HEIGHT = 400;

function CellValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <span className="text-text-subtle italic">null</span>;
  }
  return <span className="truncate">{String(value)}</span>;
}

interface TableRowProps {
  rowData: Record<string, unknown>[];
  columns: ColumnMeta[];
  totalWidth: number;
}

function TableRow({
  index,
  style,
  ariaAttributes,
  rowData,
  columns,
  totalWidth,
}: RowComponentProps<TableRowProps>) {
  const row = rowData[index];
  const isEven = index % 2 === 0;
  return (
    <div
      style={{ ...style, width: totalWidth }}
      className={`flex items-center text-sm transition-colors hover:bg-primary-light/40 ${isEven ? 'bg-surface-raised' : 'bg-surface'}`}
      {...ariaAttributes}
    >
      {columns.map((col) => (
        <div
          key={col.name}
          className="flex-shrink-0 px-3 py-1 overflow-hidden text-text-muted"
          style={{ width: COL_WIDTH }}
          role="cell"
        >
          <CellValue value={row[col.name]} />
        </div>
      ))}
    </div>
  );
}

export function DataTable({ columns, data }: DataTableProps) {
  const totalWidth = Math.max(columns.length * COL_WIDTH, 640);
  const listHeight = Math.min(data.length * ROW_HEIGHT, TABLE_MAX_HEIGHT - ROW_HEIGHT);

  return (
    <div className="border border-border rounded-lg overflow-hidden" role="table" aria-label="데이터 미리보기">
      <div className="overflow-x-auto">
        {/* Sticky header */}
        <div
          className="flex bg-surface border-b border-border"
          style={{ width: totalWidth, minWidth: '100%' }}
          role="row"
        >
          {columns.map((col) => (
            <div
              key={col.name}
              className="flex-shrink-0 px-3 py-2 flex items-center gap-1.5"
              style={{ width: COL_WIDTH }}
              role="columnheader"
            >
              <span className="text-sm font-medium text-text truncate">{col.name}</span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${TYPE_BADGE_CLASSES[col.type]}`}
              >
                {col.type}
              </span>
            </div>
          ))}
        </div>

        {/* Virtualized rows via react-window List */}
        {data.length > 0 ? (
          <List<TableRowProps>
            rowCount={data.length}
            rowHeight={ROW_HEIGHT}
            rowComponent={TableRow}
            rowProps={{ rowData: data, columns, totalWidth }}
            style={{ overflowX: 'hidden' }}
            defaultHeight={listHeight}
          />
        ) : (
          <div className="py-8 text-center text-text-subtle text-sm">데이터가 없습니다.</div>
        )}
      </div>
    </div>
  );
}
