#!/usr/bin/env python3
"""
Test script for AI Pricing System - Trading Post
Demonstrates the complete AI photo analysis and pricing workflow
"""

import os
import json
import time
import requests
import asyncio
from pathlib import Path
import tempfile
from PIL import Image, ImageDraw, ImageFont

# Configuration
BASE_URL = "http://localhost:3000"
TEST_IMAGE_SIZE = (800, 600)

def create_test_image(item_type="electronics", filename="test_item.jpg"):
    """Create a test image with item simulation"""
    
    # Create a simple test image
    img = Image.new('RGB', TEST_IMAGE_SIZE, color='white')
    draw = ImageDraw.Draw(img)
    
    # Draw a simple representation based on item type
    if item_type == "electronics":
        # Draw a phone-like rectangle
        draw.rectangle([100, 150, 400, 450], fill='black', outline='gray', width=3)
        draw.rectangle([120, 170, 380, 350], fill='blue')
        draw.ellipse([180, 380, 220, 420], fill='gray')  # Home button
        draw.text((150, 250), "PHONE", fill='white')
        
    elif item_type == "furniture":
        # Draw a chair-like shape
        draw.rectangle([200, 200, 600, 400], fill='brown', outline='black', width=2)  # Seat
        draw.rectangle([190, 100, 220, 200], fill='brown', outline='black', width=2)  # Back leg
        draw.rectangle([580, 100, 610, 200], fill='brown', outline='black', width=2)  # Back leg
        draw.rectangle([190, 400, 220, 500], fill='brown', outline='black', width=2)  # Front leg
        draw.rectangle([580, 400, 610, 500], fill='brown', outline='black', width=2)  # Front leg
        draw.rectangle([200, 100, 600, 180], fill='brown', outline='black', width=2)  # Back
        
    elif item_type == "clothing":
        # Draw a t-shirt shape
        draw.polygon([(300, 150), (500, 150), (550, 200), (550, 450), 
                      (250, 450), (250, 200)], fill='red', outline='black')
        draw.rectangle([200, 150, 250, 250], fill='red', outline='black', width=2)  # Left sleeve
        draw.rectangle([550, 150, 600, 250], fill='red', outline='black', width=2)  # Right sleeve
        draw.ellipse([350, 120, 450, 180], fill='red', outline='black', width=2)  # Neck
        
    # Add some wear indicators for condition testing
    if "worn" in filename:
        # Add some scratches and wear marks
        draw.line([(50, 100), (100, 150)], fill='gray', width=2)
        draw.line([(700, 200), (750, 250)], fill='gray', width=2)
        draw.ellipse([600, 500, 620, 520], fill='gray')  # Stain
    
    # Save to temporary file
    temp_path = os.path.join(tempfile.gettempdir(), filename)
    img.save(temp_path, 'JPEG', quality=85)
    return temp_path


def test_server_health():
    """Test if the server is running"""
    print("🏥 Testing server health...")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Server is healthy")
            return True
        else:
            print(f"❌ Server health check failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot connect to server: {e}")
        print("💡 Make sure to start the server with: python app.py")
        return False


def test_photo_upload_and_analysis(image_path, item_description):
    """Test the complete photo analysis workflow"""
    print(f"\n📷 Testing photo analysis for: {item_description}")
    
    try:
        # Step 1: Upload photo for analysis
        print("  📤 Uploading photo...")
        with open(image_path, 'rb') as f:
            files = {'photo': f}
            response = requests.post(f"{BASE_URL}/api/items/analyze-photo", files=files)
        
        if response.status_code != 200:
            print(f"  ❌ Photo upload failed: {response.status_code} - {response.text}")
            return None
            
        upload_result = response.json()
        session_id = upload_result['session_id']
        print(f"  ✅ Photo uploaded successfully. Session ID: {session_id}")
        
        # Step 2: Poll for analysis completion
        print("  🤖 Waiting for AI analysis...")
        max_attempts = 30
        attempt = 0
        
        while attempt < max_attempts:
            time.sleep(2)  # Wait 2 seconds between polls
            attempt += 1
            
            response = requests.get(f"{BASE_URL}/api/items/ai-suggestions/{session_id}")
            
            if response.status_code == 200:
                # Analysis complete
                analysis_result = response.json()
                print("  ✅ AI analysis completed!")
                print_analysis_results(analysis_result)
                return analysis_result
                
            elif response.status_code == 202:
                # Still processing
                progress_info = response.json()
                print(f"  ⏳ Processing... ({progress_info.get('progress', 'In progress')})")
                continue
                
            else:
                print(f"  ❌ Analysis failed: {response.status_code} - {response.text}")
                return None
        
        print("  ⏰ Analysis timed out")
        return None
        
    except Exception as e:
        print(f"  ❌ Error during analysis: {e}")
        return None


def print_analysis_results(analysis_result):
    """Pretty print the analysis results"""
    print("\n  📊 AI Analysis Results:")
    print("  " + "="*50)
    
    # Item identification
    item_id = analysis_result.get('item_identification', {})
    print(f"  🏷️  Item: {item_id.get('name', 'Unknown')}")
    print(f"  📂  Category: {item_id.get('category', 'Unknown')}")
    if item_id.get('brand'):
        print(f"  🏢  Brand: {item_id['brand']}")
    print(f"  🎯  Confidence: {item_id.get('confidence', 0)*100:.1f}%")
    
    # Condition assessment
    condition = analysis_result.get('condition_assessment', {})
    print(f"\n  🔍  Condition: {condition.get('overall_condition', 'Unknown').replace('_', ' ').title()}")
    print(f"  📊  Condition Score: {condition.get('condition_score', 0)}/10")
    if condition.get('wear_indicators'):
        print(f"  ⚠️  Wear Signs: {', '.join(condition['wear_indicators'])}")
    
    # Price estimation
    pricing = analysis_result.get('price_estimation', {})
    print(f"\n  💰  Estimated Price: ${pricing.get('estimated_price', 0):.2f}")
    print(f"  📈  Price Range: ${pricing.get('price_range_min', 0):.2f} - ${pricing.get('price_range_max', 0):.2f}")
    print(f"  🎯  Pricing Confidence: {pricing.get('confidence', 0)*100:.1f}%")
    
    # AI suggestions
    suggestions = analysis_result.get('ai_suggestions', {})
    print(f"\n  💡  Suggested Title: {suggestions.get('suggested_title', 'N/A')}")
    print(f"  📝  Suggested Price: ${suggestions.get('suggested_price', '0')}")
    
    # Market data
    market_data = analysis_result.get('market_data', {})
    print(f"\n  📊  Market Average: ${market_data.get('average_price', 0):.2f}")
    print(f"  📈  Market Range: {market_data.get('price_range', 'N/A')}")
    print(f"  🔢  Data Points: {market_data.get('data_points', 0)} similar items")
    
    print(f"\n  ⚡  Processing Time: {analysis_result.get('processing_time', 0):.2f} seconds")
    print(f"  🎯  Overall Confidence: {analysis_result.get('confidence_score', 0)*100:.1f}%")


def test_listing_creation(analysis_result):
    """Test creating a listing from AI analysis"""
    print("\n📝 Testing listing creation from AI analysis...")
    
    try:
        ai_suggestions = analysis_result.get('ai_suggestions', {})
        
        listing_data = {
            "session_id": analysis_result['session_id'],
            "title": ai_suggestions.get('suggested_title', 'AI Generated Item'),
            "description": ai_suggestions.get('suggested_description', 'Description generated by AI'),
            "price": float(ai_suggestions.get('suggested_price', 50.0)),
            "category": ai_suggestions.get('suggested_category', 'Other'),
            "condition": ai_suggestions.get('suggested_condition', 'good'),
            "listing_type": "sale",
            "use_ai_suggestion": True
        }
        
        response = requests.post(f"{BASE_URL}/api/items/create-from-ai", json=listing_data)
        
        if response.status_code == 200:
            result = response.json()
            print("  ✅ Listing created successfully!")
            listing = result.get('listing', {})
            print(f"  📄  Listing ID: {listing.get('id', 'Unknown')}")
            print(f"  🏷️   Title: {listing.get('title', 'N/A')}")
            print(f"  💰  Price: ${listing.get('price', 0):.2f}")
            print(f"  📂  Category: {listing.get('category', 'N/A')}")
            return True
        else:
            print(f"  ❌ Listing creation failed: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"  ❌ Error creating listing: {e}")
        return False


def test_market_trends():
    """Test market trends API"""
    print("\n📈 Testing market trends API...")
    
    categories = ['electronics', 'furniture', 'clothing']
    
    for category in categories:
        try:
            response = requests.get(f"{BASE_URL}/api/items/market-trends/{category}")
            
            if response.status_code == 200:
                trends = response.json()
                print(f"  ✅ {category.title()} trends:")
                print(f"    📊 Price trend: {trends.get('average_price_trend', 'unknown')}")
                print(f"    📈 Price change: {trends.get('price_change_percent', 0):+.1f}%")
                print(f"    🛍️  Recent sales: {trends.get('recent_sales_count', 0)}")
                print(f"    ⏱️  Avg. days to sell: {trends.get('average_days_to_sell', 0)} days")
            else:
                print(f"  ❌ Failed to get {category} trends: {response.status_code}")
                
        except Exception as e:
            print(f"  ❌ Error getting {category} trends: {e}")


def test_usage_metrics():
    """Test usage metrics API"""
    print("\n📊 Testing usage metrics API...")
    
    try:
        response = requests.get(f"{BASE_URL}/api/items/usage-metrics")
        
        if response.status_code == 200:
            metrics = response.json()
            print("  ✅ Usage metrics retrieved:")
            print(f"    🔢 Total sessions: {metrics.get('total_sessions', 0)}")
            print(f"    💰 Total cost: ${metrics.get('total_cost_dollars', 0):.2f}")
            print(f"    ⏱️  Avg. processing time: {metrics.get('average_processing_time', 0):.2f}s")
            print(f"    📊 Metrics count: {metrics.get('metrics_count', 0)}")
        else:
            print(f"  ❌ Failed to get usage metrics: {response.status_code}")
            
    except Exception as e:
        print(f"  ❌ Error getting usage metrics: {e}")


def main():
    """Run comprehensive AI pricing system tests"""
    print("🚀 Trading Post AI Pricing System Test Suite")
    print("=" * 60)
    
    # Test server connectivity
    if not test_server_health():
        return
    
    # Test different item types
    test_items = [
        ("electronics", "iPhone 13 Pro", "test_iphone.jpg"),
        ("furniture", "Wooden Chair (Good Condition)", "test_chair.jpg"),
        ("clothing", "Red T-Shirt (Worn)", "test_tshirt_worn.jpg"),
    ]
    
    analysis_results = []
    
    print(f"\n📷 Creating test images and running analysis...")
    
    for item_type, description, filename in test_items:
        # Create test image
        image_path = create_test_image(item_type, filename)
        print(f"\n{'='*60}")
        print(f"Testing: {description}")
        print('='*60)
        
        # Test photo analysis
        result = test_photo_upload_and_analysis(image_path, description)
        if result:
            analysis_results.append(result)
            
            # Test listing creation
            test_listing_creation(result)
        
        # Clean up test image
        try:
            os.remove(image_path)
        except:
            pass
    
    # Test additional APIs
    print(f"\n{'='*60}")
    print("Testing Additional APIs")
    print('='*60)
    
    test_market_trends()
    test_usage_metrics()
    
    # Summary
    print(f"\n{'='*60}")
    print("🏁 Test Summary")
    print('='*60)
    print(f"✅ Analyzed {len(analysis_results)} items successfully")
    print(f"🤖 AI Pricing System is {'WORKING' if analysis_results else 'NOT WORKING'}")
    
    if analysis_results:
        avg_confidence = sum(r.get('confidence_score', 0) for r in analysis_results) / len(analysis_results)
        avg_processing_time = sum(r.get('processing_time', 0) for r in analysis_results) / len(analysis_results)
        print(f"📊 Average confidence score: {avg_confidence*100:.1f}%")
        print(f"⚡ Average processing time: {avg_processing_time:.2f} seconds")
        
        print("\n💡 Next steps:")
        print("  1. Connect to real OpenAI Vision API by setting OPENAI_API_KEY")
        print("  2. Integrate with real marketplace APIs for pricing data")
        print("  3. Connect to your existing listing database")
        print("  4. Add rate limiting and user authentication")
        print("  5. Implement image preprocessing optimizations")
    
    print(f"\n🎉 AI Pricing System testing completed!")


if __name__ == "__main__":
    main()