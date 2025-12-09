import { TransferDecoder } from './decoders/TransferDecoder';
import { AddressLabeler } from './labeler/AddressLabeler';
import { PriceResolver } from './utils/PriceResolver';
import { LogData } from './types';
import { ethers } from 'ethers';

// Simple test to validate core functionality
async function runTests() {
  console.log('Running Arkham Lite Indexer Tests...\n');

  // Test 1: TransferDecoder
  console.log('1. Testing TransferDecoder...');
  const decoder = new TransferDecoder();

  // Create a mock provider (won't actually connect)
  const mockProvider = new ethers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/mock');

  // Mock ERC20 Transfer log
  const mockLog: LogData = {
    address: '0xA0b86a33e6c0c3a9233e4f6f5e6e4b4c4b8c4b8c', // USDC
    topics: [
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', // Transfer event signature
      '0x000000000000000000000000d8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // from
      '0x000000000000000000000000f39Fd6e51aad88F6F4ce6aB8827279cffFb92266'  // to
    ],
    data: '0x0000000000000000000000000000000000000000000000000000000005f5e100', // 100000000 (100 USDC)
    blockNumber: 18000000,
    transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    logIndex: 0
  };

  try {
    const decoded = await decoder.decodeTransferLog(mockLog, mockProvider);
    if (decoded) {
      console.log('✓ TransferDecoder decoded successfully:', {
        from: decoded.from,
        to: decoded.to,
        amount: decoded.amount,
        token_address: decoded.token_address
      });
    } else {
      console.log('✗ TransferDecoder returned null');
    }
  } catch (error) {
    console.log('✗ TransferDecoder failed:', error instanceof Error ? error.message : String(error));
  }

  // Test 2: AddressLabeler
  console.log('\n2. Testing AddressLabeler...');
  const labeler = new AddressLabeler();

  const testAddresses = [
    '0x7a250d5630b4cf539739df2c5dacb4c659f2488d', // Uniswap Router
    '0x28c6c06298d514db089934071355e5743bf21d60', // Binance
    '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'  // Vitalik (unknown)
  ];

  try {
    const labels = await labeler.labelAddresses(testAddresses, 'ethereum');
    console.log('✓ AddressLabeler results:');
    testAddresses.forEach((addr, i) => {
      console.log(`  ${addr}: ${labels[addr] || 'Unknown'}`);
    });
  } catch (error) {
    console.log('✗ AddressLabeler failed:', error instanceof Error ? error.message : String(error));
  }

  // Test 3: PriceResolver (mock test - would need real API keys)
  console.log('\n3. Testing PriceResolver...');
  const priceResolver = new PriceResolver();

  try {
    // This will likely fail without API keys, but tests the structure
    const price = await priceResolver.getTokenPrice('0xA0b86a33e6c0c3a9233e4f6f5e6e4b4c4b8c4b8c', 'ethereum');
    console.log('✓ PriceResolver result:', price ? `$${price}` : 'Price not found');
  } catch (error) {
    console.log('✗ PriceResolver failed (expected without API keys):', error instanceof Error ? error.message : String(error));
  }

  console.log('\n✓ All tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

export { runTests };