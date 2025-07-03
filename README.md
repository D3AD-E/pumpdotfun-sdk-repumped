# pumpdotfun-repumped-sdk

> High-level TypeScript SDK for [Pump Fun](https://pump.fun).  
> Fixed and reworked version of [rckprtr/pumpdotfun-sdk](https://github.com/rckprtr/pumpdotfun-sdk).  
> ✅ Fixed buy/sell/create  
> ✅ Added support for new events  
> ✅ Added Jito and alternative relay support (Astra, Slot, NodeOne, NextBlock)  
> ✅ Works on **devnet** and **mainnet-beta**  
> ✅ ESM & CJS builds via Rollup in **`dist/`**

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
| **`SlotModule`**      | Similar to Astra; optimized for Slot relays with `buy()` and `ping()`                               |
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

### 🛰️ Buy with **Slot**, **NodeOne**, **Astra**, or **NextBlock**

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

### 🛰️ Slot (`0slot.trade`)

- Frankfurt
- New York
- Tokyo
- Amsterdam
- Los Angeles

### 💠 Astra (`astralane.io`)

- Frankfurt
- New York
- Tokyo
- Amsterdam

### 🧱 NodeOne (`node1.me`)

- New York
- Tokyo
- Amsterdam
- Frankfurt

### ⬛ NextBlock (`nextblock.io`)

- Tokyo
- Frankfurt
- New York

> You must specify `providerRegion` in `PumpFunSDK` options to select which regional relay to use.
