import { PumpFunSDK } from "../PumpFunSDK.js";
import {
  Commitment,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { DEFAULT_COMMITMENT, getHealthBody } from "../pumpFun.consts.js";
import { PriorityFee, Region } from "../pumpFun.types.js";
import {
  calculateWithSlippageBuy,
  calculateWithSlippageSell,
} from "../slippage.js";
import { buildSignedTx } from "../tx.js";
import AgentRegistry from "../AgentRegistry.js";

export class NodeOneModule {
  private key: string;
  constructor(private sdk: PumpFunSDK, region: Region, key: string) {
    AgentRegistry.registerInConfig("node", region);
    this.key = key;
  }

  NODE_ONE_ACCOUNTS = [
    new PublicKey("node1PqAa3BWWzUnTHVbw8NJHC874zn9ngAkXjgWEej"),
    new PublicKey("node1UzzTxAAeBTpfZkQPJXBAqixsbdth11ba1NXLBG"),
    new PublicKey("node1Qm1bV4fwYnCurP8otJ9s5yrkPq7SPZ5uhj3Tsv"),
    new PublicKey("node1PUber6SFmSQgvf2ECmXsHP5o3boRSGhvJyPMX1"),
    new PublicKey("node1AyMbeqiVN6eoQzEAwCA6Pk826hrdqdAHR7cdJ3"),
    new PublicKey("node1YtWCoTwwVYTFLfS19zquRQzYX332hs1HEuRBjC"),
    new PublicKey("node1FdMPnJBN7QTuhzNw3VS823nxFuDTizrrbcEqzp"),
  ];

  private getRandomAccount() {
    const randomIndex = Math.floor(
      Math.random() * this.NODE_ONE_ACCOUNTS.length
    );
    return this.NODE_ONE_ACCOUNTS[randomIndex];
  }

  async buy(
    buyer: Keypair,
    mint: PublicKey,
    buyAmountSol: bigint,
    slippageBasisPoints: bigint = 500n,
    tip: number = 500000,
    priorityFees?: PriorityFee,
    commitment: Commitment = DEFAULT_COMMITMENT
  ): Promise<string> {
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
    await this.sdk.trade.buildBuyIx(
      buyer.publicKey,
      mint,
      buyAmount,
      buyAmountWithSlippage,
      transaction,
      commitment,
      false
    );
    this.addTip(buyer, transaction, tip);
    const signedTx = await buildSignedTx(
      priorityFees,
      transaction,
      this.sdk.connection,
      buyer.publicKey,
      commitment,
      [buyer]
    );
    return await this.sendTransaction(signedTx);
  }

  async sell(
    seller: Keypair,
    mint: PublicKey,
    sellTokenAmount: bigint,
    slippageBasisPoints: bigint = 500n,
    tip: number = 500000,
    priorityFees?: PriorityFee,
    commitment: Commitment = DEFAULT_COMMITMENT
  ): Promise<string> {
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
    await this.sdk.trade.buildSellIx(
      seller.publicKey,
      mint,
      sellTokenAmount,
      sellAmountWithSlippage,
      transaction,
      commitment
    );

    this.addTip(seller, transaction, tip);
    const signedTx = await buildSignedTx(
      priorityFees,
      transaction,
      this.sdk.connection,
      seller.publicKey,
      commitment,
      [seller]
    );

    return await this.sendTransaction(signedTx);
  }

  private addTip(
    buyer: Keypair,
    transaction: Transaction,
    tip: number = 500000
  ): Transaction {
    if (tip <= 0) {
      return transaction;
    }
    const tipAccount = this.getRandomAccount();
    const tipInstructions = SystemProgram.transfer({
      fromPubkey: buyer.publicKey,
      toPubkey: tipAccount,
      lamports: tip,
    });
    transaction.add(tipInstructions);
    return transaction;
  }

  async ping() {
    return await AgentRegistry.callUpstream("node", "/ping", {
      method: "GET",
    });
  }

  async sendTransaction(vertionedTx: VersionedTransaction) {
    const serealized = vertionedTx.serialize();
    const tx = Buffer.from(serealized).toString("base64");
    const UUID = crypto.randomUUID();
    const txbody = JSON.stringify({
      jsonrpc: "2.0",
      id: UUID,
      method: "sendTransaction",
      params: [tx, { encoding: "base64", skipPreflight: true, maxRetries: 0 }],
    });
    return await AgentRegistry.callUpstream("node", `/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(txbody),
        "api-key": this.key,
      },
      body: txbody,
    });
  }
}
