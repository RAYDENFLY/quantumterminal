import { ArkhamLiteIndexer } from './ArkhamLiteIndexer';
import { indexerConfig } from './config';

async function main() {
  console.log('Starting Arkham Lite Transfer Feed Indexer...');

  const indexer = new ArkhamLiteIndexer(indexerConfig);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully...');
    await indexer.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    await indexer.stop();
    process.exit(0);
  });

  try {
    await indexer.start();

    // Keep the process running
    while (true) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Optional: Log status every minute
      const status = await indexer.getStatus();
      console.log('Indexer status:', status);
      await new Promise(resolve => setTimeout(resolve, 59000)); // Wait 59 seconds
    }
  } catch (error) {
    console.error('Indexer failed to start:', error);
    process.exit(1);
  }
}

// Example of querying transfer events
async function queryExample(indexer: ArkhamLiteIndexer) {
  const recentTransfers = await indexer.getTransferEvents({
    chain: 'ethereum',
    limit: 10
  });

  console.log('Recent transfers:', recentTransfers);

  // Query specific token transfers
  const usdcTransfers = await indexer.getTransferEvents({
    tokenAddress: '0xa0b86a33e6c0c3a9233e4f6f5e6e4b4c4b8c4b8c', // USDC on Ethereum
    limit: 5
  });

  console.log('USDC transfers:', usdcTransfers);
}

// Run the indexer
if (require.main === module) {
  main().catch(console.error);
}

export { main, queryExample };