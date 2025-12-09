import { ArkhamLiteIndexer } from './ArkhamLiteIndexer';

export const indexerConfig = {
  chains: [
    {
      name: 'ethereum',
      rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY',
      startBlock: 18000000 // Example start block
    },
    {
      name: 'arbitrum',
      rpcUrl: process.env.ARBITRUM_RPC_URL || 'https://arb-mainnet.g.alchemy.com/v2/YOUR_API_KEY',
      startBlock: 100000000 // Example start block
    },
    {
      name: 'base',
      rpcUrl: process.env.BASE_RPC_URL || 'https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY',
      startBlock: 1000000 // Example start block
    }
  ],
  database: {
    type: 'postgres', // or 'mongodb'
    connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/arkham_lite',
    database: 'arkham_lite'
  },
  batchSize: 100, // Process 100 blocks at a time
  pollInterval: 12000 // Poll every 12 seconds
};

// Environment variables needed:
// - ETHEREUM_RPC_URL
// - ARBITRUM_RPC_URL
// - BASE_RPC_URL
// - DATABASE_URL
// - ETHERSCAN_API_KEY (optional, for contract labeling)
// - ARBISCAN_API_KEY (optional, for contract labeling)
// - BASESCAN_API_KEY (optional, for contract labeling)