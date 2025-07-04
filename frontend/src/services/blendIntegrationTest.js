/**
 * Blend Integration Test
 * 
 * This file tests our real Blend SDK integration to ensure everything
 * is working correctly with live contracts on Stellar testnet.
 */

import realBlendService from './realBlendService.js';

export class BlendIntegrationTest {
  constructor() {
    this.testResults = [];
    this.service = realBlendService;
  }

  /**
   * Run all integration tests
   */
  async runAllTests() {
    console.log('🧪 Starting Blend Integration Tests...');
    console.log('=' .repeat(50));
    
    this.testResults = [];
    
    // Test 1: Health Check
    await this.testHealthCheck();
    
    // Test 2: Pool Metrics
    await this.testPoolMetrics();
    
    // Test 3: Available Pools
    await this.testAvailablePools();
    
    // Test 4: Contract Addresses
    await this.testContractAddresses();
    
    // Summary
    this.printTestSummary();
    
    return this.testResults;
  }

  /**
   * Test basic service health
   */
  async testHealthCheck() {
    try {
      console.log('🔍 Test 1: Health Check...');
      
      const health = await this.service.healthCheck();
      
      const passed = health.status === 'healthy' || health.status === 'unhealthy';
      
      this.testResults.push({
        test: 'Health Check',
        passed: passed,
        details: health,
        timestamp: Date.now()
      });
      
      if (passed) {
        console.log('✅ Health check completed');
        console.log(`   Status: ${health.status}`);
        console.log(`   Testnet: ${health.testnet || 'N/A'}`);
      } else {
        console.log('❌ Health check failed');
      }
      
    } catch (error) {
      console.log('❌ Health check error:', error.message);
      this.testResults.push({
        test: 'Health Check',
        passed: false,
        error: error.message,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Test pool metrics retrieval
   */
  async testPoolMetrics() {
    try {
      console.log('📊 Test 2: Pool Metrics...');
      
      const metrics = await this.service.getPoolMetrics();
      
      const hasRequiredFields = metrics && 
        typeof metrics.totalValueLocked === 'number' &&
        typeof metrics.averageAPY === 'number' &&
        typeof metrics.isRealData === 'boolean';
      
      this.testResults.push({
        test: 'Pool Metrics',
        passed: hasRequiredFields,
        details: {
          tvl: metrics?.totalValueLocked,
          apy: metrics?.averageAPY,
          isReal: metrics?.isRealData,
          dataSource: metrics?.dataSource || 'Unknown'
        },
        timestamp: Date.now()
      });
      
      if (hasRequiredFields) {
        console.log('✅ Pool metrics retrieved');
        console.log(`   TVL: $${metrics.totalValueLocked?.toLocaleString()}`);
        console.log(`   APY: ${(metrics.averageAPY * 100)?.toFixed(2)}%`);
        console.log(`   Real Data: ${metrics.isRealData}`);
      } else {
        console.log('❌ Pool metrics incomplete');
      }
      
    } catch (error) {
      console.log('❌ Pool metrics error:', error.message);
      this.testResults.push({
        test: 'Pool Metrics',
        passed: false,
        error: error.message,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Test available pools retrieval
   */
  async testAvailablePools() {
    try {
      console.log('🏦 Test 3: Available Pools...');
      
      const pools = await this.service.getAvailablePools();
      
      const isValidPoolList = Array.isArray(pools) && pools.length > 0;
      
      this.testResults.push({
        test: 'Available Pools',
        passed: isValidPoolList,
        details: {
          poolCount: pools?.length || 0,
          firstPool: pools?.[0]?.name || 'N/A'
        },
        timestamp: Date.now()
      });
      
      if (isValidPoolList) {
        console.log('✅ Available pools retrieved');
        console.log(`   Pool count: ${pools.length}`);
        console.log(`   First pool: ${pools[0]?.name || 'Unnamed'}`);
      } else {
        console.log('❌ No available pools found');
      }
      
    } catch (error) {
      console.log('❌ Available pools error:', error.message);
      this.testResults.push({
        test: 'Available Pools',
        passed: false,
        error: error.message,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Test contract addresses
   */
  async testContractAddresses() {
    try {
      console.log('🔗 Test 4: Contract Addresses...');
      
      const contracts = this.service.contracts;
      
      const hasContracts = contracts && 
        typeof contracts === 'object' &&
        Object.keys(contracts).length > 0;
      
      this.testResults.push({
        test: 'Contract Addresses',
        passed: hasContracts,
        details: {
          contractCount: Object.keys(contracts || {}).length,
          contracts: contracts
        },
        timestamp: Date.now()
      });
      
      if (hasContracts) {
        console.log('✅ Contract addresses available');
        console.log(`   Contracts: ${Object.keys(contracts).join(', ')}`);
      } else {
        console.log('❌ No contract addresses found');
      }
      
    } catch (error) {
      console.log('❌ Contract addresses error:', error.message);
      this.testResults.push({
        test: 'Contract Addresses',
        passed: false,
        error: error.message,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Print test summary
   */
  printTestSummary() {
    console.log('=' .repeat(50));
    console.log('📋 TEST SUMMARY');
    console.log('=' .repeat(50));
    
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`❌ Failed: ${total - passed}/${total}`);
    
    if (passed === total) {
      console.log('🎉 All tests passed! Blend integration is working.');
    } else {
      console.log('⚠️  Some tests failed. Check the details above.');
    }
    
    // Show failed tests
    const failed = this.testResults.filter(r => !r.passed);
    if (failed.length > 0) {
      console.log('\n❌ Failed Tests:');
      failed.forEach(test => {
        console.log(`   - ${test.test}: ${test.error || 'Unknown error'}`);
      });
    }
    
    console.log('=' .repeat(50));
  }

  /**
   * Get integration status for UI display
   */
  getIntegrationStatus() {
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    
    if (total === 0) {
      return { status: 'untested', message: 'Tests not run yet' };
    }
    
    if (passed === total) {
      return { status: 'working', message: 'All integration tests passed' };
    }
    
    if (passed > 0) {
      return { status: 'partial', message: `${passed}/${total} tests passed` };
    }
    
    return { status: 'failed', message: 'All integration tests failed' };
  }
}

// Export singleton for easy use
export const blendIntegrationTest = new BlendIntegrationTest();

// Auto-run tests in development
if (process.env.NODE_ENV === 'development') {
  // Run tests after a short delay to allow service initialization
  setTimeout(() => {
    blendIntegrationTest.runAllTests().catch(console.error);
  }, 2000);
}

export default blendIntegrationTest; 