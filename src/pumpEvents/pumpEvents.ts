import {
  CollectCreatorFeeEvent,
  CompleteEvent,
  CompletePumpAmmMigrationEvent,
  CreateEvent,
  ExtendAccountEvent,
  SetCreatorEvent,
  SetMetaplexCreatorEvent,
  SetParamsEvent,
  TradeEvent,
  UpdateGlobalAuthorityEvent,
} from "./pumpEvents.types.js";
import { toPubKey, toBigInt } from "./utils.js";

export function toCollectCreatorFeeEvent(e: any): CollectCreatorFeeEvent {
  return {
    timestamp: Number(e.timestamp),
    creator: toPubKey(e.creator),
    creatorFee: toBigInt(e.creatorFee),
  };
}

export function toCompleteEvent(e: any): CompleteEvent {
  return {
    user: toPubKey(e.user),
    mint: toPubKey(e.mint),
    bondingCurve: toPubKey(e.bondingCurve),
    timestamp: Number(e.timestamp),
  };
}

export function toCompletePumpAmmMigrationEvent(
  e: any
): CompletePumpAmmMigrationEvent {
  return {
    user: toPubKey(e.user),
    mint: toPubKey(e.mint),
    mintAmount: toBigInt(e.mintAmount),
    solAmount: toBigInt(e.solAmount),
    poolMigrationFee: toBigInt(e.poolMigrationFee),
    bondingCurve: toPubKey(e.bondingCurve),
    timestamp: Number(e.timestamp),
    pool: toPubKey(e.pool),
  };
}

export function toCreateEvent(e: any): CreateEvent {
  return {
    name: e.name,
    symbol: e.symbol,
    uri: e.uri,
    mint: toPubKey(e.mint),
    bondingCurve: toPubKey(e.bondingCurve),
    user: toPubKey(e.user),
    creator: toPubKey(e.creator),
    timestamp: Number(e.timestamp),
    virtualTokenReserves: toBigInt(e.virtualTokenReserves),
    virtualSolReserves: toBigInt(e.virtualSolReserves),
    realTokenReserves: toBigInt(e.realTokenReserves),
    tokenTotalSupply: toBigInt(e.tokenTotalSupply),
  };
}

export function toExtendAccountEvent(e: any): ExtendAccountEvent {
  return {
    account: toPubKey(e.account),
    user: toPubKey(e.user),
    currentSize: toBigInt(e.currentSize),
    newSize: toBigInt(e.newSize),
    timestamp: Number(e.timestamp),
  };
}

export function toSetCreatorEvent(e: any): SetCreatorEvent {
  return {
    timestamp: Number(e.timestamp),
    mint: toPubKey(e.mint),
    bondingCurve: toPubKey(e.bondingCurve),
    creator: toPubKey(e.creator),
  };
}

export function toSetMetaplexCreatorEvent(e: any): SetMetaplexCreatorEvent {
  return {
    timestamp: Number(e.timestamp),
    mint: toPubKey(e.mint),
    bondingCurve: toPubKey(e.bondingCurve),
    metadata: toPubKey(e.metadata),
    creator: toPubKey(e.creator),
  };
}

export function toSetParamsEvent(e: any): SetParamsEvent {
  return {
    initialVirtualTokenReserves: toBigInt(e.initialVirtualTokenReserves),
    initialVirtualSolReserves: toBigInt(e.initialVirtualSolReserves),
    initialRealTokenReserves: toBigInt(e.initialRealTokenReserves),
    finalRealSolReserves: toBigInt(e.finalRealSolReserves),
    tokenTotalSupply: toBigInt(e.tokenTotalSupply),
    feeBasisPoints: toBigInt(e.feeBasisPoints),
    withdrawAuthority: toPubKey(e.withdrawAuthority),
    enableMigrate: Boolean(e.enableMigrate),
    poolMigrationFee: toBigInt(e.poolMigrationFee),
    creatorFeeBasisPoints: toBigInt(e.creatorFeeBasisPoints),
    feeRecipients: e.feeRecipients.map(toPubKey),
    timestamp: Number(e.timestamp),
    setCreatorAuthority: toPubKey(e.setCreatorAuthority),
  };
}

export function toTradeEvent(e: any): TradeEvent {
  return {
    mint: toPubKey(e.mint),
    solAmount: toBigInt(e.solAmount),
    tokenAmount: toBigInt(e.tokenAmount),
    isBuy: Boolean(e.isBuy),
    user: toPubKey(e.user),
    timestamp: Number(e.timestamp),
    virtualSolReserves: toBigInt(e.virtualSolReserves),
    virtualTokenReserves: toBigInt(e.virtualTokenReserves),
    realSolReserves: toBigInt(e.realSolReserves),
    realTokenReserves: toBigInt(e.realTokenReserves),
    feeRecipient: toPubKey(e.feeRecipient),
    feeBasisPoints: toBigInt(e.feeBasisPoints),
    fee: toBigInt(e.fee),
    creator: toPubKey(e.creator),
    creatorFeeBasisPoints: toBigInt(e.creatorFeeBasisPoints),
    creatorFee: toBigInt(e.creatorFee),
  };
}

export function toUpdateGlobalAuthorityEvent(
  e: any
): UpdateGlobalAuthorityEvent {
  return {
    global: toPubKey(e.global),
    authority: toPubKey(e.authority),
    newAuthority: toPubKey(e.newAuthority),
    timestamp: Number(e.timestamp),
  };
}
