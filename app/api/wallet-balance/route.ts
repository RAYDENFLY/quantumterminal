import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

const DONATION_WALLET = '0xD4233500BAE4973782c5eaA427A667ABd6FE9e5f';

function getRpcUrl(): string | null {
  // Prefer a dedicated BSC RPC env var, but allow reuse of common names.
  return (
    process.env.BSC_RPC_URL ||
    process.env.BNB_RPC_URL ||
    process.env.BSC_PUBLIC_RPC_URL ||
    null
  );
}

export async function GET() {
  const rpcUrl = getRpcUrl();

  if (!rpcUrl) {
    return NextResponse.json(
      {
        success: false,
        error:
          'RPC not configured. Set BSC_RPC_URL (recommended) in environment variables.',
      },
      { status: 200 }
    );
  }

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
        rpc: 'custom',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 200 }
    );
  }
}
