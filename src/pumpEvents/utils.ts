import { PublicKey, PublicKeyInitData } from "@solana/web3.js";

export const toPubKey = (v: PublicKeyInitData): PublicKey => new PublicKey(v);
export const toBigInt = (v: string | number | bigint | boolean): bigint =>
  BigInt(v);
