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
exports.CHAINS = exports.ChainListener = void 0;
var ethers_1 = require("ethers");
var ChainListener = /** @class */ (function () {
    function ChainListener(config) {
        this.config = config;
        this.provider = new ethers_1.ethers.JsonRpcProvider(config.rpcUrl);
    }
    ChainListener.prototype.getLatestBlock = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.provider.getBlockNumber()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    ChainListener.prototype.getTransferLogs = function (fromBlock, toBlock, tokenAddresses) {
        return __awaiter(this, void 0, void 0, function () {
            var transferTopic, filter;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        transferTopic = ethers_1.ethers.id('Transfer(address,address,uint256)');
                        filter = {
                            topics: [transferTopic],
                            fromBlock: fromBlock,
                            toBlock: toBlock,
                        };
                        if (tokenAddresses && tokenAddresses.length > 0) {
                            filter.address = tokenAddresses;
                        }
                        return [4 /*yield*/, this.provider.getLogs(filter)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    ChainListener.prototype.getBlockTimestamp = function (blockNumber) {
        return __awaiter(this, void 0, void 0, function () {
            var block;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.provider.getBlock(blockNumber)];
                    case 1:
                        block = _a.sent();
                        return [2 /*return*/, (block === null || block === void 0 ? void 0 : block.timestamp) || 0];
                }
            });
        });
    };
    ChainListener.prototype.getConfig = function () {
        return this.config;
    };
    return ChainListener;
}());
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
