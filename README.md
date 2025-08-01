<h3 align="center">Pumpdotfun SDK Repumped</h3>
<p align="center">
  <b>TypeScript SDK for Pump Fun</b><br/>
  Create · Buy · Sell · Relay · Jito Bundles
</p>
<p align="center">
  <a href="https://www.npmjs.com/package/pumpdotfun-repumped-sdk"><img alt="npm" src="https://img.shields.io/npm/v/pumpdotfun-repumped-sdk?color=cb3837&logo=npm"></a>
  <a href="LICENSE"><img alt="MIT" src="https://img.shields.io/badge/license-MIT-blue.svg"></a>
  <img alt="visitors" src="https://visitor-badge.laobi.icu/badge?page_id=d3ad.pumpdotfun-repumped-sdk" />
</p>



> Fixed and reworked version of [rckprtr/pumpdotfun-sdk](https://github.com/rckprtr/pumpdotfun-sdk).  
> ✅ Fixed buy/sell/create  
> ✅ Added support for new events  
> ✅ Added Jito and alternative relay support (Astra, 0Slot, NodeOne, NextBlock)  
> ✅ Works on **devnet** and **mainnet-beta**  
> ✅ ESM & CJS builds via Rollup in **`dist/`**

---

<p align="center">
  ⭐️ If you find this project useful, please <a href="https://github.com/D3AD-E/pumpdotfun-repumped-sdk/stargazers">star&nbsp;the&nbsp;repo</a> — it helps a lot! ⭐️
</p>

---


## ✨ Features

| Module                | Highlights                                                                                          |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| **`PumpFunSDK`**      | Entry point. Wraps Anchor `Program` & `Connection` and initializes all submodules.                  |
| **`TradeModule`**     | `createAndBuy`, `buy`, `sell`, tx builders, slippage helpers                                        |
| **`TokenModule`**     | Token metadata, ATA creation, mint helpers                                                          |
| **`PdaModule`**       | PDA helpers: global, event-authority, bonding-curve, metadata, etc.                                 |
| **`EventModule`**     | Typed Anchor event listeners with automatic deserialization                                         |
| **`JitoModule`**      | Submit Jito bundles for `buy`/`sell`. Requires `jitoUrl` and `authKeypair` in SDK options           |
| **`AstraModule`**     | Sends `buy`/`sell` transactions via Astra relays. Adds tip transfers + optional `ping()` keep-alive |
| **`SlotModule`**      | Similar to Astra; optimized for 0Slot relays with `buy()` and `ping()`                              |
| **`NextBlockModule`** | Similar to Astra; optimized for NextBlock relays with `buy()` and `ping()`                          |
| **`NodeOneModule`**   | Similar to Astra; optimized for NodeOne relays with `buy()` and `ping()`                            |
| **IDL exports**       | Full `IDL` JSON and `type PumpFun` helper                                                           |

> **Note:** `ping()` on relay modules (e.g., `sdk.slot.ping()`) should be called periodically to keep upstream relay connection alive.

---

## 📦 Install

```bash
npm install pumpdotfun-repumped-sdk
```

---

## 🔨 Quick Start

Replace DEVNET_RPC url with mainnet url

```ts
const DEVNET_RPC = "https://api.devnet.solana.com";
const SLIPPAGE_BPS = 100n;
const PRIORITY_FEE = { unitLimit: 250_000, unitPrice: 250_000 };

const secret = JSON.parse(process.env.WALLET!);
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
  const mint = Keypair.generate();

  await printSOL(connection, wallet.publicKey, "user");

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

  await sdk.trade.buy(
    wallet,
    mint.publicKey,
    0.0002 * LAMPORTS_PER_SOL,
    SLIPPAGE_BPS,
    PRIORITY_FEE
  );

  const bal = await getSPLBalance(connection, mint.publicKey, wallet.publicKey);
  console.log("Token balance:", bal / 10 ** DEFAULT_DECIMALS);

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

---

## 🚀 Advanced Examples

### 🧠 Buy with **Jito**

```ts
const sdk = new PumpFunSDK(provider, {
  jitoUrl: "ny.mainnet.block-engine.jito.wtf",
  authKeypair: wallet,
});

await sdk.jito!.buyJito(
  wallet,
  mint.publicKey,
  BigInt(0.0002 * LAMPORTS_PER_SOL),
  SLIPPAGE_BPS,
  500_000,
  PRIORITY,
  "confirmed"
);
```

---

### 🛰️ Buy with **0Slot**, **NodeOne**, **Astra**, or **NextBlock**

> These modules use upstream relayers to speed up TX submission.  
> They support periodic `ping()` to keep-alive HTTPS connection and reduce TLS overhead.

```ts
const sdk = new PumpFunSDK(provider, {
  providerRegion: Region.Frankfurt,
  slotKey: "your-api-key", // or astraKey / nextBlockKey / nodeOneKey
});

await sdk.slot!.ping();

await sdk.slot!.buy(
  wallet,
  mint.publicKey,
  BigInt(0.0002 * LAMPORTS_PER_SOL),
  SLIPPAGE_BPS,
  500_000,
  PRIORITY,
  "confirmed"
);
```

> `AstraModule`, `NodeOneModule`, `NextBlockModule` follow the same interface: `buy()`, `sell()`, `ping()`  
> Transactions are signed locally, and relayed via HTTPS POST (base64-encoded) for speed. Tx are sent over http for extra speed.

---

## 🧩 Tip: What `ping()` Does

Relay modules like `SlotModule`, `AstraModule`, `NodeOneModule`, and `NextBlockModule` implement `ping()`.

Calling `ping()` periodically:

- Prevents connection idle timeouts
- Keeps the relay ready for low-latency submission

```ts
await sdk.astra!.ping();
await sdk.slot!.ping();
```

---

## 🌐 Supported Relay Regions

Each relay provider supports a defined set of regions for optimal latency. Below are the currently supported regions per provider:

```text
Slot       📍 Frankfurt • New York • Tokyo • Amsterdam • Los Angeles
Astra      📍 Frankfurt • New York • Tokyo • Amsterdam
NodeOne    📍 New York • Tokyo • Amsterdam • Frankfurt
NextBlock  📍 Tokyo • Frankfurt • New York
```

> You must specify `providerRegion` in `PumpFunSDK` options to select which regional relay to use.

## ⚠️ Disclaimer

This software is provided **“as is,”** without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, and non-infringement.  
In no event shall the authors or copyright holders be liable for any claim, damages, or other liability—whether in an action of contract, tort, or otherwise—arising from, out of, or in connection with the software or the use or other dealings in the software.

> Use at your own risk.  
> The authors take no responsibility for any harm or damage caused by the use of this software.  
> Users are responsible for ensuring the suitability and safety of this software for their specific use cases.

By using this software, **you acknowledge that you have read, understood, and agree to this disclaimer.**
