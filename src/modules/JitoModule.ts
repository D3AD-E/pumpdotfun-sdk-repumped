import {
  searcherClient,
  SearcherClient,
} from "jito-ts/dist/sdk/block-engine/searcher.js";
import { PumpFunSDK } from "../PumpFunSDK.js";
import {
  Commitment,
  Finality,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { DEFAULT_COMMITMENT, DEFAULT_FINALITY } from "../pumpFun.consts.js";
import {
  JitoResult,
  PriorityFee,
  TransactionResult,
} from "../pumpFun.types.js";
import {
  calculateWithSlippageBuy,
  calculateWithSlippageSell,
} from "../slippage.js";
import { buildSignedTx, sendTx } from "../tx.js";
import { getRandomJitoTipAccount } from "./utils.js";
import { Bundle } from "jito-ts/dist/sdk/block-engine/types.js";

export class JitoModule {
  private client: SearcherClient;
  constructor(
    private sdk: PumpFunSDK,
    endpoint?: string,
    authKeypair?: Keypair
  ) {
    if (!endpoint) {
      throw new Error("Jito endpoint is required");
    }
    this.client = searcherClient(endpoint, authKeypair);
  }

  async buyJito(
    buyer: Keypair,
    mint: PublicKey,
    buyAmountSol: bigint,
    slippageBasisPoints: bigint = 500n,
    jitoTip: number = 500000,
    priorityFees?: PriorityFee,
    commitment: Commitment = DEFAULT_COMMITMENT
  ): Promise<TransactionResult> {
    const bondingAccount = await this.sdk.token.getBondingCurveAccount(
      mint,
      commitment
    );
    if (!bondingAccount) {
      throw new Error(`Bonding curve account not found: ${mint.toBase58()}`);
    }

    const buyAmount = bondingAccount.getBuyPrice(buyAmountSol);
    const buyAmountWithSlippage = calculateWithSlippageBuy(
      buyAmountSol,
      slippageBasisPoints
    );

    const transaction = new Transaction();
    await this.sdk.trade.buildBuyIx(
      buyer.publicKey,
      mint,
      buyAmount,
      buyAmountWithSlippage,
      transaction,
      commitment,
      false
    );
    this.addJitoTip(buyer, transaction, jitoTip);
    const signedTx = await buildSignedTx(
      priorityFees,
      transaction,
      this.sdk.connection,
      buyer.publicKey,
      commitment,
      [buyer]
    );
    return await this.sendJitoTx(signedTx);
  }

  async sellJito(
    seller: Keypair,
    mint: PublicKey,
    sellTokenAmount: bigint,
    slippageBasisPoints: bigint = 500n,
    jitoTip: number = 500000,
    priorityFees?: PriorityFee,
    commitment: Commitment = DEFAULT_COMMITMENT
  ): Promise<TransactionResult> {
    const bondingAccount = await this.sdk.token.getBondingCurveAccount(
      mint,
      commitment
    );
    if (!bondingAccount)
      throw new Error(`Bonding curve account not found: ${mint.toBase58()}`);

    const globalAccount = await this.sdk.token.getGlobalAccount(commitment);

    const minSolOutput = bondingAccount.getSellPrice(
      sellTokenAmount,
      globalAccount.feeBasisPoints
    );
    let sellAmountWithSlippage = calculateWithSlippageSell(
      minSolOutput,
      slippageBasisPoints
    );
    if (sellAmountWithSlippage < 1n) sellAmountWithSlippage = 1n;

    const transaction = new Transaction();
    await this.sdk.trade.buildSellIx(
      seller.publicKey,
      mint,
      sellTokenAmount,
      sellAmountWithSlippage,
      transaction,
      commitment
    );

    this.addJitoTip(seller, transaction, jitoTip);
    const signedTx = await buildSignedTx(
      priorityFees,
      transaction,
      this.sdk.connection,
      seller.publicKey,
      commitment,
      [seller]
    );
    return await this.sendJitoTx(signedTx);
  }

  private addJitoTip(
    buyer: Keypair,
    transaction: Transaction,
    jitoTip: number = 500000
  ): Transaction {
    if (jitoTip <= 0) {
      return transaction;
    }
    const jitoTipAccount = getRandomJitoTipAccount();
    const jitoTipInstruction = SystemProgram.transfer({
      fromPubkey: buyer.publicKey,
      toPubkey: jitoTipAccount,
      lamports: jitoTip,
    });
    transaction.add(jitoTipInstruction);
    return transaction;
  }

  private async sendJitoTx(tx: VersionedTransaction): Promise<JitoResult> {
    const b = new Bundle([tx], 1);

    const res = await this.client.sendBundle(b);
    if (res.ok) {
      return {
        success: true,
        bundleId: res.value,
      };
    }
    return {
      success: false,
      error: res.error,
    };
  }
}
