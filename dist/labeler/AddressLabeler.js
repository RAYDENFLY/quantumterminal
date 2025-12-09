"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressLabeler = void 0;
class AddressLabeler {
    constructor() {
        this.staticLabels = new Map();
        this.apiCache = new Map();
        this.initializeStaticLabels();
    }
    initializeStaticLabels() {
        // DEX Routers and Pools
        this.addStaticLabel('0x7a250d5630b4cf539739df2c5dacb4c659f2488d', 'Uniswap V2 Router', 'dex');
        this.addStaticLabel('0xe592427a0aece92de3edee1f18e0157c05861564', 'Uniswap V3 SwapRouter', 'dex');
        this.addStaticLabel('0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45', 'Uniswap V3 SwapRouter02', 'dex');
        this.addStaticLabel('0xc36442b4a4522e871399cd717abdd847ab11fe88', 'Uniswap V3 Positions NFT', 'dex');
        // DEX Pools (examples)
        this.addStaticLabel('0xa478c2975ab1ea89e8196811f51a7b7ade33eb11', 'Uniswap V3: WETH/USDC 0.3%', 'dex');
        this.addStaticLabel('0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640', 'Uniswap V3: WBTC/WETH 0.3%', 'dex');
        // Vaults and Yield Farming
        this.addStaticLabel('0xba12222222228d8ba445958a75a0704d566bf2c8', 'Balancer Vault', 'vault');
        this.addStaticLabel('0x8315177ab297ba92a06054ce80a67ed4dbd7ed3a', 'Balancer V2 Vault', 'vault');
        this.addStaticLabel('0xbf65bfcb5da067446cee6a706ba3fe2fb1a9fdf', 'Yearn Vault V2', 'vault');
        // Bridges
        this.addStaticLabel('0x4aa42145aa6ebf72e164c9bbc74fbd3788045016', 'Arbitrum Bridge', 'bridge');
        this.addStaticLabel('0x40ec5b33f54e0e8a33a975908c5ba1c14e5bbbdf', 'Polygon Bridge', 'bridge');
        this.addStaticLabel('0x99c9fc46f92e8a1c0dec1b1747d010903e884be1', 'Optimism Bridge', 'bridge');
        // Safe Wallets
        this.addStaticLabel('0x34cfac646f301356faa8b21e94227e3583fe3f5f', 'Gnosis Safe Proxy Factory', 'wallet');
        this.addStaticLabel('0xd9db270c1b5e3bd161e8c8503c55ceabee709552', 'Gnosis Safe Singleton', 'wallet');
        // Major Exchanges (deposit/withdrawal addresses)
        this.addStaticLabel('0x28c6c06298d514db089934071355e5743bf21d60', 'Binance 14', 'wallet');
        this.addStaticLabel('0xdfd5293d8e347dfe59e90efd55b2956a1343963d', 'Binance 15', 'wallet');
        this.addStaticLabel('0xeb2d2f1b8c558a40207669291fda468e50c8a0bb', 'Crypto.com', 'wallet');
        this.addStaticLabel('0x2910543af39aba0cd09dbb2d50200b3e800a63d2', 'Kraken', 'wallet');
    }
    addStaticLabel(address, label, type) {
        this.staticLabels.set(address.toLowerCase(), { address: address.toLowerCase(), label, type });
    }
    async getLabel(address, chain = 'ethereum') {
        const normalizedAddress = address.toLowerCase();
        // Check static labels first
        const staticLabel = this.staticLabels.get(normalizedAddress);
        if (staticLabel) {
            return staticLabel.label;
        }
        // Check API cache
        const cacheKey = `${chain}_${normalizedAddress}`;
        const cachedLabel = this.apiCache.get(cacheKey);
        if (cachedLabel) {
            return cachedLabel.label;
        }
        // Try to fetch from block explorer API
        try {
            const apiLabel = await this.fetchFromBlockExplorer(normalizedAddress, chain);
            if (apiLabel) {
                this.apiCache.set(cacheKey, apiLabel);
                return apiLabel.label;
            }
        }
        catch (error) {
            console.error('Failed to fetch label from block explorer:', error);
        }
        return undefined;
    }
    async fetchFromBlockExplorer(address, chain) {
        const apiUrls = {
            ethereum: {
                url: 'https://api.etherscan.io/api',
                key: process.env.ETHERSCAN_API_KEY
            },
            arbitrum: {
                url: 'https://api.arbiscan.io/api',
                key: process.env.ARBISCAN_API_KEY
            },
            base: {
                url: 'https://api.basescan.org/api',
                key: process.env.BASESCAN_API_KEY
            }
        };
        const chainConfig = apiUrls[chain];
        if (!chainConfig)
            return null;
        const params = new URLSearchParams({
            module: 'contract',
            action: 'getsourcecode',
            address,
            apikey: chainConfig.key || ''
        });
        try {
            const response = await fetch(`${chainConfig.url}?${params}`);
            const data = await response.json();
            if (data.status === '1' && data.result && data.result[0]) {
                const contractData = data.result[0];
                if (contractData.ContractName && contractData.ContractName !== '') {
                    return {
                        address,
                        label: contractData.ContractName,
                        type: 'other'
                    };
                }
            }
        }
        catch (error) {
            console.error('Block explorer API error:', error);
        }
        return null;
    }
    async labelAddresses(addresses, chain = 'ethereum') {
        const results = {};
        // Process in batches to avoid overwhelming APIs
        const batchSize = 10;
        for (let i = 0; i < addresses.length; i += batchSize) {
            const batch = addresses.slice(i, i + batchSize);
            const batchPromises = batch.map(addr => this.getLabel(addr, chain));
            const batchResults = await Promise.all(batchPromises);
            batch.forEach((addr, index) => {
                results[addr] = batchResults[index];
            });
            // Small delay between batches
            if (i + batchSize < addresses.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        return results;
    }
}
exports.AddressLabeler = AddressLabeler;
