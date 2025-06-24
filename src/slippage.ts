export const calculateWithSlippageBuy = (
  amount: bigint,
  basisPoints: bigint
) => {
  return amount + (amount * basisPoints) / 10000n;
};

export function calculateWithSlippageSell(
  amount: bigint,
  slippageBasisPoints: bigint = 500n
): bigint {
  // Actually use the slippage basis points for calculation
  const reduction = Math.max(
    1,
    Number((amount * slippageBasisPoints) / 10000n)
  );
  return amount - BigInt(reduction);
}
