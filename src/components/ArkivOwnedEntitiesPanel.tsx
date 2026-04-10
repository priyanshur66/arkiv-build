"use client";

import { ExternalLink, LoaderCircle, RefreshCw, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useArkivStore } from "@/store/useArkivStore";

const shortKey = (value: string) => `${value.slice(0, 10)}...${value.slice(-6)}`;

export function ArkivOwnedEntitiesPanel() {
  const account = useArkivStore((state) => state.account);
  const walletAvailable = useArkivStore((state) => state.walletAvailable);
  const ownedEntities = useArkivStore((state) => state.ownedEntities);
  const loadingOwnedEntities = useArkivStore((state) => state.loadingOwnedEntities);
  const loadingSelectedEntity = useArkivStore((state) => state.loadingSelectedEntity);
  const refreshOwnedEntities = useArkivStore((state) => state.refreshOwnedEntities);
  const loadEntityIntoCanvas = useArkivStore((state) => state.loadEntityIntoCanvas);

  return (
    <div className="flex w-[24rem] min-h-0 flex-1 flex-col rounded-[16px] border border-gray-200 bg-white/80 backdrop-blur-xl p-5 shadow-2xl shadow-gray-200/50">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 font-mono">
            Wallet-Owned Entities
          </p>
          <p className="mt-1 text-sm text-gray-700">
            Load entities owned by the connected wallet 
          </p>
        </div>

        <Button
          variant="outline"
          size="icon-sm"
          className="rounded-xl border-gray-200 shadow-sm transition-all duration-300 hover:rotate-180 hover:bg-gray-100 hover:shadow-md"
          onClick={refreshOwnedEntities}
          disabled={!account || loadingOwnedEntities}
        >
          <RefreshCw className={`size-4 ${loadingOwnedEntities ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="mt-4 flex min-h-0 flex-1 flex-col rounded-[12px] border border-gray-200 bg-gray-50/50 p-3">
        {!walletAvailable ? (
          <div className="flex items-start gap-3 text-sm text-gray-600">
            <Wallet className="mt-0.5 size-4 text-gray-400" />
            MetaMask is required to browse wallet-owned Arkiv entities.
          </div>
        ) : !account ? (
          <div className="flex items-start gap-3 text-sm text-gray-600">
            <Wallet className="mt-0.5 size-4 text-gray-400" />
            Connect your wallet to fetch entities already deployed on Arkiv Kaolin.
          </div>
        ) : loadingOwnedEntities ? (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <LoaderCircle className="size-4 animate-spin" />
            Loading entities from Kaolin...
          </div>
        ) : ownedEntities.length === 0 ? (
          <p className="shrink-0 text-sm text-gray-600">
            No wallet-owned entities were found on Arkiv Kaolin yet.
          </p>
        ) : (
          <div className="flex-1 space-y-2 overflow-y-auto px-1 pt-2 pb-2">
            {ownedEntities.map((entity) => (
              <button
                key={entity.key}
                type="button"
                onClick={() => loadEntityIntoCanvas(entity.key)}
                disabled={!entity.compatible || loadingSelectedEntity}
                className="group flex w-full items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-4 text-left shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-500/10 hover:ring-[#ff7a45] hover:border-transparent active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold text-gray-900">
                      {entity.label}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-gray-600">
                    {entity.preview}
                  </p>
                  <p className="mt-1 font-mono text-[12px] text-gray-500">
                    {shortKey(entity.key)}
                  </p>
                  {entity.createdAtBlock ? (
                    <p className="mt-1 text-[12px] text-gray-400">
                      Created at block {entity.createdAtBlock}
                    </p>
                  ) : null}
                  {entity.unsupportedReason ? (
                    <p className="mt-1 text-[12px] text-rose-600">
                      {entity.unsupportedReason}
                    </p>
                  ) : null}
                </div>

                <a
                  href={entity.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => event.stopPropagation()}
                  className="rounded-lg border border-gray-100 bg-gray-50 p-2 text-gray-400 transition-all duration-300 hover:bg-[#ff7a45] hover:text-white hover:scale-110 hover:shadow-md group-hover:border-transparent"
                  aria-label="Open in Arkiv explorer"
                >
                  <ExternalLink className="size-3.5" />
                </a>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
