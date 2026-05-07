'use client'

import { ChevronDown, Link, Minus, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { inputClassName, selectClassName } from '@/components/entity-node/styles'
import { sanitizeIdentifier } from '@/lib/arkiv/schema'
import type { EntityField, IndexedAttributeType } from '@/lib/arkiv/types'
import { useSchemaStore } from '@/store/useSchemaStore'

export function EntityAttributesEditor({
  nodeId,
  fields,
}: {
  nodeId: string
  fields: EntityField[]
}) {
  const addField = useSchemaStore((s) => s.addField)
  const removeField = useSchemaStore((s) => s.removeField)
  const updateFieldName = useSchemaStore((s) => s.updateFieldName)
  const updateFieldValue = useSchemaStore((s) => s.updateFieldValue)
  const updateFieldType = useSchemaStore((s) => s.updateFieldType)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[1fr_1fr_auto_auto] items-end gap-3">
        <p className="mb-2 text-[13px] font-mono font-bold lowercase tracking-widest text-[#ff7a45] w-full col-span-4 border-b border-gray-100 pb-2">
          INDEXED ATTRIBUTES
        </p>
      </div>

      {fields.map((field) => {
        const isRelation = !!field.edgeId

        return (
          <div
            key={field.id}
            className="grid grid-cols-[clamp(100px,1fr,150px)_1fr_auto_auto] items-end gap-3 pb-2"
          >
            <div>
              <p className="mb-2 text-[12px] font-mono font-bold uppercase tracking-widest text-gray-400">
                Field Name
              </p>
              <div className="relative">
                {isRelation ? (
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ff7a45]">
                    <Link className="size-4" />
                  </div>
                ) : null}
                <input
                  value={field.name}
                  onChange={(e) =>
                    updateFieldName(nodeId, field.id, sanitizeIdentifier(e.target.value))
                  }
                  className={`${inputClassName} ${isRelation ? 'pl-11 text-[#ff7a45]' : ''}`}
                  placeholder="e.g. name"
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-[12px] font-mono font-bold uppercase tracking-widest text-gray-400">
                Initial Value
              </p>
              <input
                value={field.value}
                onChange={(e) => updateFieldValue(nodeId, field.id, e.target.value)}
                disabled={isRelation}
                className={inputClassName}
                placeholder={
                  isRelation
                    ? 'Pending deployment…'
                    : field.type === 'indexedNumber'
                      ? '0'
                      : 'Value…'
                }
                inputMode={field.type === 'indexedNumber' ? 'decimal' : 'text'}
              />
            </div>

            <div>
              <p className="mb-2 text-[12px] font-mono font-bold uppercase tracking-widest text-gray-400">
                Type
              </p>
              <div className="relative w-32">
                <select
                  value={field.type}
                  onChange={(e) =>
                    updateFieldType(
                      nodeId,
                      field.id,
                      e.target.value as IndexedAttributeType,
                    )
                  }
                  className={selectClassName}
                  disabled={isRelation}
                >
                  <option value="indexedString">String</option>
                  <option value="indexedNumber">Number</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <button
              onClick={() => removeField(nodeId, field.id)}
              className="nodrag nopan mb-1 flex size-10 shrink-0 items-center justify-center rounded-xl text-gray-400 border border-gray-100 bg-white shadow-md transition hover:bg-gray-50 hover:text-red-500"
              title={isRelation ? 'Remove relation (also removes edge)' : 'Remove field'}
            >
              <Minus className="size-4" />
            </button>
          </div>
        )
      })}

      <Button
        size="sm"
        onClick={() => addField(nodeId)}
        variant="outline"
        className="nodrag nopan h-12 w-full rounded-[14px] border border-dashed border-gray-300 text-gray-500 transition-all duration-300 hover:border-orange-400 hover:bg-orange-50/50 hover:text-orange-600 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] shadow-none font-mono tracking-widest uppercase text-[12px] bg-transparent"
      >
        <Plus className="mr-2 size-3.5 transition-transform group-hover:rotate-90" />
        Add Attribute
      </Button>
    </div>
  )
}
