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
exports.PriceResolver = void 0;
var PriceResolver = /** @class */ (function () {
    function PriceResolver() {
        this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
        this.priceCache = new Map();
    }
    PriceResolver.prototype.getTokenPrice = function (tokenAddress_1) {
        return __awaiter(this, arguments, void 0, function (tokenAddress, chain) {
            var cacheKey, cached, price, dexPrice, error_1;
            if (chain === void 0) { chain = 'ethereum'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cacheKey = "".concat(chain, "_").concat(tokenAddress.toLowerCase());
                        cached = this.priceCache.get(cacheKey);
                        if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
                            return [2 /*return*/, cached.price];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this.fetchFromCoinGecko(tokenAddress, chain)];
                    case 2:
                        price = _a.sent();
                        if (price !== null) {
                            this.priceCache.set(cacheKey, { price: price, timestamp: Date.now() });
                            return [2 /*return*/, price];
                        }
                        return [4 /*yield*/, this.fetchFromDEX(tokenAddress, chain)];
                    case 3:
                        dexPrice = _a.sent();
                        if (dexPrice !== null) {
                            this.priceCache.set(cacheKey, { price: dexPrice, timestamp: Date.now() });
                            return [2 /*return*/, dexPrice];
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _a.sent();
                        console.error('Failed to fetch price for token:', tokenAddress, error_1);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/, null];
                }
            });
        });
    };
    PriceResolver.prototype.fetchFromCoinGecko = function (tokenAddress, chain) {
        return __awaiter(this, void 0, void 0, function () {
            var platformMap, platform, response, data, tokenData, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        platformMap = {
                            ethereum: 'ethereum',
                            arbitrum: 'arbitrum-one',
                            base: 'base'
                        };
                        platform = platformMap[chain];
                        if (!platform)
                            return [2 /*return*/, null];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, fetch("https://api.coingecko.com/api/v3/simple/token_price/".concat(platform, "?contract_addresses=").concat(tokenAddress, "&vs_currencies=usd"))];
                    case 2:
                        response = _a.sent();
                        if (!response.ok)
                            return [2 /*return*/, null];
                        return [4 /*yield*/, response.json()];
                    case 3:
                        data = _a.sent();
                        tokenData = data[tokenAddress.toLowerCase()];
                        return [2 /*return*/, (tokenData === null || tokenData === void 0 ? void 0 : tokenData.usd) || null];
                    case 4:
                        error_2 = _a.sent();
                        console.error('CoinGecko API error:', error_2);
                        return [2 /*return*/, null];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    PriceResolver.prototype.fetchFromDEX = function (tokenAddress, chain) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // This is a simplified DEX price estimation
                // In production, you'd integrate with The Graph or direct DEX contracts
                try {
                    // For now, return null - this would need actual DEX integration
                    // You could implement Uniswap V2/V3 price fetching here
                    return [2 /*return*/, null];
                }
                catch (error) {
                    console.error('DEX price fetch error:', error);
                    return [2 /*return*/, null];
                }
                return [2 /*return*/];
            });
        });
    };
    PriceResolver.prototype.getBatchPrices = function (tokenAddresses_1) {
        return __awaiter(this, arguments, void 0, function (tokenAddresses, chain) {
            var results, batchSize, _loop_1, i;
            var _this = this;
            if (chain === void 0) { chain = 'ethereum'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        results = {};
                        batchSize = 50;
                        _loop_1 = function (i) {
                            var batch, batchPromises, batchResults;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        batch = tokenAddresses.slice(i, i + batchSize);
                                        batchPromises = batch.map(function (addr) { return _this.getTokenPrice(addr, chain); });
                                        return [4 /*yield*/, Promise.all(batchPromises)];
                                    case 1:
                                        batchResults = _b.sent();
                                        batch.forEach(function (addr, index) {
                                            results[addr] = batchResults[index];
                                        });
                                        if (!(i + batchSize < tokenAddresses.length)) return [3 /*break*/, 3];
                                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                                    case 2:
                                        _b.sent(); // 1 second delay
                                        _b.label = 3;
                                    case 3: return [2 /*return*/];
                                }
                            });
                        };
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < tokenAddresses.length)) return [3 /*break*/, 4];
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
    PriceResolver.prototype.getPriceData = function (tokenAddress_1, symbol_1) {
        return __awaiter(this, arguments, void 0, function (tokenAddress, symbol, chain) {
            var price;
            if (chain === void 0) { chain = 'ethereum'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getTokenPrice(tokenAddress, chain)];
                    case 1:
                        price = _a.sent();
                        if (price === null)
                            return [2 /*return*/, null];
                        return [2 /*return*/, {
                                tokenAddress: tokenAddress.toLowerCase(),
                                symbol: symbol,
                                price: price,
                                timestamp: Date.now(),
                                source: 'coingecko' // or 'dex' depending on where it came from
                            }];
                }
            });
        });
    };
    PriceResolver.prototype.clearCache = function () {
        this.priceCache.clear();
    };
    // Get cache stats for monitoring
    PriceResolver.prototype.getCacheStats = function () {
        if (this.priceCache.size === 0) {
            return { size: 0, oldest: null, newest: null };
        }
        var timestamps = Array.from(this.priceCache.values()).map(function (entry) { return entry.timestamp; });
        return {
            size: this.priceCache.size,
            oldest: Math.min.apply(Math, timestamps),
            newest: Math.max.apply(Math, timestamps)
        };
    };
    return PriceResolver;
}());
exports.PriceResolver = PriceResolver;
