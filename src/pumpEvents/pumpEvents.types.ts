import { PublicKey } from "@solana/web3.js";

export type CollectCreatorFeeEvent = {
  timestamp: number;
  creator: PublicKey;
  creatorFee: bigint;
};

export type CompleteEvent = {
  user: PublicKey;
  mint: PublicKey;
  bondingCurve: PublicKey;
  timestamp: number;
};

export type CompletePumpAmmMigrationEvent = {
  user: PublicKey;
  mint: PublicKey;
  mintAmount: bigint;
  solAmount: bigint;
  poolMigrationFee: bigint;
  bondingCurve: PublicKey;
  timestamp: number;
  pool: PublicKey;
};

export type CreateEvent = {
  name: string;
  symbol: string;
  uri: string;
  mint: PublicKey;
  bondingCurve: PublicKey;
  user: PublicKey;
  creator: PublicKey;
  timestamp: number;
  virtualTokenReserves: bigint;
  virtualSolReserves: bigint;
  realTokenReserves: bigint;
  tokenTotalSupply: bigint;
};

export type ExtendAccountEvent = {
  account: PublicKey;
  user: PublicKey;
  currentSize: bigint;
  newSize: bigint;
  timestamp: number;
};

export type SetCreatorEvent = {
  timestamp: number;
  mint: PublicKey;
  bondingCurve: PublicKey;
  creator: PublicKey;
};

export type SetMetaplexCreatorEvent = {
  timestamp: number;
  mint: PublicKey;
  bondingCurve: PublicKey;
  metadata: PublicKey;
  creator: PublicKey;
};

export type SetParamsEvent = {
  initialVirtualTokenReserves: bigint;
  initialVirtualSolReserves: bigint;
  initialRealTokenReserves: bigint;
  finalRealSolReserves: bigint;
  tokenTotalSupply: bigint;
  feeBasisPoints: bigint;
  withdrawAuthority: PublicKey;
  enableMigrate: boolean;
  poolMigrationFee: bigint;
  creatorFeeBasisPoints: bigint;
  feeRecipients: PublicKey[]; // length: 8
  timestamp: number;
  setCreatorAuthority: PublicKey;
};

export type TradeEvent = {
  mint: PublicKey;
  solAmount: bigint;
  tokenAmount: bigint;
  isBuy: boolean;
  user: PublicKey;
  timestamp: number;
  virtualSolReserves: bigint;
  virtualTokenReserves: bigint;
  realSolReserves: bigint;
  realTokenReserves: bigint;
  feeRecipient: PublicKey;
  feeBasisPoints: bigint;
  fee: bigint;
  creator: PublicKey;
  creatorFeeBasisPoints: bigint;
  creatorFee: bigint;
};

export type UpdateGlobalAuthorityEvent = {
  global: PublicKey;
  authority: PublicKey;
  newAuthority: PublicKey;
  timestamp: number;
};

export interface PumpFunEventHandlers {
  collectCreatorFeeEvent: CollectCreatorFeeEvent;
  completeEvent: CompleteEvent;
  completePumpAmmMigrationEvent: CompletePumpAmmMigrationEvent;
  createEvent: CreateEvent;
  extendAccountEvent: ExtendAccountEvent;
  setCreatorEvent: SetCreatorEvent;
  setMetaplexCreatorEvent: SetMetaplexCreatorEvent;
  setParamsEvent: SetParamsEvent;
  tradeEvent: TradeEvent;
  updateGlobalAuthorityEvent: UpdateGlobalAuthorityEvent;
}

export type PumpFunEventType = keyof PumpFunEventHandlers;

export type EventConverterMap = {
  [K in PumpFunEventType]: (event: any) => PumpFunEventHandlers[K];
};
