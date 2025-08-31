import {
  createAssociatedTokenAccountInstruction,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { PublicKey, Transaction, Commitment } from "@solana/web3.js";
import { DEFAULT_COMMITMENT } from "../pumpFun.consts.js";
import { CreateTokenMetadata } from "../pumpFun.types.js";
import { PumpFunSDK } from "../PumpFunSDK.js";
import { BondingCurveAccount } from "../BondingCurveAccount.js";
import { GlobalAccount } from "../GlobalAccount.js";
import { FeeConfig } from "../FeeConfig.js";

export class TokenModule {
  constructor(private sdk: PumpFunSDK) {}

  async createTokenMetadata(create: CreateTokenMetadata) {
    // Validate file
    if (!(create.file instanceof Blob)) {
      throw new Error("File must be a Blob or File object");
    }

    let formData = new FormData();
    formData.append("file", create.file, "image.png"); // Add filename
    formData.append("name", create.name);
    formData.append("symbol", create.symbol);
    formData.append("description", create.description);
    formData.append("twitter", create.twitter || "");
    formData.append("telegram", create.telegram || "");
    formData.append("website", create.website || "");
    formData.append("showName", "true");

    try {
      const request = await fetch("https://pump.fun/api/ipfs", {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: formData,
        credentials: "same-origin",
      });

      if (request.status === 500) {
        // Try to get more error details
        const errorText = await request.text();
        throw new Error(
          `Server error (500): ${errorText || "No error details available"}`
        );
      }

      if (!request.ok) {
        throw new Error(`HTTP error! status: ${request.status}`);
      }

      const responseText = await request.text();
      if (!responseText) {
        throw new Error("Empty response received from server");
      }

      try {
        return JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Invalid JSON response: ${responseText}`);
      }
    } catch (error) {
      console.error("Error in createTokenMetadata:", error);
      throw error;
    }
  }

  async createAssociatedTokenAccountIfNeeded(
    payer: PublicKey,
    owner: PublicKey,
    mint: PublicKey,
    transaction: Transaction,
    commitment: Commitment = DEFAULT_COMMITMENT
  ): Promise<PublicKey> {
    const associatedTokenAccount = await getAssociatedTokenAddress(
      mint,
      owner,
      false
    );

    try {
      await getAccount(this.sdk.connection, associatedTokenAccount, commitment);
    } catch (e) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          payer,
          associatedTokenAccount,
          owner,
          mint
        )
      );
    }

    return associatedTokenAccount;
  }

  async getBondingCurveAccount(
    mint: PublicKey,
    commitment: Commitment = DEFAULT_COMMITMENT
  ) {
    const tokenAccount = await this.sdk.connection.getAccountInfo(
      this.sdk.pda.getBondingCurvePDA(mint),
      commitment
    );
    if (!tokenAccount) {
      return null;
    }
    return BondingCurveAccount.fromBuffer(tokenAccount!.data);
  }

  async getGlobalAccount(commitment: Commitment = DEFAULT_COMMITMENT) {
    const globalAccountPDA = this.sdk.pda.getGlobalAccountPda();

    const tokenAccount = await this.sdk.connection.getAccountInfo(
      globalAccountPDA,
      commitment
    );

    return GlobalAccount.fromBuffer(tokenAccount!.data);
  }

  async getFeeConfig(commitment: Commitment = DEFAULT_COMMITMENT) {
    const feePda = this.sdk.pda.getPumpFeeConfigPda();

    const tokenAccount = await this.sdk.connection.getAccountInfo(
      feePda,
      commitment
    );

    return FeeConfig.fromBuffer(tokenAccount!.data);
  }

  async getBondingCurveCreator(
    bondingCurvePDA: PublicKey,
    commitment: Commitment = DEFAULT_COMMITMENT
  ): Promise<PublicKey> {
    const bondingAccountInfo = await this.sdk.connection.getAccountInfo(
      bondingCurvePDA,
      commitment
    );
    if (!bondingAccountInfo) {
      throw new Error("Bonding curve account not found");
    }

    // Creator is at offset 49 (after 8 bytes discriminator, 5 u64 fields, and 1 byte boolean)
    const creatorBytes = bondingAccountInfo.data.subarray(49, 49 + 32);
    return new PublicKey(creatorBytes);
  }
}
