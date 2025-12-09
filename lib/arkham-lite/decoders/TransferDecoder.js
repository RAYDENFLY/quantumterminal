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
exports.TransferDecoder = void 0;
var ethers_1 = require("ethers");
var TransferDecoder = /** @class */ (function () {
    function TransferDecoder() {
        // Minimal ERC20 ABI for Transfer events
        this.erc20Abi = [
            'event Transfer(address indexed from, address indexed to, uint256 value)',
            'function symbol() view returns (string)',
            'function decimals() view returns (uint8)',
            'function name() view returns (string)'
        ];
    }
    TransferDecoder.prototype.decodeTransferLog = function (log, provider) {
        return __awaiter(this, void 0, void 0, function () {
            var transferTopic, iface, decodedLog, _a, from, to, value, tokenMetadata, amount, block, timestamp, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 3, , 4]);
                        transferTopic = ethers_1.ethers.id('Transfer(address,address,uint256)');
                        if (log.topics[0] !== transferTopic) {
                            return [2 /*return*/, null];
                        }
                        iface = new ethers_1.ethers.Interface(this.erc20Abi);
                        decodedLog = iface.parseLog({
                            topics: log.topics,
                            data: log.data
                        });
                        if (!decodedLog)
                            return [2 /*return*/, null];
                        _a = decodedLog.args, from = _a.from, to = _a.to, value = _a.value;
                        return [4 /*yield*/, this.getTokenMetadata(log.address, provider)];
                    case 1:
                        tokenMetadata = _b.sent();
                        if (!tokenMetadata)
                            return [2 /*return*/, null];
                        amount = parseFloat(ethers_1.ethers.formatUnits(value, tokenMetadata.decimals));
                        return [4 /*yield*/, provider.getBlock(log.blockNumber)];
                    case 2:
                        block = _b.sent();
                        timestamp = (block === null || block === void 0 ? void 0 : block.timestamp) ? new Date(block.timestamp * 1000).toISOString() : new Date().toISOString();
                        return [2 /*return*/, {
                                chain: 'ethereum', // Will be set by caller based on chain
                                tx_hash: log.transactionHash,
                                timestamp: timestamp,
                                block_number: log.blockNumber,
                                from: from.toLowerCase(),
                                to: to.toLowerCase(),
                                token_symbol: tokenMetadata.symbol,
                                token_address: log.address.toLowerCase(),
                                amount: amount,
                                usd_value: 0 // Will be filled by price resolver
                            }];
                    case 3:
                        error_1 = _b.sent();
                        console.error('Failed to decode transfer log:', error_1);
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    TransferDecoder.prototype.getTokenMetadata = function (tokenAddress, provider) {
        return __awaiter(this, void 0, void 0, function () {
            var contract, _a, symbol, decimals, name_1, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        contract = new ethers_1.ethers.Contract(tokenAddress, this.erc20Abi, provider);
                        return [4 /*yield*/, Promise.allSettled([
                                contract.symbol(),
                                contract.decimals(),
                                contract.name().catch(function () { return 'Unknown Token'; })
                            ])];
                    case 1:
                        _a = _b.sent(), symbol = _a[0], decimals = _a[1], name_1 = _a[2];
                        return [2 /*return*/, {
                                address: tokenAddress.toLowerCase(),
                                symbol: symbol.status === 'fulfilled' ? symbol.value : 'UNKNOWN',
                                decimals: decimals.status === 'fulfilled' ? decimals.value : 18,
                                name: name_1.status === 'fulfilled' ? name_1.value : undefined
                            }];
                    case 2:
                        error_2 = _b.sent();
                        console.error("Failed to get token metadata for ".concat(tokenAddress, ":"), error_2);
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    TransferDecoder.prototype.decodeBatch = function (logs, provider) {
        return __awaiter(this, void 0, void 0, function () {
            var decodedEvents, batchSize, i, batch, batchPromises, batchResults;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        decodedEvents = [];
                        batchSize = 10;
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < logs.length)) return [3 /*break*/, 4];
                        batch = logs.slice(i, i + batchSize);
                        batchPromises = batch.map(function (log) { return _this.decodeTransferLog(log, provider); });
                        return [4 /*yield*/, Promise.all(batchPromises)];
                    case 2:
                        batchResults = _a.sent();
                        decodedEvents.push.apply(decodedEvents, batchResults.filter(function (event) { return event !== null; }));
                        _a.label = 3;
                    case 3:
                        i += batchSize;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, decodedEvents];
                }
            });
        });
    };
    return TransferDecoder;
}());
exports.TransferDecoder = TransferDecoder;
