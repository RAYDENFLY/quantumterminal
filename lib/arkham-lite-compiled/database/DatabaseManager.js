"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseManager = exports.MongoDBAdapter = exports.PostgresAdapter = exports.DatabaseAdapter = void 0;
class DatabaseAdapter {
}
exports.DatabaseAdapter = DatabaseAdapter;
class PostgresAdapter extends DatabaseAdapter {
    constructor(config) {
        super();
        this.config = config;
    }
    async connect() {
        // const { Pool } = require('pg');
        // this.pool = new Pool({ connectionString: this.config.connectionString });
        console.log('Connecting to PostgreSQL...');
    }
    async disconnect() {
        // await this.pool?.end();
        console.log('Disconnected from PostgreSQL');
    }
    async saveTransferEvent(event) {
        // Implementation for PostgreSQL
        console.log('Saving transfer event to PostgreSQL:', event.tx_hash);
    }
    async saveTransferEvents(events) {
        // Batch insert implementation
        console.log(`Saving ${events.length} transfer events to PostgreSQL`);
    }
    async getTransferEvents(filters) {
        // Query implementation
        return [];
    }
    async getLatestBlock(chain) {
        // Query latest block for chain
        return null;
    }
    async updateLatestBlock(chain, blockNumber) {
        // Update or insert latest block
        console.log(`Updated latest block for ${chain} to ${blockNumber}`);
    }
}
exports.PostgresAdapter = PostgresAdapter;
class MongoDBAdapter extends DatabaseAdapter {
    constructor(config) {
        super();
        this.config = config;
    }
    async connect() {
        // const { MongoClient } = require('mongodb');
        // this.client = new MongoClient(this.config.connectionString);
        // await this.client.connect();
        // this.db = this.client.db(this.config.database);
        console.log('Connecting to MongoDB...');
    }
    async disconnect() {
        // await this.client?.close();
        console.log('Disconnected from MongoDB');
    }
    async saveTransferEvent(event) {
        // Implementation for MongoDB
        console.log('Saving transfer event to MongoDB:', event.tx_hash);
    }
    async saveTransferEvents(events) {
        // Batch insert implementation
        console.log(`Saving ${events.length} transfer events to MongoDB`);
    }
    async getTransferEvents(filters) {
        // Query implementation
        return [];
    }
    async getLatestBlock(chain) {
        // Query latest block for chain
        return null;
    }
    async updateLatestBlock(chain, blockNumber) {
        // Update or insert latest block
        console.log(`Updated latest block for ${chain} to ${blockNumber}`);
    }
}
exports.MongoDBAdapter = MongoDBAdapter;
class DatabaseManager {
    constructor(config) {
        if (config.type === 'postgres') {
            this.adapter = new PostgresAdapter(config);
        }
        else if (config.type === 'mongodb') {
            this.adapter = new MongoDBAdapter(config);
        }
        else {
            throw new Error(`Unsupported database type: ${config.type}`);
        }
    }
    async connect() {
        await this.adapter.connect();
    }
    async disconnect() {
        await this.adapter.disconnect();
    }
    async saveTransferEvent(event) {
        await this.adapter.saveTransferEvent(event);
    }
    async saveTransferEvents(events) {
        await this.adapter.saveTransferEvents(events);
    }
    async getTransferEvents(filters) {
        return this.adapter.getTransferEvents(filters);
    }
    async getLatestBlock(chain) {
        return this.adapter.getLatestBlock(chain);
    }
    async updateLatestBlock(chain, blockNumber) {
        await this.adapter.updateLatestBlock(chain, blockNumber);
    }
}
exports.DatabaseManager = DatabaseManager;
