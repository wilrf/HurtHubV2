#!/usr/bin/env node
/**
 * Quick validation of vercel.json rewrite fix
 */

const BASE_URL = 'http://localhost:3007';

async function testEndpoint(name, url, expectedType) {
  try {
    console.log(`\n🧪 Testing ${name}...`);
    
    const response = await fetch(url);
    const status = response.status;
    const contentType = response.headers.get('content-type');
    const content = await response.text();
    
    console.log(`   Status: ${status}`);
    console.log(`   Content-Type: ${contentType}`);
    console.log(`   Content preview: ${content.substring(0, 100)}...`);
    
    if (expectedType === 'json') {
      if (content.startsWith('<!doctype html>')) {
        console.log('   ❌ ISSUE: Returns HTML instead of JSON');
        return false;
      }
      try {
        JSON.parse(content);
        console.log('   ✅ Valid JSON returned');
        return true;
      } catch {
        console.log('   ❌ ISSUE: Invalid JSON');
        return false;
      }
    } else if (expectedType === 'html') {
      if (content.includes('<!doctype html>')) {
        console.log('   ✅ HTML returned as expected');
        return true;
      } else {
        console.log('   ❌ ISSUE: Expected HTML, got something else');
        return false;
      }
    }
    
    return status === 200;
    
  } catch (error) {
    console.log(`   💥 Error: ${error.message}`);
    return false;
  }
}

async function runValidation() {
  console.log('🚀 Validating vercel.json Rewrite Fix');
  console.log(`📡 Testing against: ${BASE_URL}`);
  
  const results = [];
  
  // Test 1: manifest.json should return JSON (this was the main issue)
  results.push({
    name: 'manifest.json JSON fix',
    passed: await testEndpoint('manifest.json', `${BASE_URL}/manifest.json`, 'json')
  });
  
  // Test 2: improvedDemoData.json should return JSON if exists
  results.push({
    name: 'improvedDemoData.json',
    passed: await testEndpoint('improvedDemoData.json', `${BASE_URL}/improvedDemoData.json`, 'json')
  });
  
  // Test 3: Homepage should return HTML
  results.push({
    name: 'Homepage HTML serving',
    passed: await testEndpoint('Homepage', `${BASE_URL}/`, 'html')
  });
  
  // Test 4: Client-side route should return HTML (SPA routing)
  results.push({
    name: 'SPA routing',
    passed: await testEndpoint('SPA Route', `${BASE_URL}/business-intelligence`, 'html')
  });
  
  // Test 5: API endpoint (if working)
  results.push({
    name: 'API endpoints',
    passed: await testEndpoint('API', `${BASE_URL}/api/businesses?limit=1`, 'json')
  });
  
  // Test 6: Non-existent asset should 404
  console.log(`\n🧪 Testing Non-existent asset 404...`);
  try {
    const response = await fetch(`${BASE_URL}/assets/nonexistent.js`);
    if (response.status === 404) {
      console.log('   ✅ Non-existent asset returns 404');
      results.push({ name: '404 for missing assets', passed: true });
    } else {
      console.log(`   ❌ ISSUE: Non-existent asset returns ${response.status}, should be 404`);
      results.push({ name: '404 for missing assets', passed: false });
    }
  } catch (error) {
    console.log(`   💥 Error testing 404: ${error.message}`);
    results.push({ name: '404 for missing assets', passed: false });
  }
  
  // Generate Report
  console.log('\n' + '='.repeat(60));
  console.log('📊 VALIDATION RESULTS');
  console.log('='.repeat(60));
  
  let passed = 0;
  let total = results.length;
  
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.name}`);
    if (result.passed) passed++;
  });
  
  console.log('='.repeat(60));
  console.log(`📈 Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 ALL TESTS PASSED - vercel.json fix is working!');
  } else {
    console.log(`⚠️ ${total - passed} tests failed - Fix may need adjustment`);
  }
  
  // Specific analysis for the original issue
  const manifestTest = results.find(r => r.name === 'manifest.json JSON fix');
  if (manifestTest && manifestTest.passed) {
    console.log('\n✅ PRIMARY ISSUE RESOLVED: manifest.json now returns JSON instead of HTML');
    console.log('✅ This should eliminate Vite import analysis errors');
  } else {
    console.log('\n❌ PRIMARY ISSUE NOT RESOLVED: manifest.json still returns HTML');
  }
  
  return passed === total;
}

// Run validation
runValidation().catch(console.error);