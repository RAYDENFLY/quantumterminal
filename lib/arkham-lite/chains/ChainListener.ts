import { ethers } from 'ethers';
import { TransferEvent } from '../types';

export interface ChainConfig {
  name: string;
  rpcUrl: string;
  chainId: number;
  blockExplorerApiUrl?: string;
  blockExplorerApiKey?: string;
}

export class ChainListener {
  private provider: ethers.JsonRpcProvider;
  private config: ChainConfig;

  constructor(config: ChainConfig) {
    this.config = config;
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
  }

  async getLatestBlock(): Promise<number> {
    return await this.provider.getBlockNumber();
  }

  async getTransferLogs(fromBlock: number, toBlock: number, tokenAddresses?: string[]): Promise<ethers.Log[]> {
    const transferTopic = ethers.id('Transfer(address,address,uint256)');

    const filter: ethers.Filter = {
      topics: [transferTopic],
      fromBlock,
      toBlock,
    };

    if (tokenAddresses && tokenAddresses.length > 0) {
      filter.address = tokenAddresses;
    }

    return await this.provider.getLogs(filter);
  }

  async getBlockTimestamp(blockNumber: number): Promise<number> {
    const block = await this.provider.getBlock(blockNumber);
    return block?.timestamp || 0;
  }

  getConfig(): ChainConfig {
    return this.config;
  }
}

// Pre-configured chains
export const CHAINS: Record<string, ChainConfig> = {
  ethereum: {
    name: 'ethereum',
    rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY',
    chainId: 1,
    blockExplorerApiUrl: 'https://api.etherscan.io/api',
    blockExplorerApiKey: process.env.ETHERSCAN_API_KEY,
  },
  arbitrum: {
    name: 'arbitrum',
    rpcUrl: process.env.ARBITRUM_RPC_URL || 'https://arb-mainnet.g.alchemy.com/v2/YOUR_API_KEY',
    chainId: 42161,
    blockExplorerApiUrl: 'https://api.arbiscan.io/api',
    blockExplorerApiKey: process.env.ARBISCAN_API_KEY,
  },
  base: {
    name: 'base',
    rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    chainId: 8453,
    blockExplorerApiUrl: 'https://api.basescan.org/api',
    blockExplorerApiKey: process.env.BASESCAN_API_KEY,
  },
};