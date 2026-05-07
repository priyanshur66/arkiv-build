'use client'

import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'

import type { EntityNodeData } from '@/store/useSchemaStore'

export function EntitySystemAttributes({
  data,
  open,
  onToggle,
}: {
  data: EntityNodeData
  open: boolean
  onToggle: () => void
}) {
  if (data.mode === 'draft' || !data.systemAttributes) {
    return null
  }

  return (
    <div className="space-y-3">
      <button
        onClick={onToggle}
        className="nodrag nopan flex w-full items-center justify-between rounded-[14px] border border-gray-100 bg-gray-50/60 px-4 py-3 transition hover:bg-gray-100/60"
      >
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-mono font-bold uppercase tracking-widest text-gray-500">
            System Attributes
          </span>
          {data.explorerUrl ? (
            <a
              href={data.explorerUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[11px] font-mono font-bold uppercase tracking-widest text-[#ff7a45] transition hover:text-[#ff692a] ml-2"
            >
              Explorer
              <ExternalLink className="size-3" />
            </a>
          ) : null}
        </div>
        {open ? (
          <ChevronUp className="size-4 text-gray-400" />
        ) : (
          <ChevronDown className="size-4 text-gray-400" />
        )}
      </button>

      {open && (
        <div className="space-y-4 px-1">
          {data.systemAttributes.map((attribute) => (
            <div key={attribute.name}>
              <p className="mb-2 text-[12px] font-mono font-bold uppercase tracking-widest text-gray-400">
                {attribute.name}
              </p>
              <div className="nodrag nopan w-full rounded-[14px] border border-gray-100 bg-gray-50/50 p-4 font-mono text-sm text-gray-900 break-all">
                {attribute.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
