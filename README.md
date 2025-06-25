# pumpdotfun-repumped-sdk

> High-level TypeScript SDK for [Pump Fun](https://pump.fun) Fixed and reworked https://github.com/rckprtr/pumpdotfun-sdk. Fixed buy, sell and create functions. Also added support for new events.
> Works on **devnet** (demo below) and **mainnet-beta**.  
> Bundled via Rollup – ESM & CJS builds in **`dist/`**.

---

## ✨ Features

| Module            | Highlights                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **`PumpFunSDK`**  | one-liner entry point, injects Anchor `Program` & `Connection`                                                            |
| **`TradeModule`** | `createAndBuy`, `buy`, `sell`, tx builders, slippage helpers                                                              |
| **`TokenModule`** | metadata upload (IPFS helper), ATA creation, mint helpers                                                                 |
| **`PdaModule`**   | utility PDAs: global, event-authority, bonding-curve, metadata, etc.                                                      |
| **`EventModule`** | typed event listeners with automatic deserialization                                                                      |
| **`JitoModule`**  | typed jito bundle submission for buys and sells, to use add jitourl and authkeypair to options when creation sdk instance |
| **IDL exports**   | `IDL` JSON and `type PumpFun` helper                                                                                      |

---

## 📦 Install

TODO npm

```bash
npm install pumpdotfun-repumped-sdk
```

---

## 🔨 Quick Start (Devnet)

```ts
import "dotenv/config";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import { AnchorProvider, Wallet } from "@coral-xyz/anchor";

import {
  PumpFunSDK,
  DEFAULT_DECIMALS,
} from "pumpdotfun-repumped-sdk/dist/esm/index.mjs"; // ESM build
import { getSPLBalance } from "pumpdotfun-repumped-sdk/dist/esm/utils.mjs";

const DEVNET_RPC = "https://api.devnet.solana.com";
const SLIPPAGE_BPS = 100n; // 1 %
const PRIORITY_FEE = { unitLimit: 250_000, unitPrice: 250_000 };

const secret = JSON.parse(process.env.WALLET!); // `[...,64]`
const wallet = Keypair.fromSecretKey(Uint8Array.from(secret));

async function printSOL(conn: Connection, pk: PublicKey, label = "") {
  const sol = (await conn.getBalance(pk)) / LAMPORTS_PER_SOL;
  console.log(`${label} SOL:`, sol.toFixed(4));
}

async function main() {
  const connection = new Connection(DEVNET_RPC, "confirmed");
  const provider = new AnchorProvider(connection, new Wallet(wallet), {
    commitment: "confirmed",
  });
  const sdk = new PumpFunSDK(provider);
  const mint = Keypair.generate(); // fresh token mint

  await printSOL(connection, wallet.publicKey, "user");

  /* 1️⃣  create + first buy */
  const img = await import("node:fs/promises").then((fs) =>
    fs.readFile("example/images/test.png")
  );
  const blob = new Blob([img], { type: "image/png" });
  await sdk.trade.createAndBuy(
    wallet,
    mint,
    { name: "DEV-TEST", symbol: "DVT", description: "Devnet demo", file: blob },
    0.0001 * LAMPORTS_PER_SOL,
    SLIPPAGE_BPS,
    PRIORITY_FEE
  );
  console.log(
    "pump.fun link →",
    `https://pump.fun/${mint.publicKey}?cluster=devnet`
  );

  /* 2️⃣  second buy */
  await sdk.trade.buy(
    wallet,
    mint.publicKey,
    0.0002 * LAMPORTS_PER_SOL,
    SLIPPAGE_BPS,
    PRIORITY_FEE
  );
  const bal = await getSPLBalance(connection, mint.publicKey, wallet.publicKey);
  console.log("Token balance:", bal / 10 ** DEFAULT_DECIMALS);

  /* 3️⃣  sell all */
  await sdk.trade.sell(
    wallet,
    mint.publicKey,
    BigInt(bal),
    SLIPPAGE_BPS,
    PRIORITY_FEE
  );
  await printSOL(connection, wallet.publicKey, "user after sell");
}

main().catch(console.error);
```

> Switch `DEVNET_RPC` to a mainnet endpoint and pass the **mainnet program ID** to `PumpFunSDK` if you want to run live.
