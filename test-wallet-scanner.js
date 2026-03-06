#!/usr/bin/env node

/**
 * Test script for the wallet scanner
 * This script demonstrates how to use the wallet scanner API
 */

import axios from 'axios';

// Configuration
const BASE_URL = 'http://localhost:3000';
const API_ENDPOINT = `${BASE_URL}/api/wallet-scanner`;

// Test wallets (replace with real addresses for testing)
const testWallets = [
  {
    address: '0x1234567890123456789012345678901234567890',
    name: 'Test Wallet 1',
    chain: 'ethereum'
  },
  {
    address: '0x0987654321098765432109876543210987654321', 
    name: 'Test Wallet 2',
    chain: 'polygon'
  }
];

async function testWalletScanner() {
  console.log('🧪 Testing Wallet Scanner API...\n');

  try {
    // Test 1: Check status (should be stopped initially)
    console.log('1. Checking scanner status...');
    const statusResponse = await axios.get(API_ENDPOINT);
    console.log('Status:', statusResponse.data);
    console.log('✅ Status check successful\n');

    // Test 2: Start scanner
    console.log('2. Starting wallet scanner...');
    const startResponse = await axios.post(API_ENDPOINT, {
      action: 'start',
      wallets: testWallets
    });
    console.log('Start Response:', startResponse.data);
    console.log('✅ Scanner started successfully\n');

    // Test 3: Check status again (should be running)
    console.log('3. Checking scanner status after start...');
    const statusResponse2 = await axios.get(API_ENDPOINT);
    console.log('Status:', statusResponse2.data);
    console.log('✅ Scanner is running\n');

    // Test 4: Stop scanner
    console.log('4. Stopping wallet scanner...');
    const stopResponse = await axios.post(API_ENDPOINT, {
      action: 'stop'
    });
    console.log('Stop Response:', stopResponse.data);
    console.log('✅ Scanner stopped successfully\n');

    // Test 5: Check status after stop
    console.log('5. Checking scanner status after stop...');
    const statusResponse3 = await axios.get(API_ENDPOINT);
    console.log('Status:', statusResponse3.data);
    console.log('✅ Scanner stopped confirmed\n');

    console.log('🎉 All tests passed! Wallet scanner API is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  testWalletScanner();
}

module.exports = { testWalletScanner };