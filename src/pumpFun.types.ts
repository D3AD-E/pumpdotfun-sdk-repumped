import { Keypair, VersionedTransactionResponse } from "@solana/web3.js";

export type CreateTokenMetadata = {
  name: string;
  symbol: string;
  description: string;
  file: Blob;
  twitter?: string;
  telegram?: string;
  website?: string;
};
export type PriorityFee = {
  unitLimit: number;
  unitPrice: number;
};

export type TransactionResult = {
  signature?: string;
  error?: unknown;
  results?: VersionedTransactionResponse;
  success: boolean;
};

export type PumpOptions = {
  jitoUrl: string;
  authKeypair: Keypair;
};

export type JitoResult = {
  bundleId?: string;
  error?: unknown;
  success: boolean;
};
