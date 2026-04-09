"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Clock3, Database, KeyRound } from "lucide-react";

import type { SchemaNode } from "@/store/useSchemaStore";

export function EntityNode({ data, selected }: NodeProps<SchemaNode>) {
  return (
    <div className="relative min-w-72">
      <Handle
        type="target"
        position={Position.Left}
        className="!size-3 !border-2 !border-white !bg-slate-400 shadow-sm dark:!border-slate-950 dark:!bg-slate-500"
      />

      <div
        className={[
          "overflow-hidden rounded-2xl border bg-white/95 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.45)] backdrop-blur",
          "dark:bg-slate-900/95",
          selected
            ? "border-sky-400 ring-4 ring-sky-500/15 dark:border-sky-300 dark:ring-sky-400/20"
            : "border-slate-200/80 dark:border-slate-800",
        ].join(" ")}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 bg-slate-50/90 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/70">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              <Database className="size-3.5" />
              Entity
            </div>
            <div className="text-sm font-semibold text-slate-950 dark:text-slate-50">
              {data.label}
            </div>
          </div>

          <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            <Clock3 className="size-3" />
            TTL: {data.ttl}
          </div>
        </div>

        <div className="px-3 py-3">
          <div className="space-y-1.5">
            {data.columns.map((column) => (
              <div
                key={`${data.label}-${column.name}`}
                className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-slate-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950/70"
              >
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  {column.isPrimary ? (
                    <KeyRound className="size-3.5 text-amber-500" />
                  ) : (
                    <span className="size-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
                  )}
                  <span className="font-medium">{column.name}</span>
                </div>

                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {column.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!size-3 !border-2 !border-white !bg-sky-500 shadow-sm dark:!border-slate-950"
      />
    </div>
  );
}
