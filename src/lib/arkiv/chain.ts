import { braga } from "@arkiv-network/sdk/chains";
import type { Hex } from "viem";

export const ARKIV_CHAIN = braga;
export const ARKIV_CHAIN_HEX = `0x${ARKIV_CHAIN.id.toString(16)}`;
export const ARKIV_RPC_URL = ARKIV_CHAIN.rpcUrls.default.http[0];
export const ARKIV_EXPLORER_URL = ARKIV_CHAIN.blockExplorers?.default.url;
export const ARKIV_FAUCET_URL = "https://braga.hoodi.arkiv.network/faucet/";
export const ARKIV_DOCS_URL = "https://docs.arkiv.network/";

export const isArkivBragaChain = (chainId?: number | null) =>
  chainId === ARKIV_CHAIN.id;

export const getEntityExplorerUrl = (entityKey: Hex) =>
  `${ARKIV_EXPLORER_URL}/entity/${entityKey}`;
