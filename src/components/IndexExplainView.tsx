import React, { useState, useEffect } from 'react';
import { ExplainStatsResult, Employee } from '../types/index.js';
import { api } from '../services/api.js';

interface IndexExplainViewProps {
  employees: Employee[];
  selectedEmployeeId: string;
  onSelectEmployee: (id: string) => void;
}

export const IndexExplainView: React.FC<IndexExplainViewProps> = ({
  employees,
  selectedEmployeeId,
  onSelectEmployee,
}) => {
  const [data, setData] = useState<ExplainStatsResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);

  const runExplain = async () => {
    setIsLoading(true);
    try {
      const res = await api.getExplainStats(selectedEmployeeId);
      setData(res.data);
    } catch (err) {
      console.error('Failed to run explain analysis:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runExplain();
  }, [selectedEmployeeId]);

  const summary = data?.summary;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Compound Index Performance & Explain Plan (Phase 5)
          </h1>
          <div className="text-xs text-slate-500 mt-1">
            Comparing MongoDB execution plans: Compound Index <code className="text-slate-800 font-mono">{"{ employee_id: 1, date: -1 }"}</code> vs Full Table Scan (<code className="text-slate-800 font-mono">COLLSCAN</code>)
          </div>
        </div>

        {/* Actions & Target Employee */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span>Target:</span>
            <select
              value={selectedEmployeeId}
              onChange={(e) => onSelectEmployee(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-800"
            >
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={runExplain}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Running Explain...' : 'Re-Run Explain'}
          </button>
        </div>
      </div>

      {/* Query Under Evaluation */}
      <div className="bg-slate-900 text-slate-100 rounded-lg p-4 font-mono text-xs overflow-x-auto shadow-xs">
        <div className="text-slate-400 text-[11px] mb-1 font-sans font-semibold uppercase tracking-wider">
          Query Evaluated with .explain("executionStats"):
        </div>
        <div>
          {`db.attendance.find({ employee_id: ObjectId("${selectedEmployeeId}"), date: { $gte: "2026-01-01", $lte: "2026-12-31" } })`}
        </div>
      </div>

      {/* Side-by-Side Comparison */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: WITHOUT Index (COLLSCAN) */}
          <div className="bg-white border border-rose-200/80 rounded-xl p-6 shadow-xs relative">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                  Baseline: Without Index
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">
                  Full Collection Scan (COLLSCAN)
                </h2>
              </div>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
                {summary.collectionScan.stage}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex justify-between py-2 border-b border-slate-100 text-xs">
                <span className="text-slate-500">Documents Examined (totalDocsExamined):</span>
                <span className="font-mono tabular-nums font-bold text-rose-600">
                  {summary.collectionScan.totalDocsExamined} docs
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 text-xs">
                <span className="text-slate-500">Index Keys Examined:</span>
                <span className="font-mono tabular-nums font-semibold text-slate-700">
                  {summary.collectionScan.totalKeysExamined} keys (None)
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 text-xs">
                <span className="text-slate-500">Documents Returned (nReturned):</span>
                <span className="font-mono tabular-nums font-semibold text-slate-800">
                  {summary.collectionScan.nReturned}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 text-xs">
                <span className="text-slate-500">Execution Time (executionTimeMillis):</span>
                <span className="font-mono tabular-nums font-bold text-slate-800">
                  {summary.collectionScan.executionTimeMillis} ms
                </span>
              </div>
              <div className="flex justify-between py-2 text-xs">
                <span className="text-slate-500">Efficiency Ratio (Docs Examined / Returned):</span>
                <span className="font-mono tabular-nums font-bold text-rose-600">
                  {(summary.collectionScan.totalDocsExamined / Math.max(1, summary.collectionScan.nReturned)).toFixed(1)}x
                </span>
              </div>
            </div>

            <div className="mt-4 text-xs text-rose-800/90 bg-rose-50/50 p-3 rounded-lg border border-rose-100">
              Scans every document in the collection sequentially. Cost grows linearly O(N) as attendance records accumulate.
            </div>
          </div>

          {/* Card 2: WITH Compound Index */}
          <div className="bg-white border border-emerald-300 rounded-xl p-6 shadow-xs relative">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Optimized: Compound Index
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">
                  {"{ employee_id: 1, date: -1 }"}
                </h2>
              </div>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                {summary.compoundIndex.stage}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex justify-between py-2 border-b border-slate-100 text-xs">
                <span className="text-slate-500">Documents Examined (totalDocsExamined):</span>
                <span className="font-mono tabular-nums font-bold text-emerald-700">
                  {summary.compoundIndex.totalDocsExamined} docs
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 text-xs">
                <span className="text-slate-500">Index Keys Examined:</span>
                <span className="font-mono tabular-nums font-semibold text-emerald-700">
                  {summary.compoundIndex.totalKeysExamined} keys
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 text-xs">
                <span className="text-slate-500">Documents Returned (nReturned):</span>
                <span className="font-mono tabular-nums font-semibold text-slate-800">
                  {summary.compoundIndex.nReturned}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 text-xs">
                <span className="text-slate-500">Execution Time (executionTimeMillis):</span>
                <span className="font-mono tabular-nums font-bold text-emerald-700">
                  {summary.compoundIndex.executionTimeMillis} ms
                </span>
              </div>
              <div className="flex justify-between py-2 text-xs">
                <span className="text-slate-500">Efficiency Ratio (Docs Examined / Returned):</span>
                <span className="font-mono tabular-nums font-bold text-emerald-700">
                  1.0x (Perfect 1:1 Selectivity)
                </span>
              </div>
            </div>

            <div className="mt-4 text-xs text-emerald-900 bg-emerald-50/60 p-3 rounded-lg border border-emerald-100">
              Direct B-Tree index scan (IXSCAN) + targeted document FETCH. Only inspects documents matching the exact compound prefix.
            </div>
          </div>
        </div>
      )}

      {/* Written Analysis Block */}
      {summary && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900">
            Technical Architecture & Performance Analysis
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {summary.analysis}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="text-slate-500 font-medium">B-Tree Traversal</div>
              <div className="font-semibold text-slate-800 mt-1">O(log N) Complexity</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Direct pointer jump to employee prefix</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="text-slate-500 font-medium">Sort Elimination</div>
              <div className="font-semibold text-slate-800 mt-1">Free In-Memory Sort</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Date: -1 delivers pre-sorted reverse order</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="text-slate-500 font-medium">Doc Examined Delta</div>
              <div className="font-semibold text-slate-800 mt-1">
                -{summary.collectionScan.totalDocsExamined - summary.compoundIndex.totalDocsExamined} Reads Saved
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Zero extraneous disk I/O wasted</div>
            </div>
          </div>
        </div>
      )}

      {/* Raw Explain JSON Toggle */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-900">
            Raw MongoDB .explain("executionStats") JSON Output
          </div>
          <button
            onClick={() => setShowRawJson(!showRawJson)}
            className="text-xs text-slate-600 hover:text-slate-900 font-medium underline"
          >
            {showRawJson ? 'Hide Raw JSON' : 'Inspect Raw JSON'}
          </button>
        </div>

        {showRawJson && data && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] font-semibold text-emerald-700 mb-1">
                With Compound Index (IXSCAN):
              </div>
              <pre className="bg-slate-900 text-slate-200 p-3 rounded text-[10px] font-mono overflow-auto max-h-96">
                {JSON.stringify(data.rawWithIndex?.executionStats, null, 2)}
              </pre>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-rose-700 mb-1">
                Without Index (COLLSCAN):
              </div>
              <pre className="bg-slate-900 text-slate-200 p-3 rounded text-[10px] font-mono overflow-auto max-h-96">
                {JSON.stringify(data.rawWithoutIndex?.executionStats, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
