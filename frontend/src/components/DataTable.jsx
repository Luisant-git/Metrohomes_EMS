import { useState } from "react";
import { Search, ChevronLeft, ChevronRight, Filter } from "lucide-react";

export default function DataTable({ columns, data, actions, searchKey, title, onAdd, addLabel = "Add New", hideSearch }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 8;

  const filtered = data.filter(row => {
    if (!search) return true;
    const keys = searchKey ? (Array.isArray(searchKey) ? searchKey : [searchKey]) : Object.keys(row);
    return keys.some(k => String(row[k] ?? "").toLowerCase().includes(search.toLowerCase()));
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      {(title || onAdd) && (
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
          {title && <h3 className="font-semibold text-gray-800 text-base">{title}</h3>}
          <div className="flex items-center gap-3 ml-auto">
            {!hideSearch && (
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search…" className="bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            )}
            {onAdd && (
              <button onClick={onAdd} className="btn-primary">
                {addLabel}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {columns.map(col => (
                <th key={col.key} className="text-left px-5 py-3.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  {col.label}
                </th>
              ))}
              {actions && <th className="text-right px-5 py-3.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-12 text-gray-400 text-sm">
                  No records found
                </td>
              </tr>
            ) : paged.map((row, i) => (
              <tr key={row.id || i} className="hover:bg-gray-50/50 transition-colors">
                {columns.map(col => (
                  <td key={col.key} className="px-5 py-3.5 text-sm text-gray-700 whitespace-nowrap">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {actions && (
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      {actions(row)}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <span>{filtered.length} results · Page {page} of {totalPages}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => setPage(n)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${page === n ? "bg-blue-600 text-white" : "hover:bg-gray-100"}`}>
                {n}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
