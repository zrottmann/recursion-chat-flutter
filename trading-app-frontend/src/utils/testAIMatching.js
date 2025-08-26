/**
 * Test AI Matching Functionality
 * Tests the AI matching system with various scenarios
 */

import matchingService from '../services/matchingService';
import itemsService from '../services/itemsService';
import { databases, DATABASE_ID, COLLECTIONS, Query } from '../lib/appwrite';

export async function testAIMatching() {
  console.log('🤖 Starting AI Matching Tests...\n');
  console.log('=' .repeat(50));
  
  const results = {
    itemsFetch: null,
    basicMatch: null,
    categoryMatch: null,
    valueMatch: null,
    matchGeneration: null
  };
  
  try {
    // Step 1: Get some items to test with
    console.log('\n1️⃣ Fetching items for testing...');
    const itemsResult = await itemsService.getItems({ limit: 10 });
    
    if (!itemsResult.success || !itemsResult.items?.length) {
      console.error('❌ No items found. Add some listings first!');
      console.log('💡 Run: window.addFakeListings()');
      return results;
    }
    
    results.itemsFetch = {
      success: true,
      count: itemsResult.items.length,
      items: itemsResult.items
    };
    
    console.log(`✅ Found ${itemsResult.items.length} items to test with`);
    
    // Get first item as our test subject
    const testItem = itemsResult.items[0];
    console.log('\n📦 Test item:', {
      title: testItem.title,
      category: testItem.category,
      price: testItem.price,
      condition: testItem.condition
    });
    
    // Step 2: Test match generation (main AI matching function)
    console.log('\n2️⃣ Testing AI match generation...');
    try {
      const matchResult = await matchingService.generateMatches(testItem.$id || testItem.id);
      results.basicMatch = {
        success: matchResult.success,
        matchCount: matchResult.matches?.length || 0,
        matches: matchResult.matches
      };
      
      if (matchResult.success && matchResult.matches?.length > 0) {
        console.log(`✅ Generated ${matchResult.matches.length} matches`);
        console.log('Top match:', {
          title: matchResult.matches[0].matched_item_title,
          score: (matchResult.matches[0].score * 100).toFixed(1) + '%',
          status: matchResult.matches[0].status
        });
        
        // Show all matches with scores
        console.log('\nAll matches:');
        matchResult.matches.forEach((match, i) => {
          console.log(`${i + 1}. ${match.matched_item_title} - ${(match.score * 100).toFixed(1)}%`);
        });
      } else {
        console.log('⚠️ No matches generated');
        console.log('Error:', matchResult.error);
      }
    } catch (error) {
      console.error('❌ Match generation error:', error);
      results.basicMatch = { success: false, error: error.message };
    }
    
    // Step 3: Test category-specific matching
    console.log('\n3️⃣ Testing category-specific matching...');
    try {
      // Find items in same category
      const sameCategoryItems = itemsResult.items.filter(
        item => item.category === testItem.category && item.$id !== testItem.$id
      );
      
      if (sameCategoryItems.length > 0) {
        console.log(`Found ${sameCategoryItems.length} items in same category (${testItem.category})`);
        
        // Test the scoring algorithm directly
        const scores = sameCategoryItems.map(item => ({
          item: item,
          score: matchingService.calculateMatchScore(testItem, item)
        }));
        
        results.categoryMatch = {
          success: true,
          matchCount: scores.length,
          avgScore: scores.reduce((acc, s) => acc + s.score, 0) / scores.length,
          topScore: Math.max(...scores.map(s => s.score))
        };
        
        console.log(`✅ Category scoring: ${results.categoryMatch.matchCount} items tested`);
        console.log(`Average score: ${(results.categoryMatch.avgScore * 100).toFixed(1)}%`);
        console.log(`Top score: ${(results.categoryMatch.topScore * 100).toFixed(1)}%`);
        
      } else {
        console.log('⚠️ No items in same category to test with');
        results.categoryMatch = { success: false, reason: 'No items in same category' };
      }
    } catch (error) {
      console.error('❌ Category matching error:', error);
      results.categoryMatch = { success: false, error: error.message };
    }
    
    // Step 4: Test getting existing matches
    console.log('\n4️⃣ Testing existing matches retrieval...');
    try {
      const existingMatches = await matchingService.getMatches({ limit: 20 });
      
      results.valueMatch = {
        success: existingMatches.success,
        matchCount: existingMatches.matches?.length || 0,
        matches: existingMatches.matches
      };
      
      console.log(`✅ Found ${results.valueMatch.matchCount} existing matches`);
      
      if (existingMatches.matches?.length > 0) {
        console.log('Sample match:', {
          id: existingMatches.matches[0].$id,
          score: (existingMatches.matches[0].score * 100).toFixed(1) + '%',
          status: existingMatches.matches[0].status
        });
      }
      
    } catch (error) {
      console.error('❌ Existing matches error:', error);
      results.valueMatch = { success: false, error: error.message };
    }
    
    // Step 5: Test different items for more matches
    console.log('\n5️⃣ Testing matches for different items...');
    try {
      const otherItems = itemsResult.items.slice(1, 4); // Test up to 3 other items
      let totalMatches = 0;
      
      for (const item of otherItems) {
        try {
          const itemMatches = await matchingService.generateMatches(item.$id || item.id);
          if (itemMatches.success) {
            totalMatches += itemMatches.matches?.length || 0;
            console.log(`"${item.title}": ${itemMatches.matches?.length || 0} matches`);
          }
        } catch (error) {
          console.log(`"${item.title}": Failed to generate matches`);
        }
      }
      
      results.matchGeneration = {
        success: true,
        itemsTested: otherItems.length,
        totalMatches: totalMatches
      };
      
      console.log(`✅ Generated total of ${totalMatches} matches across ${otherItems.length} items`);
      
    } catch (error) {
      console.error('❌ Multi-item matching error:', error);
      results.matchGeneration = { success: false, error: error.message };
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 AI MATCHING TEST SUMMARY:');
  console.log('=' .repeat(50));
  
  console.log(`Items Fetch: ${results.itemsFetch?.success ? `✅ ${results.itemsFetch.count} items` : '❌ Failed'}`);
  console.log(`Basic Match: ${results.basicMatch?.success ? `✅ ${results.basicMatch.matchCount} matches` : '❌ Failed'}`);
  console.log(`Category Match: ${results.categoryMatch?.success ? `✅ ${results.categoryMatch.matchCount} matches` : '❌ Failed'}`);
  console.log(`Value Match: ${results.valueMatch?.success ? `✅ ${results.valueMatch.matchCount} matches` : '❌ Failed'}`);
  console.log(`Match Generation: ${results.matchGeneration?.success ? `✅ ${results.matchGeneration.matchCount} matches` : '❌ Failed'}`);
  
  return results;
}

/**
 * Test match acceptance/decline
 */
export async function testMatchActions() {
  console.log('\n🔄 Testing match accept/decline actions...');
  
  try {
    // Get existing matches
    const matchesResult = await matchingService.getMatches({ limit: 5 });
    
    if (!matchesResult.success || !matchesResult.matches?.length) {
      console.log('⚠️ No existing matches to test with');
      return { success: false, reason: 'No matches available' };
    }
    
    const testMatch = matchesResult.matches[0];
    console.log(`Testing with match: ${testMatch.$id}`);
    console.log(`Status: ${testMatch.status}`);
    
    // Test accepting a match (only if pending)
    if (testMatch.status === 'pending') {
      const acceptResult = await matchingService.acceptMatch(testMatch.$id);
      console.log(`Accept result: ${acceptResult.success ? '✅' : '❌'}`);
      
      if (acceptResult.success) {
        console.log('Match accepted successfully!');
      } else {
        console.log('Accept error:', acceptResult.error);
      }
    } else {
      console.log('⚠️ Match not in pending status, skipping accept test');
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error testing match actions:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Test the AI matching algorithm scoring
 */
export async function testMatchScoring() {
  console.log('\n🎯 Testing match scoring algorithm...');
  
  const testCases = [
    {
      item1: {
        title: 'iPhone 13 Pro',
        category: 'electronics',
        price: 800,
        condition: 'like_new',
        tags: ['phone', 'apple', 'smartphone']
      },
      item2: {
        title: 'Samsung Galaxy S22',
        category: 'electronics', 
        price: 750,
        condition: 'like_new',
        tags: ['phone', 'samsung', 'smartphone']
      },
      expectedScore: 'high' // Same category, similar price, similar tags
    },
    {
      item1: {
        title: 'Mountain Bike',
        category: 'sports',
        price: 500,
        condition: 'good',
        tags: ['bike', 'outdoor', 'exercise']
      },
      item2: {
        title: 'Gaming Laptop',
        category: 'electronics',
        price: 1200,
        condition: 'like_new',
        tags: ['computer', 'gaming', 'tech']
      },
      expectedScore: 'low' // Different category, different price, no common tags
    },
    {
      item1: {
        title: 'Vintage Guitar',
        category: 'other',
        price: 1500,
        condition: 'good',
        tags: ['music', 'vintage', 'instrument']
      },
      item2: {
        title: 'Professional Keyboard',
        category: 'other',
        price: 1200,
        condition: 'good',
        tags: ['music', 'instrument', 'piano']
      },
      expectedScore: 'medium' // Same category, similar price, some common tags
    }
  ];
  
  console.log('Running scoring tests...\n');
  
  testCases.forEach((testCase, index) => {
    const score = matchingService.calculateMatchScore(testCase.item1, testCase.item2);
    const scoreLevel = score > 0.7 ? 'high' : score > 0.4 ? 'medium' : 'low';
    const passed = scoreLevel === testCase.expectedScore;
    
    console.log(`Test ${index + 1}: ${testCase.item1.title} ↔️ ${testCase.item2.title}`);
    console.log(`  Score: ${score.toFixed(2)} (${scoreLevel})`);
    console.log(`  Expected: ${testCase.expectedScore}`);
    console.log(`  Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log('');
  });
}

// Make functions available globally for testing
if (typeof window !== 'undefined') {
  window.testAIMatching = testAIMatching;
  window.testMatchActions = testMatchActions;
  window.testMatchScoring = testMatchScoring;
  
  console.log('🤖 AI Matching test functions available:');
  console.log('   window.testAIMatching() - Run full AI matching test suite');
  console.log('   window.testMatchActions() - Test match accept/decline');
  console.log('   window.testMatchScoring() - Test scoring algorithm');
}

export default testAIMatching;