import { ethers } from 'ethers';

export interface TransferEvent {
  chain: string;
  tx_hash: string;
  timestamp: string;
  block_number: number;
  from: string;
  from_label?: string;
  to: string;
  to_label?: string;
  token_symbol: string;
  token_address: string;
  amount: number;
  usd_value: number;
}

export interface TokenMetadata {
  address: string;
  symbol: string;
  decimals: number;
  name?: string;
}

export interface ContractLabel {
  address: string;
  label: string;
  type: 'dex' | 'vault' | 'bridge' | 'wallet' | 'other';
}

export interface PriceData {
  tokenAddress: string;
  symbol: string;
  price: number;
  source: 'coingecko' | 'dex' | 'oracle';
  timestamp: number;
}

export interface LogData {
  address: string;
  topics: string[];
  data: string;
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
}