import { List } from 'react-window';
import type { RowComponentProps } from 'react-window';
import type { ColumnMeta, ColumnType } from '../types/dataset';

interface DataTableProps {
  columns: ColumnMeta[];
  data: Record<string, unknown>[];
}

const TYPE_BADGE_CLASSES: Record<ColumnType, string> = {
  numeric: 'bg-blue-100 text-blue-700',
  categorical: 'bg-purple-100 text-purple-700',
  datetime: 'bg-green-100 text-green-700',
  text: 'bg-gray-100 text-gray-700',
};

const COL_WIDTH = 160;
const ROW_HEIGHT = 32;
const TABLE_MAX_HEIGHT = 400;

function CellValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <span className="text-gray-400 italic">null</span>;
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
      className={`flex items-center text-sm ${isEven ? 'bg-white' : 'bg-gray-50'}`}
      {...ariaAttributes}
    >
      {columns.map((col) => (
        <div
          key={col.name}
          className="flex-shrink-0 px-3 py-1 overflow-hidden text-gray-700"
          style={{ width: COL_WIDTH }}
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
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        {/* Sticky header */}
        <div
          className="flex bg-gray-50 border-b border-gray-200"
          style={{ width: totalWidth, minWidth: '100%' }}
        >
          {columns.map((col) => (
            <div
              key={col.name}
              className="flex-shrink-0 px-3 py-2 flex items-center gap-1.5"
              style={{ width: COL_WIDTH }}
            >
              <span className="text-sm font-medium text-gray-700 truncate">{col.name}</span>
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
          <div className="py-8 text-center text-gray-400 text-sm">데이터가 없습니다.</div>
        )}
      </div>
    </div>
  );
}
