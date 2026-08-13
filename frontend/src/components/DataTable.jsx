import { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, Plus, Minus } from "lucide-react";

export default function DataTable({ columns, data, actions, searchKey, title, onAdd, addLabel = "Add New", hideSearch, extraActions, resetSearch, statusOptions = [], statusFilter = "", onStatusFilterChange, rowClassName, tree = null }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 8;

  useEffect(() => {
    if (resetSearch !== undefined && resetSearch !== null) {
      setSearch("");
      setPage(1);
    }
  }, [resetSearch]);

  // When `tree` is provided, flatten the rows depth-first based on expansion state
  const rows = [];
  if (tree) {
    const walk = (node, depth) => {
      const children = tree.childrenOf ? tree.childrenOf(node) : [];
      rows.push({ row: node, depth, key: node.id ?? rows.length, canExpand: children.length > 0 });
      if (children.length > 0 && tree.isExpanded && tree.isExpanded(node.id)) {
        children.forEach(c => walk(c, depth + 1));
      }
    };
    (data || []).forEach(root => walk(root, 0));
  } else {
    (data || []).forEach(row => rows.push({ row, depth: 0, key: row.id ?? rows.length, canExpand: false }));
  }

  const filtered = rows.filter(({ row }) => {
    if (statusFilter && row.status !== statusFilter) return false;
    if (!search) return true;
    const keys = searchKey ? (Array.isArray(searchKey) ? searchKey : [searchKey]) : Object.keys(row);
    return keys.some(k => String(row[k] ?? "").toLowerCase().includes(search.toLowerCase()));
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      {(title || onAdd) && (
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
          {title && <h3 className="font-bold text-slate-900 text-base">{title}</h3>}
          <div className="flex items-center gap-3 ml-auto">
            {!hideSearch && (
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search…" className="bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            )}
            {statusOptions.length > 0 && (
              <select value={statusFilter} onChange={e => { onStatusFilterChange?.(e.target.value); setPage(1); }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                <option value="">All statuses</option>
                {statusOptions.map((opt, idx) => (
                  typeof opt === "string" ? (
                    <option key={opt} value={opt}>{opt}</option>
                  ) : (
                    <option key={opt.value ?? idx} value={opt.value}>{opt.label}</option>
                  )
                ))}
              </select>
            )}
            {extraActions}
            {onAdd && (
              <button onClick={onAdd} className="btn-primary font-semibold shadow-sm shadow-blue-500/30 hover:shadow-md hover:shadow-blue-500/40">
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
                <th key={col.key} className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  {col.label}
                </th>
              ))}
              {actions && <th className="text-right px-5 py-3.5 text-[11px] font-bold text-gray-700 uppercase tracking-wider">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-12 text-gray-400 text-sm">
                  No records found
                </td>
              </tr>
            ) : paged.map(({ row, depth, key, canExpand }) => (
              <tr key={key} className={`transition-colors ${typeof rowClassName === 'function' ? rowClassName(row) : rowClassName || ''} ${
                tree
                  ? depth === 0 ? 'bg-white' : depth % 2 === 1 ? 'bg-indigo-50/70' : 'bg-indigo-50/40'
                  : ''
              }`}>
                {columns.map((col, ci) => (
                  <td key={col.key} className="px-5 py-3.5 text-sm text-slate-900 whitespace-nowrap">
                    {ci === 0 && tree && (
                      <span className="inline-flex items-center align-middle">
                        {depth > 0 && <span className="inline-block flex-shrink-0" style={{ width: depth * 22 }} />}
                        <button
                          onClick={() => tree.onToggle?.(row.id)}
                          disabled={!canExpand}
                          className={`w-5 h-5 rounded flex items-center justify-center mr-2 flex-shrink-0 transition-all ${
                            canExpand
                              ? "bg-gray-200 hover:bg-gray-300 text-gray-700"
                              : "bg-gray-100 text-gray-400 cursor-default"
                          }`}
                          title={canExpand ? (tree.isExpanded?.(row.id) ? "Collapse" : "Expand") : "No downline"}
                        >
                          {tree.isExpanded?.(row.id) ? <Minus size={12} /> : <Plus size={12} />}
                        </button>
                      </span>
                    )}
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
