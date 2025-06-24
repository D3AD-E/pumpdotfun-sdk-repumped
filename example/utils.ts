import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes/index.js";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
function parseSecretKey(v: string | undefined): number[] {
  if (!v) throw new Error("WALLET_PRIVATE_KEY missing");
  let parsed: unknown;
  try {
    parsed = JSON.parse(v);
  } catch {
    throw new Error('WALLET_PRIVATE_KEY must be valid JSON (e.g. "[1,2,3]")');
  }
  if (
    !Array.isArray(parsed) ||
    !parsed.every((n) => Number.isInteger(n) && n >= 0 && n <= 255)
  ) {
    throw new Error("WALLET_PRIVATE_KEY must be an array of 0-255 integers");
  }
  return parsed as number[];
}
export const wallet = Keypair.fromSecretKey(
  Buffer.from(parseSecretKey(process.env.WALLET_PRIVATE_KEY))
);

export async function getSPL(
  conn: Connection,
  mint: PublicKey,
  owner: PublicKey
) {
  const ata = PublicKey.findProgramAddressSync(
    [
      owner.toBuffer(),
      new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA").toBuffer(),
      mint.toBuffer(),
    ],
    new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")
  )[0];

  const info = await conn.getTokenAccountBalance(ata).catch(() => null);
  return info ? Number(info.value.amount) : 0;
}
