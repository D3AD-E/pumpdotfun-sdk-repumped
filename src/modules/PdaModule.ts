import { PublicKey } from "@solana/web3.js";
import {
  GLOBAL_ACCOUNT_SEED,
  EVENT_AUTHORITY_SEED,
  BONDING_CURVE_SEED,
  MINT_AUTHORITY_SEED,
  MPL_TOKEN_METADATA_PROGRAM_ID,
  METADATA_SEED,
  GLOBAL_VOLUME_SEED,
  USER_VOLUME_SEED,
} from "../pumpFun.consts.js";
import { PumpFunSDK } from "../PumpFunSDK.js";

export class PdaModule {
  constructor(private sdk: PumpFunSDK) {}

  getCreatorVaultPda(creator: PublicKey): PublicKey {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("creator-vault"), creator.toBuffer()],
      this.sdk.program.programId
    )[0];
  }

  getGlobalAccountPda(): PublicKey {
    return PublicKey.findProgramAddressSync(
      [Buffer.from(GLOBAL_ACCOUNT_SEED)],
      this.sdk.program.programId
    )[0];
  }

  getEventAuthorityPda(): PublicKey {
    return PublicKey.findProgramAddressSync(
      [Buffer.from(EVENT_AUTHORITY_SEED)],
      this.sdk.program.programId
    )[0];
  }

  getBondingCurvePDA(mint: PublicKey) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from(BONDING_CURVE_SEED), mint.toBuffer()],
      this.sdk.program.programId
    )[0];
  }

  getMintAuthorityPDA() {
    return PublicKey.findProgramAddressSync(
      [Buffer.from(MINT_AUTHORITY_SEED)],
      this.sdk.program.programId
    )[0];
  }

  getMetadataPDA(mint: PublicKey): PublicKey {
    const metadataProgram = new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID);

    const [metadataPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from(METADATA_SEED), metadataProgram.toBuffer(), mint.toBuffer()],
      metadataProgram
    );
    return metadataPDA;
  }

  getGlobalVolumeAccumulatorPda(): PublicKey {
    return PublicKey.findProgramAddressSync(
      [Buffer.from(GLOBAL_VOLUME_SEED)],
      this.sdk.program.programId
    )[0];
  }

  getUserVolumeAccumulatorPda(user: PublicKey): PublicKey {
    return PublicKey.findProgramAddressSync(
      [Buffer.from(USER_VOLUME_SEED), user.toBuffer()],
      this.sdk.program.programId
    )[0];
  }
}
