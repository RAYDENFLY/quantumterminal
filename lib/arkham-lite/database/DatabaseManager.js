"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.DatabaseManager = exports.MongoDBAdapter = exports.PostgresAdapter = exports.DatabaseAdapter = void 0;
var DatabaseAdapter = /** @class */ (function () {
    function DatabaseAdapter() {
    }
    return DatabaseAdapter;
}());
exports.DatabaseAdapter = DatabaseAdapter;
var PostgresAdapter = /** @class */ (function (_super) {
    __extends(PostgresAdapter, _super);
    function PostgresAdapter(config) {
        var _this = _super.call(this) || this;
        _this.config = config;
        return _this;
    }
    PostgresAdapter.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // const { Pool } = require('pg');
                // this.pool = new Pool({ connectionString: this.config.connectionString });
                console.log('Connecting to PostgreSQL...');
                return [2 /*return*/];
            });
        });
    };
    PostgresAdapter.prototype.disconnect = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // await this.pool?.end();
                console.log('Disconnected from PostgreSQL');
                return [2 /*return*/];
            });
        });
    };
    PostgresAdapter.prototype.saveTransferEvent = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Implementation for PostgreSQL
                console.log('Saving transfer event to PostgreSQL:', event.tx_hash);
                return [2 /*return*/];
            });
        });
    };
    PostgresAdapter.prototype.saveTransferEvents = function (events) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Batch insert implementation
                console.log("Saving ".concat(events.length, " transfer events to PostgreSQL"));
                return [2 /*return*/];
            });
        });
    };
    PostgresAdapter.prototype.getTransferEvents = function (filters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Query implementation
                return [2 /*return*/, []];
            });
        });
    };
    PostgresAdapter.prototype.getLatestBlock = function (chain) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Query latest block for chain
                return [2 /*return*/, null];
            });
        });
    };
    PostgresAdapter.prototype.updateLatestBlock = function (chain, blockNumber) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Update or insert latest block
                console.log("Updated latest block for ".concat(chain, " to ").concat(blockNumber));
                return [2 /*return*/];
            });
        });
    };
    return PostgresAdapter;
}(DatabaseAdapter));
exports.PostgresAdapter = PostgresAdapter;
var MongoDBAdapter = /** @class */ (function (_super) {
    __extends(MongoDBAdapter, _super);
    function MongoDBAdapter(config) {
        var _this = _super.call(this) || this;
        _this.config = config;
        return _this;
    }
    MongoDBAdapter.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // const { MongoClient } = require('mongodb');
                // this.client = new MongoClient(this.config.connectionString);
                // await this.client.connect();
                // this.db = this.client.db(this.config.database);
                console.log('Connecting to MongoDB...');
                return [2 /*return*/];
            });
        });
    };
    MongoDBAdapter.prototype.disconnect = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // await this.client?.close();
                console.log('Disconnected from MongoDB');
                return [2 /*return*/];
            });
        });
    };
    MongoDBAdapter.prototype.saveTransferEvent = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Implementation for MongoDB
                console.log('Saving transfer event to MongoDB:', event.tx_hash);
                return [2 /*return*/];
            });
        });
    };
    MongoDBAdapter.prototype.saveTransferEvents = function (events) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Batch insert implementation
                console.log("Saving ".concat(events.length, " transfer events to MongoDB"));
                return [2 /*return*/];
            });
        });
    };
    MongoDBAdapter.prototype.getTransferEvents = function (filters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Query implementation
                return [2 /*return*/, []];
            });
        });
    };
    MongoDBAdapter.prototype.getLatestBlock = function (chain) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Query latest block for chain
                return [2 /*return*/, null];
            });
        });
    };
    MongoDBAdapter.prototype.updateLatestBlock = function (chain, blockNumber) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Update or insert latest block
                console.log("Updated latest block for ".concat(chain, " to ").concat(blockNumber));
                return [2 /*return*/];
            });
        });
    };
    return MongoDBAdapter;
}(DatabaseAdapter));
exports.MongoDBAdapter = MongoDBAdapter;
var DatabaseManager = /** @class */ (function () {
    function DatabaseManager(config) {
        if (config.type === 'postgres') {
            this.adapter = new PostgresAdapter(config);
        }
        else if (config.type === 'mongodb') {
            this.adapter = new MongoDBAdapter(config);
        }
        else {
            throw new Error("Unsupported database type: ".concat(config.type));
        }
    }
    DatabaseManager.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.adapter.connect()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DatabaseManager.prototype.disconnect = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.adapter.disconnect()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DatabaseManager.prototype.saveTransferEvent = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.adapter.saveTransferEvent(event)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DatabaseManager.prototype.saveTransferEvents = function (events) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.adapter.saveTransferEvents(events)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DatabaseManager.prototype.getTransferEvents = function (filters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.adapter.getTransferEvents(filters)];
            });
        });
    };
    DatabaseManager.prototype.getLatestBlock = function (chain) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.adapter.getLatestBlock(chain)];
            });
        });
    };
    DatabaseManager.prototype.updateLatestBlock = function (chain, blockNumber) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.adapter.updateLatestBlock(chain, blockNumber)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return DatabaseManager;
}());
exports.DatabaseManager = DatabaseManager;
