'use client'

import { Loader2, Wand2 } from 'lucide-react'
import { startTransition, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  buildSchemaGraphFromGeneratedModel,
  hasMeaningfulCanvasModel,
  serializeCanvasToGeneratedDataModel,
  type DataModelGenerationMode,
  type GeneratedDataModel,
} from '@/lib/ai/dataModel'
import { useSchemaStore } from '@/store/useSchemaStore'

const MODEL_UNAVAILABLE_MESSAGE =
  'Model unavailable temporarily, please try later.'

type GenerateModelResponse = {
  dataModel?: GeneratedDataModel
  model?: string
  error?: string
}

export function UseCasePromptPanel() {
  const nodes = useSchemaStore((state) => state.nodes)
  const edges = useSchemaStore((state) => state.edges)
  const loadGraphOfEntities = useSchemaStore((state) => state.loadGraphOfEntities)
  const [useCase, setUseCase] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string>()
  const hasExistingModel = useMemo(
    () => hasMeaningfulCanvasModel(nodes, edges),
    [nodes, edges],
  )

  const handleGenerateModel = async () => {
    const trimmedUseCase = useCase.trim()
    if (!trimmedUseCase) {
      setError('Describe the product, users, entities, and relationships first.')
      return
    }

    setIsGenerating(true)
    setError(undefined)

    try {
      const mode: DataModelGenerationMode = hasExistingModel ? 'edit' : 'create'
      const currentModel = hasExistingModel
        ? serializeCanvasToGeneratedDataModel(nodes, edges)
        : undefined

      const response = await fetch('/api/ai/data-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode,
          useCase: trimmedUseCase,
          currentModel,
        }),
      })

      const payload = (await response.json()) as GenerateModelResponse

      if (!response.ok || !payload.dataModel) {
        throw new Error(payload.error || 'Failed to generate a deployable data model.')
      }

      const { nodes: nextNodes, edges: nextEdges } = buildSchemaGraphFromGeneratedModel(
        payload.dataModel,
      )

      startTransition(() => {
        loadGraphOfEntities(nextNodes, nextEdges)
      })

      setUseCase('')
    } catch (nextError) {
      void nextError
      setError(MODEL_UNAVAILABLE_MESSAGE)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="w-full">
      <textarea
        value={useCase}
        onChange={(event) => setUseCase(event.target.value)}
        className="min-h-[112px] w-full resize-none rounded-[16px] border border-[#ffc4a6] bg-white/95 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#ff7a45] focus:bg-white"
        placeholder={
          hasExistingModel
            ? 'Type a follow-up prompt to refine the current model'
            : 'Describe the app or schema you want to generate'
        }
        spellCheck={false}
      />

      <div className="mt-3 flex items-center justify-end gap-3">
        {error ? (
          <p className="flex-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </p>
        ) : null}
        <Button
          onClick={handleGenerateModel}
          disabled={isGenerating}
          className="h-11 rounded-[14px] bg-[#ff7a45] px-5 font-semibold text-white transition-colors hover:bg-[#ff692a]"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Generating
            </>
          ) : (
            <>
              <Wand2 className="mr-2 size-4" />
              {hasExistingModel ? 'Update Model' : 'Generate Model'}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
