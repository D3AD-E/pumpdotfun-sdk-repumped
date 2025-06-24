import "dotenv/config";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import { AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { DEFAULT_DECIMALS } from "../src/pumpFun.consts.js";
import { wallet } from "./utils.js";
import fs from "fs";
import { PumpFunSDK } from "../dist/esm/index.mjs";

async function printSOL(conn: Connection, pk: PublicKey, label = "") {
  const bal = (await conn.getBalance(pk)) / LAMPORTS_PER_SOL;
  console.log(`${label} SOL balance:`, bal.toFixed(4));
}

async function getSPL(conn: Connection, mint: PublicKey, owner: PublicKey) {
  const ata = PublicKey.findProgramAddressSync(
    [
      owner.toBuffer(),
      Buffer.from("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
      mint.toBuffer(),
    ],
    new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")
  )[0];
  const info = await conn.getTokenAccountBalance(ata).catch(() => null);
  return info ? Number(info.value.amount) : 0;
}
const DEVNET_RPC = "https://api.devnet.solana.com";
const SLIPPAGE_BPS = 100n;
const PRIORITY = { unitLimit: 250_000, unitPrice: 250_000 }; // devnet tip

async function main() {
  const connection = new Connection(DEVNET_RPC, { commitment: "confirmed" });
  const dummyWallet = new Wallet(wallet);
  const provider = new AnchorProvider(connection, dummyWallet, {
    commitment: "confirmed",
  });
  const sdk = new PumpFunSDK(provider);
  const mint = Keypair.generate();

  await printSOL(connection, wallet.publicKey, "User");

  console.log("Creating token & first buy…");
  const buffer = await fs.promises.readFile("example/images/test.png");
  const blob = new Blob([buffer], { type: "image/png" });
  const meta = {
    name: "TST-7",
    symbol: "TST-7",
    description: "Test token on devnet",
    file: blob,
  };
  const res = await sdk.trade.createAndBuy(
    wallet,
    mint,
    meta,
    BigInt(0.0001 * LAMPORTS_PER_SOL),
    SLIPPAGE_BPS,
    PRIORITY
  );

  if (!res.success) throw new Error("createAndBuy failed");
  const curve = await sdk.token.getBondingCurveAccount(mint.publicKey);
  console.log(
    "Created! Pump link:",
    `https://pump.fun/${mint.publicKey.toBase58()}?cluster=devnet`
  );

  /* 4.  second buy */
  console.log("Buying again…");
  await sdk.trade.buy(
    wallet,
    mint.publicKey,
    BigInt(0.0001 * LAMPORTS_PER_SOL),
    SLIPPAGE_BPS,
    PRIORITY
  );
  const splAfterBuy = await getSPL(
    connection,
    mint.publicKey,
    wallet.publicKey
  );
  console.log("User now holds", splAfterBuy / 10 ** DEFAULT_DECIMALS, "tokens");

  /* 5.  sell everything back */
  console.log("Selling all…");
  await sdk.trade.sell(
    wallet,
    mint.publicKey,
    BigInt(splAfterBuy),
    SLIPPAGE_BPS,
    PRIORITY
  );
  await printSOL(connection, wallet.publicKey, "User after sell");

  console.log(
    "Bonding curve state:",
    await sdk.token.getBondingCurveAccount(mint.publicKey)
  );
}

main().catch((e) => console.error(e));
