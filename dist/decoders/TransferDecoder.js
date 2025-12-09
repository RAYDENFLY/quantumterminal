"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferDecoder = void 0;
const ethers_1 = require("ethers");
class TransferDecoder {
    constructor() {
        // Minimal ERC20 ABI for Transfer events
        this.erc20Abi = [
            'event Transfer(address indexed from, address indexed to, uint256 value)',
            'function symbol() view returns (string)',
            'function decimals() view returns (uint8)',
            'function name() view returns (string)'
        ];
    }
    async decodeTransferLog(log, provider) {
        try {
            // Check if this is a Transfer event (topic 0 is the event signature)
            const transferTopic = ethers_1.ethers.id('Transfer(address,address,uint256)');
            if (log.topics[0] !== transferTopic) {
                return null;
            }
            // Decode the event data
            const iface = new ethers_1.ethers.Interface(this.erc20Abi);
            const decodedLog = iface.parseLog({
                topics: log.topics,
                data: log.data
            });
            if (!decodedLog)
                return null;
            const { from, to, value } = decodedLog.args;
            // Get token metadata
            const tokenMetadata = await this.getTokenMetadata(log.address, provider);
            if (!tokenMetadata)
                return null;
            // Convert value to human readable amount
            const amount = parseFloat(ethers_1.ethers.formatUnits(value, tokenMetadata.decimals));
            // Get block timestamp
            const block = await provider.getBlock(log.blockNumber);
            const timestamp = block?.timestamp ? new Date(block.timestamp * 1000).toISOString() : new Date().toISOString();
            return {
                chain: 'ethereum', // Will be set by caller based on chain
                tx_hash: log.transactionHash,
                timestamp,
                block_number: log.blockNumber,
                from: from.toLowerCase(),
                to: to.toLowerCase(),
                token_symbol: tokenMetadata.symbol,
                token_address: log.address.toLowerCase(),
                amount,
                usd_value: 0 // Will be filled by price resolver
            };
        }
        catch (error) {
            console.error('Failed to decode transfer log:', error);
            return null;
        }
    }
    async getTokenMetadata(tokenAddress, provider) {
        try {
            const contract = new ethers_1.ethers.Contract(tokenAddress, this.erc20Abi, provider);
            // Try to get symbol and decimals in parallel
            const [symbol, decimals, name] = await Promise.allSettled([
                contract.symbol(),
                contract.decimals(),
                contract.name().catch(() => 'Unknown Token')
            ]);
            return {
                address: tokenAddress.toLowerCase(),
                symbol: symbol.status === 'fulfilled' ? symbol.value : 'UNKNOWN',
                decimals: decimals.status === 'fulfilled' ? decimals.value : 18,
                name: name.status === 'fulfilled' ? name.value : undefined
            };
        }
        catch (error) {
            console.error(`Failed to get token metadata for ${tokenAddress}:`, error);
            return null;
        }
    }
    async decodeBatch(logs, provider) {
        const decodedEvents = [];
        // Process logs in batches to avoid overwhelming the provider
        const batchSize = 10;
        for (let i = 0; i < logs.length; i += batchSize) {
            const batch = logs.slice(i, i + batchSize);
            const batchPromises = batch.map(log => this.decodeTransferLog(log, provider));
            const batchResults = await Promise.all(batchPromises);
            decodedEvents.push(...batchResults.filter((event) => event !== null));
        }
        return decodedEvents;
    }
}
exports.TransferDecoder = TransferDecoder;
