"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressLabeler = void 0;
var AddressLabeler = /** @class */ (function () {
    function AddressLabeler() {
        this.staticLabels = new Map();
        this.apiCache = new Map();
        this.initializeStaticLabels();
    }
    AddressLabeler.prototype.initializeStaticLabels = function () {
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
        // Additional Trading Firms and Market Makers
        this.addStaticLabel('0xDBF5E9c5206d0dB70a90108bf936DA60221dC080', 'Wintermute', 'wallet');
        this.addStaticLabel('0x573ca9FF6b7f164dfF513077850d5CD796006fF4', 'Aster', 'wallet');
    };
    AddressLabeler.prototype.addStaticLabel = function (address, label, type) {
        this.staticLabels.set(address.toLowerCase(), { address: address.toLowerCase(), label: label, type: type });
    };
    AddressLabeler.prototype.getLabel = function (address_1) {
        return __awaiter(this, arguments, void 0, function (address, chain) {
            var normalizedAddress, staticLabel, cacheKey, cachedLabel, apiLabel, error_1;
            if (chain === void 0) { chain = 'ethereum'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        normalizedAddress = address.toLowerCase();
                        staticLabel = this.staticLabels.get(normalizedAddress);
                        if (staticLabel) {
                            return [2 /*return*/, staticLabel.label];
                        }
                        cacheKey = "".concat(chain, "_").concat(normalizedAddress);
                        cachedLabel = this.apiCache.get(cacheKey);
                        if (cachedLabel) {
                            return [2 /*return*/, cachedLabel.label];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.fetchFromBlockExplorer(normalizedAddress, chain)];
                    case 2:
                        apiLabel = _a.sent();
                        if (apiLabel) {
                            this.apiCache.set(cacheKey, apiLabel);
                            return [2 /*return*/, apiLabel.label];
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        console.error('Failed to fetch label from block explorer:', error_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/, undefined];
                }
            });
        });
    };
    AddressLabeler.prototype.fetchFromBlockExplorer = function (address, chain) {
        return __awaiter(this, void 0, void 0, function () {
            var apiUrls, chainConfig, params, response, data, contractData, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        apiUrls = {
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
                        chainConfig = apiUrls[chain];
                        if (!chainConfig)
                            return [2 /*return*/, null];
                        params = new URLSearchParams({
                            module: 'contract',
                            action: 'getsourcecode',
                            address: address,
                            apikey: chainConfig.key || ''
                        });
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, fetch("".concat(chainConfig.url, "?").concat(params))];
                    case 2:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 3:
                        data = _a.sent();
                        if (data.status === '1' && data.result && data.result[0]) {
                            contractData = data.result[0];
                            if (contractData.ContractName && contractData.ContractName !== '') {
                                return [2 /*return*/, {
                                        address: address,
                                        label: contractData.ContractName,
                                        type: 'other'
                                    }];
                            }
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        error_2 = _a.sent();
                        console.error('Block explorer API error:', error_2);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/, null];
                }
            });
        });
    };
    AddressLabeler.prototype.labelAddresses = function (addresses_1) {
        return __awaiter(this, arguments, void 0, function (addresses, chain) {
            var results, batchSize, _loop_1, i;
            var _this = this;
            if (chain === void 0) { chain = 'ethereum'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        results = {};
                        batchSize = 10;
                        _loop_1 = function (i) {
                            var batch, batchPromises, batchResults;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        batch = addresses.slice(i, i + batchSize);
                                        batchPromises = batch.map(function (addr) { return _this.getLabel(addr, chain); });
                                        return [4 /*yield*/, Promise.all(batchPromises)];
                                    case 1:
                                        batchResults = _b.sent();
                                        batch.forEach(function (addr, index) {
                                            results[addr] = batchResults[index];
                                        });
                                        if (!(i + batchSize < addresses.length)) return [3 /*break*/, 3];
                                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 100); })];
                                    case 2:
                                        _b.sent();
                                        _b.label = 3;
                                    case 3: return [2 /*return*/];
                                }
                            });
                        };
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < addresses.length)) return [3 /*break*/, 4];
                        return [5 /*yield**/, _loop_1(i)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        i += batchSize;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, results];
                }
            });
        });
    };
    return AddressLabeler;
}());
exports.AddressLabeler = AddressLabeler;
