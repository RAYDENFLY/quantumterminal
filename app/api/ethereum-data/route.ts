import { NextResponse } from 'next/server';

const providers = [
  'https://rpc.ankr.com/eth',
  'https://eth-mainnet.public.blastapi.io',
  'https://ethereum.publicnode.com'
];

async function queryEthereum(method: string, params: any[] = []) {
  for (const provider of providers) {
    try {
      const response = await fetch(provider, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method,
          params,
          id: 1
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      return data.result;
    } catch (error) {
      console.log(`Provider ${provider} failed, trying next...`);
    }
  }
  throw new Error('All Ethereum providers failed');
}

export async function GET() {
  try {
    const [gasPrice, blockNumber] = await Promise.all([
      queryEthereum('eth_gasPrice'),
      queryEthereum('eth_blockNumber')
    ]);

    const data = {
      gasPrice: (parseInt(gasPrice, 16) / 1e9).toFixed(2), // Convert to Gwei
      blockNumber: parseInt(blockNumber, 16).toString()
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching Ethereum data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Ethereum data' },
      { status: 500 }
    );
  }
}