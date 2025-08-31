import BN from "bn.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import {
  Keypair,
  Commitment,
  Finality,
  Transaction,
  PublicKey,
} from "@solana/web3.js";
import { GlobalAccount } from "../GlobalAccount.js";

import { DEFAULT_COMMITMENT, DEFAULT_FINALITY } from "../pumpFun.consts.js";
import {
  CreateTokenMetadata,
  PriorityFee,
  TransactionResult,
} from "../pumpFun.types.js";
import { PumpFunSDK } from "../PumpFunSDK.js";
import {
  calculateWithSlippageBuy,
  calculateWithSlippageSell,
} from "../slippage.js";
import { sendTx } from "../tx.js";

export class TradeModule {
  constructor(private sdk: PumpFunSDK) {}

  async createAndBuy(
    creator: Keypair,
    mint: Keypair,
    metadata: CreateTokenMetadata,
    buyAmountSol: bigint,
    slippageBasisPoints: bigint = 500n,
    priorityFees?: PriorityFee,
    commitment: Commitment = DEFAULT_COMMITMENT,
    finality: Finality = DEFAULT_FINALITY
  ): Promise<TransactionResult> {
    const tokenMetadata = await this.sdk.token.createTokenMetadata(metadata);

    const createIx = await this.getCreateInstructions(
      creator.publicKey,
      metadata.name,
      metadata.symbol,
      tokenMetadata.metadataUri,
      mint
    );

    const transaction = new Transaction().add(createIx);

    if (buyAmountSol > 0n) {
      const globalAccount = await this.sdk.token.getGlobalAccount(commitment);
      const buyAmount = globalAccount.getInitialBuyPrice(buyAmountSol);
      const buyAmountWithSlippage = calculateWithSlippageBuy(
        buyAmountSol,
        slippageBasisPoints
      );

      await this.buildBuyIx(
        creator.publicKey,
        mint.publicKey,
        buyAmount,
        buyAmountWithSlippage,
        transaction,
        commitment,
        true
      );
    }

    return await sendTx(
      this.sdk.connection,
      transaction,
      creator.publicKey,
      [creator, mint],
      priorityFees,
      commitment,
      finality
    );
  }

  async buy(
    buyer: Keypair,
    mint: PublicKey,
    buyAmountSol: bigint,
    slippageBasisPoints: bigint = 500n,
    priorityFees?: PriorityFee,
    commitment: Commitment = DEFAULT_COMMITMENT,
    finality: Finality = DEFAULT_FINALITY
  ): Promise<TransactionResult> {
    const bondingAccount = await this.sdk.token.getBondingCurveAccount(
      mint,
      commitment
    );
    if (!bondingAccount) {
      throw new Error(`Bonding curve account not found: ${mint.toBase58()}`);
    }

    const feeConfig = await this.sdk.token.getFeeConfig(commitment);
    const globalAccount = await this.sdk.token.getGlobalAccount(commitment);
    const buyAmount = bondingAccount.getBuyPrice(
      globalAccount,
      feeConfig,
      buyAmountSol
    );
    const buyAmountWithSlippage = calculateWithSlippageBuy(
      buyAmountSol,
      slippageBasisPoints
    );

    const transaction = new Transaction();
    await this.buildBuyIx(
      buyer.publicKey,
      mint,
      buyAmount,
      buyAmountWithSlippage,
      transaction,
      commitment,
      false
    );

    return await sendTx(
      this.sdk.connection,
      transaction,
      buyer.publicKey,
      [buyer],
      priorityFees,
      commitment,
      finality
    );
  }

  async getBuyInstructionsBySolAmount(
    buyer: PublicKey,
    mint: PublicKey,
    buyAmountSol: bigint,
    slippageBasisPoints: bigint = 500n,
    commitment: Commitment = DEFAULT_COMMITMENT
  ): Promise<Transaction> {
    const bondingCurveAccount = await this.sdk.token.getBondingCurveAccount(
      mint,
      commitment
    );
    if (!bondingCurveAccount) {
      throw new Error(`Bonding curve account not found: ${mint.toBase58()}`);
    }

    const feeConfig = await this.sdk.token.getFeeConfig(commitment);
    const globalAccount = await this.sdk.token.getGlobalAccount(commitment);
    const buyAmount = bondingCurveAccount.getBuyPrice(
      globalAccount,
      feeConfig,
      buyAmountSol
    );
    const buyAmountWithSlippage = calculateWithSlippageBuy(
      buyAmountSol,
      slippageBasisPoints
    );

    const transaction = new Transaction();
    await this.buildBuyIx(
      buyer,
      mint,
      buyAmount,
      buyAmountWithSlippage,
      transaction,
      commitment,
      false
    );

    return transaction;
  }

  async buildBuyIx(
    buyer: PublicKey,
    mint: PublicKey,
    amount: bigint,
    maxSolCost: bigint,
    tx: Transaction,
    commitment: Commitment,
    shouldUseBuyerAsBonding: boolean
  ): Promise<void> {
    const bondingCurve = this.sdk.pda.getBondingCurvePDA(mint);
    const associatedBonding = await getAssociatedTokenAddress(
      mint,
      bondingCurve,
      true
    );

    const associatedUser =
      await this.sdk.token.createAssociatedTokenAccountIfNeeded(
        buyer,
        buyer,
        mint,
        tx,
        commitment
      );
    const globalAccount = await this.sdk.token.getGlobalAccount(commitment);
    const globalAccountPDA = this.sdk.pda.getGlobalAccountPda();
    const bondingCreator = shouldUseBuyerAsBonding
      ? this.sdk.pda.getCreatorVaultPda(buyer)
      : await this.sdk.token.getBondingCurveCreator(bondingCurve, commitment);
    const creatorVault = shouldUseBuyerAsBonding
      ? bondingCreator
      : this.sdk.pda.getCreatorVaultPda(bondingCreator);

    const eventAuthority = this.sdk.pda.getEventAuthorityPda();

    const ix = await this.sdk.program.methods
      .buy(new BN(amount.toString()), new BN(maxSolCost.toString()))
      .accounts({
        global: globalAccountPDA,
        feeRecipient: globalAccount.feeRecipient,
        mint,
        bondingCurve,
        associatedBondingCurve: associatedBonding,
        associatedUser,
        user: buyer,
        creatorVault,
        eventAuthority,
        globalVolumeAccumulator: this.sdk.pda.getGlobalVolumeAccumulatorPda(),
        userVolumeAccumulator: this.sdk.pda.getUserVolumeAccumulatorPda(buyer),
      })
      .instruction();

    tx.add(ix);
  }

  //create token instructions
  async getCreateInstructions(
    creator: PublicKey,
    name: string,
    symbol: string,
    uri: string,
    mint: Keypair
  ): Promise<Transaction> {
    const mintAuthority = this.sdk.pda.getMintAuthorityPDA();
    const bondingCurve = this.sdk.pda.getBondingCurvePDA(mint.publicKey);
    const associatedBonding = await getAssociatedTokenAddress(
      mint.publicKey,
      bondingCurve,
      true
    );
    const global = this.sdk.pda.getGlobalAccountPda();
    const metadata = this.sdk.pda.getMetadataPDA(mint.publicKey);
    const eventAuthority = this.sdk.pda.getEventAuthorityPda();

    const ix = await this.sdk.program.methods
      .create(name, symbol, uri, creator)
      .accounts({
        mint: mint.publicKey,
        mintAuthority,
        bondingCurve,
        associatedBondingCurve: associatedBonding,
        global,
        metadata,
        user: creator,
        eventAuthority,
      })
      .instruction();

    return new Transaction().add(ix);
  }

  async buildSellIx(
    seller: PublicKey,
    mint: PublicKey,
    tokenAmount: bigint,
    minSolOutput: bigint,
    tx: Transaction,
    commitment: Commitment
  ): Promise<void> {
    const bondingCurve = this.sdk.pda.getBondingCurvePDA(mint);
    const associatedBonding = await getAssociatedTokenAddress(
      mint,
      bondingCurve,
      true
    );

    const associatedUser =
      await this.sdk.token.createAssociatedTokenAccountIfNeeded(
        seller,
        seller,
        mint,
        tx,
        commitment
      );

    const globalPda = this.sdk.pda.getGlobalAccountPda();
    const globalBuf = await this.sdk.connection.getAccountInfo(
      globalPda,
      commitment
    );
    const feeRecipient = GlobalAccount.fromBuffer(globalBuf!.data).feeRecipient;

    const bondingCreator = await this.sdk.token.getBondingCurveCreator(
      bondingCurve,
      commitment
    );
    const creatorVault = this.sdk.pda.getCreatorVaultPda(bondingCreator);

    const eventAuthority = this.sdk.pda.getEventAuthorityPda();

    const ix = await this.sdk.program.methods
      .sell(new BN(tokenAmount.toString()), new BN(minSolOutput.toString()))
      .accounts({
        global: globalPda,
        feeRecipient,
        mint,
        bondingCurve,
        associatedBondingCurve: associatedBonding,
        associatedUser,
        user: seller,
        creatorVault,
        eventAuthority,
      })
      .instruction();

    tx.add(ix);
  }

  async sell(
    seller: Keypair,
    mint: PublicKey,
    sellTokenAmount: bigint,
    slippageBasisPoints: bigint = 500n,
    priorityFees?: PriorityFee,
    commitment: Commitment = DEFAULT_COMMITMENT,
    finality: Finality = DEFAULT_FINALITY
  ): Promise<TransactionResult> {
    const bondingAccount = await this.sdk.token.getBondingCurveAccount(
      mint,
      commitment
    );
    if (!bondingAccount)
      throw new Error(`Bonding curve account not found: ${mint.toBase58()}`);

    const globalAccount = await this.sdk.token.getGlobalAccount(commitment);

    const feeConfig = await this.sdk.token.getFeeConfig(commitment);

    const minSolOutput = bondingAccount.getSellPrice(
      globalAccount,
      feeConfig,
      sellTokenAmount
    );
    let sellAmountWithSlippage = calculateWithSlippageSell(
      minSolOutput,
      slippageBasisPoints
    );
    if (sellAmountWithSlippage < 1n) sellAmountWithSlippage = 1n;

    const transaction = new Transaction();
    await this.buildSellIx(
      seller.publicKey,
      mint,
      sellTokenAmount,
      sellAmountWithSlippage,
      transaction,
      commitment
    );

    return await sendTx(
      this.sdk.connection,
      transaction,
      seller.publicKey,
      [seller],
      priorityFees,
      commitment,
      finality
    );
  }

  async getSellInstructionsByTokenAmount(
    seller: PublicKey,
    mint: PublicKey,
    sellTokenAmount: bigint,
    slippageBasisPoints: bigint = 500n,
    commitment: Commitment = DEFAULT_COMMITMENT
  ): Promise<Transaction> {
    const bondingAccount = await this.sdk.token.getBondingCurveAccount(
      mint,
      commitment
    );
    if (!bondingAccount)
      throw new Error(`Bonding curve account not found: ${mint.toBase58()}`);

    const globalAccount = await this.sdk.token.getGlobalAccount(commitment);
    const feeConfig = await this.sdk.token.getFeeConfig(commitment);

    const minSolOutput = bondingAccount.getSellPrice(
      globalAccount,
      feeConfig,
      sellTokenAmount
    );
    let sellAmountWithSlippage = calculateWithSlippageSell(
      minSolOutput,
      slippageBasisPoints
    );
    if (sellAmountWithSlippage < 1n) sellAmountWithSlippage = 1n;

    const transaction = new Transaction();
    await this.buildSellIx(
      seller,
      mint,
      sellTokenAmount,
      sellAmountWithSlippage,
      transaction,
      commitment
    );
    return transaction;
  }
}
