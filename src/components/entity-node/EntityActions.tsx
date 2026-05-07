'use client'

import { CheckCircle, Loader2, RefreshCw, Rocket } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { isArkivBragaChain } from '@/lib/arkiv/chain'
import { useArkivStore } from '@/store/useArkivStore'
import type { EntityNodeData } from '@/store/useSchemaStore'

export function EntityActions({
  nodeId,
  data,
  isDraft,
  hasPendingParent,
  updateSuccess,
  onUpdate,
}: {
  nodeId: string
  data: EntityNodeData
  isDraft: boolean
  hasPendingParent: boolean
  updateSuccess: boolean
  onUpdate: () => void
}) {
  const updating = useArkivStore((s) => s.updating)
  const deployDraft = useArkivStore((s) => s.deployDraft)
  const deploying = useArkivStore((s) => s.deploying)
  const deployingNodeId = useArkivStore((s) => s.deployingNodeId)
  const walletAvailable = useArkivStore((s) => s.walletAvailable)
  const account = useArkivStore((s) => s.account)
  const chainId = useArkivStore((s) => s.chainId)

  if (isDraft) {
    return (
      <div className="flex flex-col gap-3">
        {hasPendingParent && (
          <div className="w-full rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-mono uppercase tracking-widest text-amber-700 text-center">
            Deploy parent relations first
          </div>
        )}
        <Button
          size="sm"
          onClick={() => deployDraft(nodeId)}
          disabled={
            !walletAvailable ||
            !account ||
            !isArkivBragaChain(chainId) ||
            deploying ||
            hasPendingParent
          }
          className="nodrag nopan h-14 w-full rounded-[14px] bg-[#1a1a1a] shadow-lg shadow-black/10 text-white font-mono tracking-widest uppercase text-xs transition-all duration-300 hover:bg-[#333] hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1 active:scale-[0.98] disabled:hover:translate-y-0 disabled:hover:scale-100"
        >
          {deploying && deployingNodeId === nodeId ? (
            <>
              <Loader2 className="mr-3 size-4 animate-spin" />
              Deploying…
            </>
          ) : !account ? (
            <>
              <Rocket className="mr-3 size-4 opacity-50" />
              Connect wallet to deploy
            </>
          ) : hasPendingParent ? (
            <>
              <Rocket className="mr-3 size-4 opacity-50" />
              Blocked
            </>
          ) : data.deployFailed ? (
            <>
              <Rocket className="mr-3 size-4" />
              Redeploy to Arkiv Braga
            </>
          ) : (
            <>
              <Rocket className="mr-3 size-4" />
              Deploy to Arkiv Braga
            </>
          )}
        </Button>
      </div>
    )
  }

  return (
    <Button
      size="sm"
      onClick={onUpdate}
      disabled={updating}
      className={[
        'nodrag nopan h-14 w-full rounded-[14px] shadow-lg text-white font-mono tracking-widest uppercase text-xs transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] disabled:hover:translate-y-0 disabled:hover:scale-100',
        updateSuccess
          ? 'bg-[#1a1a1a] hover:bg-[#333] shadow-black/10'
          : 'bg-[#ff7a45] hover:bg-[#ff692a] shadow-orange-500/30',
      ].join(' ')}
    >
      {updating ? (
        <>
          <Loader2 className="mr-3 size-4 animate-spin" />
          Updating…
        </>
      ) : updateSuccess ? (
        <>
          <CheckCircle className="mr-3 size-4" />
          Updated!
        </>
      ) : (
        <>
          <RefreshCw className="mr-3 size-4" />
          Update Entity State
        </>
      )}
    </Button>
  )
}
