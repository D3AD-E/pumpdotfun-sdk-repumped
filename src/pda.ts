import { PublicKey } from "@solana/web3.js";
import {
  GLOBAL_ACCOUNT_SEED,
  EVENT_AUTHORITY_SEED,
  BONDING_CURVE_SEED,
  MINT_AUTHORITY_SEED,
} from "./pumpFun.consts.js";

export function getCreatorVaultPda(creator: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("creator-vault"), creator.toBuffer()],
    this.program.programId
  )[0];
}

export function getGlobalAccountPda(): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(GLOBAL_ACCOUNT_SEED)],
    this.program.programId
  )[0];
}

export function getEventAuthorityPda(): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(EVENT_AUTHORITY_SEED)],
    this.program.programId
  )[0];
}

export function getBondingCurvePDA(mint: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(BONDING_CURVE_SEED), mint.toBuffer()],
    this.program.programId
  )[0];
}

export function getMintAuthorityPDA() {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(MINT_AUTHORITY_SEED)],
    this.sdk.program.programId
  )[0];
}
