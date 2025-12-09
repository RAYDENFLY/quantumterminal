import { ChainListener } from '../chains/ChainListener';
import { TransferDecoder } from '../decoders/TransferDecoder';
import { AddressLabeler } from '../labeler/AddressLabeler';
import { PriceResolver } from '../utils/PriceResolver';
import { DatabaseManager, DatabaseConfig } from '../database/DatabaseManager';
import { TransferEvent, LogData } from '../types';

export interface IndexerConfig {
  chains: {
    name: string;
    rpcUrl: string;
    startBlock?: number;
  }[];
  database: DatabaseConfig;
  batchSize?: number;
  pollInterval?: number;
}

export class ArkhamLiteIndexer {
  private chainListeners: Map<string, ChainListener>;
  private decoder: TransferDecoder;
  private labeler: AddressLabeler;
  private priceResolver: PriceResolver;
  private dbManager: DatabaseManager;
  private config: IndexerConfig;
  private isRunning: boolean = false;

  constructor(config: IndexerConfig) {
    this.config = config;
    this.chainListeners = new Map();
    this.decoder = new TransferDecoder();
    this.labeler = new AddressLabeler();
    this.priceResolver = new PriceResolver();
    this.dbManager = new DatabaseManager(config.database);

    // Initialize chain listeners
    for (const chain of config.chains) {
      this.chainListeners.set(chain.name, new ChainListener(chain.rpcUrl));
    }
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Indexer is already running');
    }

    console.log('Starting Arkham Lite Indexer...');

    try {
      await this.dbManager.connect();
      this.isRunning = true;

      // Start indexing for all chains
      const indexingPromises = Array.from(this.chainListeners.entries()).map(
        ([chainName, listener]) => this.startChainIndexing(chainName, listener)
      );

      await Promise.allSettled(indexingPromises);
    } catch (error) {
      console.error('Failed to start indexer:', error);
      await this.stop();
      throw error;
    }
  }

  async stop(): Promise<void> {
    console.log('Stopping Arkham Lite Indexer...');
    this.isRunning = false;

    // Stop all chain listeners
    for (const listener of this.chainListeners.values()) {
      await listener.stop();
    }

    await this.dbManager.disconnect();
  }

  private async startChainIndexing(chainName: string, listener: ChainListener): Promise<void> {
    const chainConfig = this.config.chains.find(c => c.name === chainName);
    if (!chainConfig) return;

    // Get the last processed block from database
    let currentBlock = await this.dbManager.getLatestBlock(chainName);
    if (currentBlock === null) {
      currentBlock = chainConfig.startBlock || (await listener.getLatestBlock() - 1000); // Start 1000 blocks back
    }

    console.log(`Starting indexing for ${chainName} from block ${currentBlock}`);

    while (this.isRunning) {
      try {
        const latestBlock = await listener.getLatestBlock();
        const endBlock = Math.min(currentBlock + (this.config.batchSize || 100), latestBlock);

        if (currentBlock >= endBlock) {
          // Wait before next poll
          await new Promise(resolve => setTimeout(resolve, this.config.pollInterval || 12000)); // 12 seconds
          continue;
        }

        console.log(`Processing ${chainName} blocks ${currentBlock} to ${endBlock}`);

        // Fetch Transfer logs
        const logs = await listener.getTransferLogs(currentBlock, endBlock);

        if (logs.length > 0) {
          // Process the logs
          const transferEvents = await this.processLogs(logs, chainName);

          // Save to database
          if (transferEvents.length > 0) {
            await this.dbManager.saveTransferEvents(transferEvents);
            console.log(`Saved ${transferEvents.length} transfer events for ${chainName}`);
          }
        }

        // Update latest processed block
        await this.dbManager.updateLatestBlock(chainName, endBlock);
        currentBlock = endBlock + 1;

      } catch (error) {
        console.error(`Error processing ${chainName}:`, error);
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds
      }
    }
  }

  private async processLogs(logs: LogData[], chain: string): Promise<TransferEvent[]> {
    const transferEvents: TransferEvent[] = [];

    // Decode logs in batches
    const decodedLogs = await this.decoder.decodeBatch(logs);

    // Get unique addresses for labeling and pricing
    const addresses = new Set<string>();
    const tokenAddresses = new Set<string>();

    for (const decoded of decodedLogs) {
      addresses.add(decoded.from);
      addresses.add(decoded.to);
      tokenAddresses.add(decoded.tokenAddress);
    }

    // Batch label addresses
    const addressLabels = await this.labeler.labelAddresses(Array.from(addresses), chain);

    // Batch get token prices
    const tokenPrices = await this.priceResolver.getBatchPrices(Array.from(tokenAddresses), chain);

    // Build transfer events
    for (const decoded of decodedLogs) {
      const usdValue = decoded.amount * (tokenPrices[decoded.tokenAddress] || 0);

      const transferEvent: TransferEvent = {
        chain,
        tx_hash: decoded.txHash,
        timestamp: new Date(decoded.timestamp * 1000).toISOString(),
        block_number: decoded.blockNumber,
        from: decoded.from,
        from_label: addressLabels[decoded.from],
        to: decoded.to,
        to_label: addressLabels[decoded.to],
        token_symbol: decoded.symbol,
        token_address: decoded.tokenAddress,
        amount: decoded.amount,
        usd_value: usdValue
      };

      transferEvents.push(transferEvent);
    }

    return transferEvents;
  }

  // Public methods for querying
  async getTransferEvents(filters: {
    chain?: string;
    tokenAddress?: string;
    from?: string;
    to?: string;
    startBlock?: number;
    endBlock?: number;
    limit?: number;
  }): Promise<TransferEvent[]> {
    return this.dbManager.getTransferEvents(filters);
  }

  // Health check
  async getStatus(): Promise<{
    isRunning: boolean;
    chains: Record<string, { latestBlock: number | null; isConnected: boolean }>;
  }> {
    const chains: Record<string, { latestBlock: number | null; isConnected: boolean }> = {};

    for (const [chainName, listener] of this.chainListeners.entries()) {
      const latestBlock = await this.dbManager.getLatestBlock(chainName);
      chains[chainName] = {
        latestBlock,
        isConnected: listener.isConnected()
      };
    }

    return {
      isRunning: this.isRunning,
      chains
    };
  }
}