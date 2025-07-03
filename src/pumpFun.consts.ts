import { Commitment, Finality } from "@solana/web3.js";
import { Region } from "./pumpFun.types.js";

export const MPL_TOKEN_METADATA_PROGRAM_ID =
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";

export const GLOBAL_ACCOUNT_SEED = "global";
export const MINT_AUTHORITY_SEED = "mint-authority";
export const BONDING_CURVE_SEED = "bonding-curve";
export const METADATA_SEED = "metadata";
export const EVENT_AUTHORITY_SEED = "__event_authority";

export const DEFAULT_DECIMALS = 6;

export const DEFAULT_COMMITMENT: Commitment = "finalized";
export const DEFAULT_FINALITY: Finality = "finalized";

export const SLOT_ENDPOINT_BY_REGION: Record<Region, string> = {
  [Region.Frankfurt]: "de1.0slot.trade",
  [Region.NY]: "ny1.0slot.trade",
  [Region.Tokyo]: "jp.0slot.trade",
  [Region.Amsterdam]: "ams1.0slot.trade",
  [Region.LosAngeles]: "la1.0slot.trade",
};

export const ASTRA_ENDPOINT_BY_REGION: Partial<Record<Region, string>> = {
  [Region.Frankfurt]: "fr.gateway.astralane.io",
  [Region.NY]: "ny.gateway.astralane.io",
  [Region.Tokyo]: "jp.gateway.astralane.io",
  [Region.Amsterdam]: "ams.gateway.astralane.io",
};

export const NODE1_ENDPOINT_BY_REGION: Partial<Record<Region, string>> = {
  [Region.NY]: "ny.node1.me",
  [Region.Tokyo]: "ny.node1.me",
  [Region.Amsterdam]: "ams.node1.me",
  [Region.Frankfurt]: "fra.node1.me",
};

export const NEXTBLOCK_ENDPOINT_BY_REGION: Partial<Record<Region, string>> = {
  [Region.Tokyo]: "tokyo.nextblock.io",
  [Region.Frankfurt]: "fra.nextblock.io",
  [Region.NY]: "ny.nextblock.io",
};

export const getHealthBody = JSON.stringify({
  jsonrpc: "2.0",
  id: 1,
  method: "getHealth",
});
