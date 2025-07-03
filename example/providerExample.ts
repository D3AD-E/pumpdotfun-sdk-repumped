import "dotenv/config";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import { AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { DEFAULT_DECIMALS } from "../src/pumpFun.consts.js";
import { getSPL, wallet } from "./utils.js";
import fs from "fs";
import { PumpFunSDK } from "../src/PumpFunSDK.js";
import { Region } from "../src/pumpFun.types.js";

async function printSOL(conn: Connection, pk: PublicKey, label = "") {
  const bal = (await conn.getBalance(pk)) / LAMPORTS_PER_SOL;
  console.log(`${label} SOL balance:`, bal.toFixed(4));
}

const DEVNET_RPC = "https://api.devnet.solana.com";
const SLOT_KEY = "key";
const SLIPPAGE_BPS = 100n;
const PRIORITY = { unitLimit: 250_000, unitPrice: 250_000 }; // devnet tip

async function main() {
  const connection = new Connection(DEVNET_RPC, { commitment: "confirmed" });
  const dummyWallet = new Wallet(wallet);
  const provider = new AnchorProvider(connection, dummyWallet, {
    commitment: "confirmed",
  });
  const sdk = new PumpFunSDK(provider, {
    providerRegion: Region.Frankfurt,
    slotKey: SLOT_KEY,
  });
  const mint = Keypair.generate();

  await printSOL(connection, wallet.publicKey, "User");
  console.log("Ping slot provider…");
  const pingRes = await sdk.slot!.ping();
  console.log("Ping response:", pingRes);
  console.log("Buying with 0slot");
  await sdk.slot!.buy(
    wallet,
    mint.publicKey,
    BigInt(0.0002 * LAMPORTS_PER_SOL),
    SLIPPAGE_BPS,
    500_000, // 500_000 tip
    PRIORITY,
    "confirmed"
  );
  const splAfterBuy = await getSPL(
    connection,
    mint.publicKey,
    wallet.publicKey
  );
  console.log("User now holds", splAfterBuy / 10 ** DEFAULT_DECIMALS, "tokens");
}

main().catch((e) => console.error(e));
