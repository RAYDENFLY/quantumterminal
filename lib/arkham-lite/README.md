# Arkham Lite: Transfer Feed Indexer

A production-ready multi-chain ERC20 transfer indexer built with TypeScript and ethers.js. Monitors Transfer events across Ethereum, Arbitrum, and Base chains, decodes them into structured data, fetches USD prices, labels known contracts, and stores in database with clean async architecture.

## Features

- **Multi-chain Support**: Ethereum, Arbitrum, and Base networks
- **Real-time Indexing**: Continuous monitoring of Transfer events
- **Token Metadata**: Automatic fetching of token symbols, decimals, and names
- **Price Integration**: USD price fetching via CoinGecko API
- **Contract Labeling**: Identification of known DEXs, vaults, bridges, and wallets
- **Database Agnostic**: Support for PostgreSQL and MongoDB
- **Batch Processing**: Efficient processing with configurable batch sizes
- **Error Handling**: Robust error handling and recovery mechanisms
- **Caching**: Built-in caching for prices and contract labels

## Architecture

```
ArkhamLiteIndexer
├── ChainListener (RPC interactions)
├── TransferDecoder (Event decoding)
├── AddressLabeler (Contract identification)
├── PriceResolver (USD price fetching)
└── DatabaseManager (Data persistence)
```

## Installation

```bash
npm install ethers
# Plus your preferred database driver (pg for PostgreSQL, mongodb for MongoDB)
```

## Configuration

Create a `.env` file with the following variables:

```env
# RPC URLs (get from Alchemy, Infura, etc.)
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/YOUR_API_KEY
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/arkham_lite

# Optional: Block explorer APIs for contract labeling
ETHERSCAN_API_KEY=your_etherscan_key
ARBISCAN_API_KEY=your_arbiscan_key
BASESCAN_API_KEY=your_basescan_key
```

## Usage

### Basic Usage

```typescript
import { ArkhamLiteIndexer } from './lib/arkham-lite/ArkhamLiteIndexer';
import { indexerConfig } from './lib/arkham-lite/config';

const indexer = new ArkhamLiteIndexer(indexerConfig);

async function startIndexing() {
  await indexer.start();

  // Query recent transfers
  const transfers = await indexer.getTransferEvents({
    chain: 'ethereum',
    limit: 10
  });

  console.log(transfers);
}

startIndexing();
```

### Command Line

```bash
npx ts-node lib/arkham-lite/index.ts
```

## Database Schema

### Transfer Events Table

```sql
CREATE TABLE transfer_events (
  id SERIAL PRIMARY KEY,
  chain VARCHAR(50) NOT NULL,
  tx_hash VARCHAR(66) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  block_number BIGINT NOT NULL,
  from_address VARCHAR(42) NOT NULL,
  from_label VARCHAR(255),
  to_address VARCHAR(42) NOT NULL,
  to_label VARCHAR(255),
  token_symbol VARCHAR(50) NOT NULL,
  token_address VARCHAR(42) NOT NULL,
  amount DECIMAL(36,18) NOT NULL,
  usd_value DECIMAL(20,8),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chain_block ON transfer_events(chain, block_number);
CREATE INDEX idx_token_address ON transfer_events(token_address);
CREATE INDEX idx_from_address ON transfer_events(from_address);
CREATE INDEX idx_to_address ON transfer_events(to_address);
```

### Latest Blocks Table

```sql
CREATE TABLE latest_blocks (
  chain VARCHAR(50) PRIMARY KEY,
  block_number BIGINT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## API Reference

### ArkhamLiteIndexer

#### Methods

- `start()`: Start the indexer
- `stop()`: Stop the indexer
- `getTransferEvents(filters)`: Query transfer events
- `getStatus()`: Get indexer health status

#### Query Filters

```typescript
interface TransferFilters {
  chain?: string;
  tokenAddress?: string;
  from?: string;
  to?: string;
  startBlock?: number;
  endBlock?: number;
  limit?: number;
}
```

## Performance Considerations

- **Batch Processing**: Configurable batch sizes for optimal throughput
- **Caching**: Price and label caching to reduce API calls
- **Connection Pooling**: Database connection pooling for high throughput
- **Async Architecture**: Non-blocking operations with Promise.allSettled

## Monitoring

The indexer provides health check endpoints:

```typescript
const status = await indexer.getStatus();
// Returns: { isRunning: boolean, chains: { [chain]: { latestBlock, isConnected } } }
```

## Error Handling

- Automatic retry on RPC failures
- Graceful degradation when APIs are unavailable
- Comprehensive logging for debugging
- Database transaction safety

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details