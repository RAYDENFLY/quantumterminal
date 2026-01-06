import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

const DONATION_WALLET =
  process.env.DONATION_WALLET ||
  '0xD4233500BAE4973782c5eaA427A667ABd6FE9e5f';

function getRpcUrl(): string | null {
  // Prefer a dedicated BSC RPC env var, but allow reuse of common names.
  return (
    process.env.BSC_RPC_URL ||
    process.env.BNB_RPC_URL ||
  process.env.BSC_PUBLIC_RPC_URL ||
  process.env.RPC_URL ||
    null
  );
}

function getFallbackRpcUrls(): string[] {
  // Keep this list small and widely available.
  // Note: these can still be region-blocked; env var is always preferred.
  return [
    'https://rpc.ankr.com/bsc',
    'https://bsc-dataseed.binance.org',
  ];
}

export async function GET() {
  const configuredRpc = getRpcUrl();
  const rpcCandidates = configuredRpc
    ? [configuredRpc]
    : getFallbackRpcUrls();

  let lastErr: unknown = null;
  for (const rpcUrl of rpcCandidates) {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const balanceWei = await provider.getBalance(DONATION_WALLET);
      const balanceBnb = ethers.formatEther(balanceWei);

      return NextResponse.json({
        success: true,
        data: {
          address: DONATION_WALLET,
          symbol: 'BNB',
          network: 'BSC',
          balanceWei: balanceWei.toString(),
          balance: balanceBnb,
          rpc: configuredRpc ? 'custom' : 'fallback',
        },
      });
    } catch (err) {
      lastErr = err;
      continue;
    }
  }

  const message = lastErr instanceof Error ? lastErr.message : 'Unknown error';
  return NextResponse.json(
    {
      success: false,
      error: message,
      hint:
        'RPC unreachable (often region-blocked or TLS/SSL inspection). On Vercel, set BSC_RPC_URL to a reliable provider like https://rpc.ankr.com/bsc.',
    },
    { status: 200 }
  );
}
