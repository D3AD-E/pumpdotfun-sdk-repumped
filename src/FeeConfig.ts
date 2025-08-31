import { PublicKey } from "@solana/web3.js";
import { BondingCurveAccount } from "./BondingCurveAccount.js";
import { Layout, struct, u64, bool, publicKey, array } from "@coral-xyz/borsh";
import { GlobalAccount } from "./GlobalAccount.js";
import { BN } from "@coral-xyz/anchor";

export interface CalculatedFeesBps {
  protocolFeeBps: bigint;
  creatorFeeBps: bigint;
}

export interface CalculatedFees {
  protocolFee: bigint;
  creatorFee: bigint;
}

export interface FeeTier {
  marketCapLamportsThreshold: bigint;
  fees: Fees;
}

export interface Fees {
  lpFeeBps: bigint;
  protocolFeeBps: bigint;
  creatorFeeBps: bigint;
}

export interface FeeConfigAnchor {
  admin: PublicKey;
  flatFees: FeesAnchor;
  feeTiers: FeeTierAnchor[];
}

export interface FeeTierAnchor {
  marketCapLamportsThreshold: BN;
  fees: FeesAnchor;
}

export interface FeesAnchor {
  lpFeeBps: BN;
  protocolFeeBps: BN;
  creatorFeeBps: BN;
}

export class FeeConfig {
  public discriminator: bigint;
  public admin: PublicKey;
  public flatFees: Fees;
  public feeTiers: FeeTier[];

  constructor(
    discriminator: bigint,
    admin: PublicKey,
    flatFees: Fees,
    feeTiers: FeeTier[]
  ) {
    this.discriminator = discriminator;
    this.admin = admin;
    this.flatFees = flatFees;
    this.feeTiers = feeTiers;
  }

  getFee({
    global,
    bondingCurve,
    amount,
    isNewBondingCurve,
  }: {
    global: GlobalAccount;
    bondingCurve: BondingCurveAccount;
    amount: bigint;
    isNewBondingCurve: boolean;
  }) {
    const { virtualSolReserves, virtualTokenReserves } = bondingCurve;
    const { protocolFeeBps, creatorFeeBps } = this.computeFeesBps({
      global,
      virtualSolReserves,
      virtualTokenReserves,
    });

    return (
      this.fee(amount, protocolFeeBps) +
      (isNewBondingCurve || !PublicKey.default.equals(bondingCurve.creator)
        ? this.fee(amount, creatorFeeBps)
        : 0n)
    );
  }

  bondingCurveMarketCap({
    mintSupply,
    virtualSolReserves,
    virtualTokenReserves,
  }: {
    mintSupply: bigint;
    virtualSolReserves: bigint;
    virtualTokenReserves: bigint;
  }): bigint {
    if (virtualTokenReserves === 0n) {
      throw new Error(
        "Division by zero: virtual token reserves cannot be zero"
      );
    }
    return (virtualSolReserves * mintSupply) / virtualTokenReserves;
  }

  computeFeesBps({
    global,
    virtualSolReserves,
    virtualTokenReserves,
  }: {
    global: GlobalAccount;
    virtualSolReserves: bigint;
    virtualTokenReserves: bigint;
  }): CalculatedFeesBps {
    const marketCap = this.bondingCurveMarketCap({
      mintSupply: global.tokenTotalSupply,
      virtualSolReserves,
      virtualTokenReserves,
    });

    return this.calculateFeeTier({
      feeTiers: this.feeTiers,
      marketCap,
    });
  }

  calculateFeeTier({
    feeTiers,
    marketCap,
  }: {
    feeTiers: FeeTier[];
    marketCap: bigint;
  }): Fees {
    const firstTier = feeTiers[0];

    if (marketCap < firstTier.marketCapLamportsThreshold) {
      return firstTier.fees;
    }

    for (const tier of feeTiers.slice().reverse()) {
      if (marketCap >= tier.marketCapLamportsThreshold) {
        return tier.fees;
      }
    }

    return firstTier.fees;
  }

  fee(amount: bigint, feeBasisPoints: bigint): bigint {
    return this.ceilDiv(amount * feeBasisPoints, 10000n);
  }

  ceilDiv(a: bigint, b: bigint): bigint {
    return (a + (b - 1n)) / b;
  }

  public static convert(base: FeeConfigAnchor): FeeConfig {
    const flatFees: Fees = {
      lpFeeBps: BigInt(base.flatFees.lpFeeBps.toString()),
      protocolFeeBps: BigInt(base.flatFees.protocolFeeBps.toString()),
      creatorFeeBps: BigInt(base.flatFees.creatorFeeBps.toString()),
    };

    const feeTiers: FeeTier[] = base.feeTiers.map((tier) => ({
      marketCapLamportsThreshold: BigInt(
        tier.marketCapLamportsThreshold.toString()
      ),
      fees: {
        lpFeeBps: BigInt(tier.fees.lpFeeBps.toString()),
        protocolFeeBps: BigInt(tier.fees.protocolFeeBps.toString()),
        creatorFeeBps: BigInt(tier.fees.creatorFeeBps.toString()),
      },
    }));

    return new FeeConfig(
      0n, // discriminator not available in FeeConfigAnchor
      base.admin,
      flatFees,
      feeTiers
    );
  }
}
