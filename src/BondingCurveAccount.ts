import { struct, bool, u64, Layout, publicKey } from "@coral-xyz/borsh";
import { PublicKey } from "@solana/web3.js";
import { FeeConfig } from "./FeeConfig.js";
import { GlobalAccount } from "./GlobalAccount.js";

export class BondingCurveAccount {
  public discriminator: bigint;
  public virtualTokenReserves: bigint;
  public virtualSolReserves: bigint;
  public realTokenReserves: bigint;
  public realSolReserves: bigint;
  public tokenTotalSupply: bigint;
  public complete: boolean;
  public creator: PublicKey;

  constructor(
    discriminator: bigint,
    virtualTokenReserves: bigint,
    virtualSolReserves: bigint,
    realTokenReserves: bigint,
    realSolReserves: bigint,
    tokenTotalSupply: bigint,
    complete: boolean,
    creator: PublicKey
  ) {
    this.discriminator = discriminator;
    this.virtualTokenReserves = virtualTokenReserves;
    this.virtualSolReserves = virtualSolReserves;
    this.realTokenReserves = realTokenReserves;
    this.realSolReserves = realSolReserves;
    this.tokenTotalSupply = tokenTotalSupply;
    this.complete = complete;
    this.creator = creator;
  }

  getBuyPrice(
    globalAccount: GlobalAccount,
    feeConfig: FeeConfig,
    amount: bigint
  ): bigint {
    if (this.complete) {
      throw new Error("Curve is complete");
    }

    if (amount <= 0n) {
      return 0n;
    }
    if (this.virtualTokenReserves === 0n) {
      return 0n;
    }
    const { protocolFeeBps, creatorFeeBps } = feeConfig.computeFeesBps({
      global: globalAccount,
      virtualSolReserves: this.virtualSolReserves,
      virtualTokenReserves: this.virtualTokenReserves,
    });
    const totalFeeBasisPoints =
      protocolFeeBps +
      (!PublicKey.default.equals(this.creator) ? creatorFeeBps : 0n);

    const inputAmount = (amount * 10_000n) / (totalFeeBasisPoints + 10_000n);

    const tokensReceived = this.getBuyTokenAmountFromSolAmountQuote({
      inputAmount,
      virtualTokenReserves: this.virtualTokenReserves,
      virtualSolReserves: this.virtualSolReserves,
    });

    return tokensReceived < this.realTokenReserves
      ? tokensReceived
      : this.realTokenReserves;
  }

  getBuyTokenAmountFromSolAmountQuote({
    inputAmount,
    virtualTokenReserves,
    virtualSolReserves,
  }: {
    inputAmount: bigint;
    virtualTokenReserves: bigint;
    virtualSolReserves: bigint;
  }): bigint {
    return (
      (inputAmount * virtualTokenReserves) / (virtualSolReserves + inputAmount)
    );
  }

  getSellSolAmountFromTokenAmountQuote({
    inputAmount,
    virtualTokenReserves,
    virtualSolReserves,
  }: {
    inputAmount: bigint;
    virtualTokenReserves: bigint;
    virtualSolReserves: bigint;
  }): bigint {
    return (
      (inputAmount * virtualSolReserves) / (virtualTokenReserves + inputAmount)
    );
  }

  getSellPrice(
    globalAccount: GlobalAccount,
    feeConfig: FeeConfig,
    amount: bigint
  ): bigint {
    if (this.complete) {
      throw new Error("Curve is complete");
    }

    if (amount <= 0n) {
      return 0n;
    }
    if (this.virtualTokenReserves === 0n) {
      return 0n;
    }
    const solCost = this.getSellSolAmountFromTokenAmountQuote({
      inputAmount: amount,
      virtualTokenReserves: this.virtualTokenReserves,
      virtualSolReserves: this.virtualSolReserves,
    });

    const fee = feeConfig.getFee({
      global: globalAccount,
      bondingCurve: this,
      amount: solCost,
      isNewBondingCurve: false,
    });
    return solCost - fee;
  }

  getMarketCapSOL(): bigint {
    if (this.virtualTokenReserves === 0n) {
      return 0n;
    }

    return (
      (this.tokenTotalSupply * this.virtualSolReserves) /
      this.virtualTokenReserves
    );
  }

  getFinalMarketCapSOL(mintSupply: bigint): bigint {
    return (this.virtualSolReserves * mintSupply) / this.virtualTokenReserves;
  }

  public static fromBuffer(buffer: Buffer): BondingCurveAccount {
    const structure: Layout<BondingCurveAccount> = struct([
      u64("discriminator"),
      u64("virtualTokenReserves"),
      u64("virtualSolReserves"),
      u64("realTokenReserves"),
      u64("realSolReserves"),
      u64("tokenTotalSupply"),
      bool("complete"),
      publicKey("creator"),
    ]);

    let value = structure.decode(buffer);
    return new BondingCurveAccount(
      BigInt(value.discriminator),
      BigInt(value.virtualTokenReserves),
      BigInt(value.virtualSolReserves),
      BigInt(value.realTokenReserves),
      BigInt(value.realSolReserves),
      BigInt(value.tokenTotalSupply),
      value.complete,
      value.creator
    );
  }
}
