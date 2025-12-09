"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHAINS = exports.ChainListener = void 0;
const ethers_1 = require("ethers");
class ChainListener {
    constructor(config) {
        this.config = config;
        this.provider = new ethers_1.ethers.JsonRpcProvider(config.rpcUrl);
    }
    async getLatestBlock() {
        return await this.provider.getBlockNumber();
    }
    async getTransferLogs(fromBlock, toBlock, tokenAddresses) {
        const transferTopic = ethers_1.ethers.id('Transfer(address,address,uint256)');
        const filter = {
            topics: [transferTopic],
            fromBlock,
            toBlock,
        };
        if (tokenAddresses && tokenAddresses.length > 0) {
            filter.address = tokenAddresses;
        }
        return await this.provider.getLogs(filter);
    }
    async getBlockTimestamp(blockNumber) {
        const block = await this.provider.getBlock(blockNumber);
        return block?.timestamp || 0;
    }
    getConfig() {
        return this.config;
    }
}
exports.ChainListener = ChainListener;
// Pre-configured chains
exports.CHAINS = {
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
