#!/usr/bin/env python3
"""
Real-time Market Data Integration for Trading Post
Fetches live pricing data from multiple sources for price validation and market analysis
"""

import asyncio
import aiohttp
import json
import logging
import math
import os
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import sqlite3
import hashlib
import re
from urllib.parse import quote_plus

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MarketDataSource(Enum):
    """Market data sources"""
    EBAY_COMPLETED = "ebay_completed"
    EBAY_ACTIVE = "ebay_active"
    AMAZON_CURRENT = "amazon_current"
    FACEBOOK_MARKETPLACE = "facebook_marketplace"
    MERCARI = "mercari"
    POSHMARK = "poshmark"
    REVERB = "reverb"  # For musical instruments
    DISCOGS = "discogs"  # For vinyl records
    TCGPLAYER = "tcgplayer"  # For trading cards


@dataclass
class MarketListing:
    """Individual market listing data"""
    source: MarketDataSource
    title: str
    price: float
    condition: str
    sold_date: Optional[datetime] = None
    listing_url: Optional[str] = None
    seller_rating: Optional[float] = None
    shipping_cost: Optional[float] = None
    item_specifics: Dict[str, str] = None
    confidence_score: float = 0.5
    
    def __post_init__(self):
        if self.item_specifics is None:
            self.item_specifics = {}


@dataclass
class MarketDataSummary:
    """Summary of market data for an item"""
    item_query: str
    category: str
    total_listings: int
    
    # Price statistics
    avg_price: float
    median_price: float
    min_price: float
    max_price: float
    price_std_dev: float
    
    # Market insights
    market_velocity: float  # How quickly items sell
    price_trend: str  # 'increasing', 'decreasing', 'stable'
    confidence_level: float
    
    # Data freshness
    last_updated: datetime
    data_age_hours: float
    
    # Source breakdown
    listings_by_source: Dict[str, int]
    avg_price_by_source: Dict[str, float]
    
    # Condition analysis
    condition_distribution: Dict[str, int]
    condition_price_impact: Dict[str, float]


class EbayDataFetcher:
    """Fetcher for eBay market data"""
    
    def __init__(self):
        self.app_id = os.getenv("EBAY_APP_ID", "")
        self.base_url = "https://svcs.ebay.com/services/search/FindingService/v1"
        self.session = None
        self.rate_limit_delay = 1.0  # Seconds between requests
        self.last_request_time = 0
    
    async def _get_session(self):
        """Get or create aiohttp session"""
        if not self.session:
            self.session = aiohttp.ClientSession()
        return self.session
    
    async def _rate_limit(self):
        """Enforce rate limiting"""
        now = time.time()
        time_since_last = now - self.last_request_time
        if time_since_last < self.rate_limit_delay:
            await asyncio.sleep(self.rate_limit_delay - time_since_last)
        self.last_request_time = time.time()
    
    async def fetch_completed_listings(self, query: str, category: str = "") -> List[MarketListing]:
        """Fetch completed/sold listings from eBay"""
        try:
            await self._rate_limit()
            session = await self._get_session()
            
            params = {
                'OPERATION-NAME': 'findCompletedItems',
                'SERVICE-VERSION': '1.0.0',
                'SECURITY-APPNAME': self.app_id,
                'RESPONSE-DATA-FORMAT': 'JSON',
                'REST-PAYLOAD': '',
                'keywords': query,
                'itemFilter(0).name': 'SoldItemsOnly',
                'itemFilter(0).value': 'true',
                'itemFilter(1).name': 'ListingType',
                'itemFilter(1).value': 'FixedPrice',
                'sortOrder': 'EndTimeSoonest',
                'paginationInput.entriesPerPage': '100'
            }
            
            async with session.get(self.base_url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return self._parse_ebay_response(data, MarketDataSource.EBAY_COMPLETED)
                else:
                    logger.warning(f"eBay API error: {response.status}")
                    return []
                    
        except Exception as e:
            logger.error(f"Error fetching eBay completed listings: {e}")
            return []
    
    async def fetch_active_listings(self, query: str, category: str = "") -> List[MarketListing]:
        """Fetch active listings from eBay"""
        try:
            await self._rate_limit()
            session = await self._get_session()
            
            params = {
                'OPERATION-NAME': 'findItemsByKeywords',
                'SERVICE-VERSION': '1.0.0',
                'SECURITY-APPNAME': self.app_id,
                'RESPONSE-DATA-FORMAT': 'JSON',
                'REST-PAYLOAD': '',
                'keywords': query,
                'itemFilter(0).name': 'ListingType',
                'itemFilter(0).value': 'FixedPrice',
                'sortOrder': 'PricePlusShippingLowest',
                'paginationInput.entriesPerPage': '100'
            }
            
            async with session.get(self.base_url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return self._parse_ebay_response(data, MarketDataSource.EBAY_ACTIVE)
                else:
                    logger.warning(f"eBay API error: {response.status}")
                    return []
                    
        except Exception as e:
            logger.error(f"Error fetching eBay active listings: {e}")
            return []
    
    def _parse_ebay_response(self, data: Dict, source: MarketDataSource) -> List[MarketListing]:
        """Parse eBay API response"""
        listings = []
        
        try:
            search_result = data.get('findCompletedItemsResponse', data.get('findItemsByKeywordsResponse', [{}]))[0]
            items = search_result.get('searchResult', [{}])[0].get('item', [])
            
            for item in items:
                try:
                    title = item.get('title', [''])[0]
                    price_info = item.get('sellingStatus', [{}])[0]
                    price = float(price_info.get('currentPrice', [{'@value': '0'}])[0]['@value'])
                    
                    # Extract condition
                    condition = item.get('condition', [{'conditionDisplayName': ['Used']}])[0].get('conditionDisplayName', ['Used'])[0]
                    
                    # Extract end time for sold items
                    sold_date = None
                    if source == MarketDataSource.EBAY_COMPLETED:
                        end_time = item.get('listingInfo', [{}])[0].get('endTime', [''])[0]
                        if end_time:
                            sold_date = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
                    
                    # Extract item specifics
                    item_specifics = {}
                    specifics = item.get('itemAttribute', [])
                    for specific in specifics:
                        name = specific.get('name', [''])[0]
                        value = specific.get('value', [''])[0]
                        if name and value:
                            item_specifics[name] = value
                    
                    listing = MarketListing(
                        source=source,
                        title=title,
                        price=price,
                        condition=condition,
                        sold_date=sold_date,
                        listing_url=item.get('viewItemURL', [''])[0],
                        item_specifics=item_specifics,
                        confidence_score=0.8  # High confidence for eBay data
                    )
                    
                    listings.append(listing)
                    
                except (KeyError, ValueError, IndexError) as e:
                    logger.warning(f"Error parsing eBay item: {e}")
                    continue
            
        except Exception as e:
            logger.error(f"Error parsing eBay response: {e}")
        
        return listings
    
    async def close(self):
        """Close the session"""
        if self.session:
            await self.session.close()


class AmazonDataFetcher:
    """Fetcher for Amazon pricing data (via web scraping - simplified)"""
    
    def __init__(self):
        self.session = None
        self.rate_limit_delay = 2.0  # More conservative for scraping
        self.last_request_time = 0
        
        # Headers to mimic real browser
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        }
    
    async def fetch_amazon_prices(self, query: str, category: str = "") -> List[MarketListing]:
        """Fetch Amazon pricing data (simplified implementation)"""
        try:
            # Note: This is a simplified implementation
            # In production, you'd want to use Amazon's Product Advertising API
            # or a service like RainforestAPI, Keepa, etc.
            
            await asyncio.sleep(self.rate_limit_delay)  # Rate limiting
            
            # For now, return mock data
            # TODO: Implement actual Amazon data fetching
            return self._generate_mock_amazon_data(query)
            
        except Exception as e:
            logger.error(f"Error fetching Amazon data: {e}")
            return []
    
    def _generate_mock_amazon_data(self, query: str) -> List[MarketListing]:
        """Generate mock Amazon data for demonstration"""
        # This would be replaced with actual Amazon API integration
        base_price = 100.0  # This would come from real data
        
        return [
            MarketListing(
                source=MarketDataSource.AMAZON_CURRENT,
                title=f"Amazon listing for {query}",
                price=base_price * 0.9,
                condition="New",
                confidence_score=0.7
            ),
            MarketListing(
                source=MarketDataSource.AMAZON_CURRENT,
                title=f"Amazon listing for {query} - Used",
                price=base_price * 0.7,
                condition="Used - Good",
                confidence_score=0.7
            )
        ]


class MarketDataAggregator:
    """Aggregates market data from multiple sources"""
    
    def __init__(self):
        self.ebay_fetcher = EbayDataFetcher()
        self.amazon_fetcher = AmazonDataFetcher()
        self.db_path = "trading_post.db"
        self._initialize_database()
        
        # Cache settings
        self.cache_duration_hours = 2
        self.min_listings_for_confidence = 5
    
    def _initialize_database(self):
        """Initialize market data database tables"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Market listings table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS market_listings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    query_hash TEXT NOT NULL,
                    source TEXT NOT NULL,
                    title TEXT NOT NULL,
                    price REAL NOT NULL,
                    condition TEXT,
                    sold_date TIMESTAMP,
                    listing_url TEXT,
                    seller_rating REAL,
                    shipping_cost REAL,
                    item_specifics TEXT,
                    confidence_score REAL DEFAULT 0.5,
                    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Market data summaries table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS market_data_summaries (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    query_hash TEXT UNIQUE NOT NULL,
                    item_query TEXT NOT NULL,
                    category TEXT,
                    total_listings INTEGER,
                    avg_price REAL,
                    median_price REAL,
                    min_price REAL,
                    max_price REAL,
                    price_std_dev REAL,
                    market_velocity REAL,
                    price_trend TEXT,
                    confidence_level REAL,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    data_age_hours REAL,
                    listings_by_source TEXT,
                    avg_price_by_source TEXT,
                    condition_distribution TEXT,
                    condition_price_impact TEXT
                )
            """)
            
            # Price history table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS price_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    query_hash TEXT NOT NULL,
                    avg_price REAL NOT NULL,
                    median_price REAL NOT NULL,
                    total_listings INTEGER NOT NULL,
                    confidence_level REAL NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            conn.commit()
            conn.close()
            
            logger.info("Market data database initialized")
            
        except Exception as e:
            logger.error(f"Database initialization failed: {e}")
    
    def _generate_query_hash(self, query: str, category: str = "") -> str:
        """Generate hash for query caching"""
        combined = f"{query.lower().strip()}:{category.lower().strip()}"
        return hashlib.md5(combined.encode()).hexdigest()
    
    async def get_market_data(self, item_query: str, category: str = "", 
                            force_refresh: bool = False) -> MarketDataSummary:
        """Get comprehensive market data for an item"""
        try:
            query_hash = self._generate_query_hash(item_query, category)
            
            # Check cache first
            if not force_refresh:
                cached_summary = self._get_cached_summary(query_hash)
                if cached_summary and cached_summary.data_age_hours < self.cache_duration_hours:
                    logger.info(f"Using cached market data for: {item_query}")
                    return cached_summary
            
            # Fetch fresh data
            logger.info(f"Fetching fresh market data for: {item_query}")
            
            # Gather data from all sources concurrently
            tasks = [
                self.ebay_fetcher.fetch_completed_listings(item_query, category),
                self.ebay_fetcher.fetch_active_listings(item_query, category),
                self.amazon_fetcher.fetch_amazon_prices(item_query, category)
            ]
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Combine all listings
            all_listings = []
            for result in results:
                if isinstance(result, list):
                    all_listings.extend(result)
                elif isinstance(result, Exception):
                    logger.warning(f"Data fetching error: {result}")
            
            # Store listings in database
            await self._store_listings(query_hash, all_listings)
            
            # Generate summary
            summary = self._generate_summary(item_query, category, query_hash, all_listings)
            
            # Store summary
            await self._store_summary(summary)
            
            # Store price history
            await self._store_price_history(query_hash, summary)
            
            return summary
            
        except Exception as e:
            logger.error(f"Error getting market data: {e}")
            # Return fallback summary
            return MarketDataSummary(
                item_query=item_query,
                category=category,
                total_listings=0,
                avg_price=0.0,
                median_price=0.0,
                min_price=0.0,
                max_price=0.0,
                price_std_dev=0.0,
                market_velocity=0.0,
                price_trend="unknown",
                confidence_level=0.0,
                last_updated=datetime.utcnow(),
                data_age_hours=0.0,
                listings_by_source={},
                avg_price_by_source={},
                condition_distribution={},
                condition_price_impact={}
            )
    
    def _get_cached_summary(self, query_hash: str) -> Optional[MarketDataSummary]:
        """Get cached market data summary"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT * FROM market_data_summaries WHERE query_hash = ?
            """, (query_hash,))
            
            row = cursor.fetchone()
            conn.close()
            
            if not row:
                return None
            
            # Calculate data age
            last_updated = datetime.fromisoformat(row[12])
            data_age_hours = (datetime.utcnow() - last_updated).total_seconds() / 3600
            
            return MarketDataSummary(
                item_query=row[2],
                category=row[3] or "",
                total_listings=row[4],
                avg_price=row[5],
                median_price=row[6],
                min_price=row[7],
                max_price=row[8],
                price_std_dev=row[9],
                market_velocity=row[10],
                price_trend=row[11],
                confidence_level=row[13],
                last_updated=last_updated,
                data_age_hours=data_age_hours,
                listings_by_source=json.loads(row[15]) if row[15] else {},
                avg_price_by_source=json.loads(row[16]) if row[16] else {},
                condition_distribution=json.loads(row[17]) if row[17] else {},
                condition_price_impact=json.loads(row[18]) if row[18] else {}
            )
            
        except Exception as e:
            logger.error(f"Error getting cached summary: {e}")
            return None
    
    async def _store_listings(self, query_hash: str, listings: List[MarketListing]):
        """Store market listings in database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Clear old listings for this query
            cursor.execute("""
                DELETE FROM market_listings WHERE query_hash = ?
            """, (query_hash,))
            
            # Insert new listings
            for listing in listings:
                cursor.execute("""
                    INSERT INTO market_listings 
                    (query_hash, source, title, price, condition, sold_date, 
                     listing_url, seller_rating, shipping_cost, item_specifics, confidence_score)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    query_hash,
                    listing.source.value,
                    listing.title,
                    listing.price,
                    listing.condition,
                    listing.sold_date.isoformat() if listing.sold_date else None,
                    listing.listing_url,
                    listing.seller_rating,
                    listing.shipping_cost,
                    json.dumps(listing.item_specifics),
                    listing.confidence_score
                ))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Error storing listings: {e}")
    
    def _generate_summary(self, item_query: str, category: str, 
                         query_hash: str, listings: List[MarketListing]) -> MarketDataSummary:
        """Generate market data summary from listings"""
        try:
            if not listings:
                return MarketDataSummary(
                    item_query=item_query,
                    category=category,
                    total_listings=0,
                    avg_price=0.0,
                    median_price=0.0,
                    min_price=0.0,
                    max_price=0.0,
                    price_std_dev=0.0,
                    market_velocity=0.0,
                    price_trend="unknown",
                    confidence_level=0.0,
                    last_updated=datetime.utcnow(),
                    data_age_hours=0.0,
                    listings_by_source={},
                    avg_price_by_source={},
                    condition_distribution={},
                    condition_price_impact={}
                )
            
            # Price statistics
            prices = [listing.price for listing in listings if listing.price > 0]
            prices.sort()
            
            avg_price = sum(prices) / len(prices) if prices else 0.0
            median_price = prices[len(prices) // 2] if prices else 0.0
            min_price = min(prices) if prices else 0.0
            max_price = max(prices) if prices else 0.0
            
            # Standard deviation
            if len(prices) > 1:
                variance = sum((p - avg_price) ** 2 for p in prices) / len(prices)
                price_std_dev = math.sqrt(variance)
            else:
                price_std_dev = 0.0
            
            # Source breakdown
            listings_by_source = {}
            price_by_source = {}
            
            for listing in listings:
                source = listing.source.value
                listings_by_source[source] = listings_by_source.get(source, 0) + 1
                
                if source not in price_by_source:
                    price_by_source[source] = []
                price_by_source[source].append(listing.price)
            
            avg_price_by_source = {
                source: sum(prices) / len(prices) if prices else 0.0
                for source, prices in price_by_source.items()
            }
            
            # Condition analysis
            condition_distribution = {}
            condition_prices = {}
            
            for listing in listings:
                condition = listing.condition or "Unknown"
                condition_distribution[condition] = condition_distribution.get(condition, 0) + 1
                
                if condition not in condition_prices:
                    condition_prices[condition] = []
                condition_prices[condition].append(listing.price)
            
            condition_price_impact = {}
            for condition, prices in condition_prices.items():
                if prices:
                    condition_avg = sum(prices) / len(prices)
                    condition_price_impact[condition] = condition_avg / avg_price if avg_price > 0 else 1.0
            
            # Market velocity (simplified)
            sold_listings = [l for l in listings if l.sold_date]
            if sold_listings:
                recent_sold = len([l for l in sold_listings 
                                 if l.sold_date and l.sold_date > datetime.utcnow() - timedelta(days=7)])
                market_velocity = recent_sold / len(sold_listings)
            else:
                market_velocity = 0.0
            
            # Price trend (simplified)
            price_trend = "stable"
            if len(prices) >= 10:
                first_half_avg = sum(prices[:len(prices)//2]) / (len(prices)//2)
                second_half_avg = sum(prices[len(prices)//2:]) / (len(prices) - len(prices)//2)
                
                change_percent = (second_half_avg - first_half_avg) / first_half_avg * 100
                
                if change_percent > 5:
                    price_trend = "increasing"
                elif change_percent < -5:
                    price_trend = "decreasing"
            
            # Confidence level
            confidence_level = min(1.0, len(listings) / self.min_listings_for_confidence)
            if len(set(l.source for l in listings)) > 1:
                confidence_level *= 1.2  # Boost for multiple sources
            confidence_level = min(1.0, confidence_level)
            
            return MarketDataSummary(
                item_query=item_query,
                category=category,
                total_listings=len(listings),
                avg_price=avg_price,
                median_price=median_price,
                min_price=min_price,
                max_price=max_price,
                price_std_dev=price_std_dev,
                market_velocity=market_velocity,
                price_trend=price_trend,
                confidence_level=confidence_level,
                last_updated=datetime.utcnow(),
                data_age_hours=0.0,
                listings_by_source=listings_by_source,
                avg_price_by_source=avg_price_by_source,
                condition_distribution=condition_distribution,
                condition_price_impact=condition_price_impact
            )
            
        except Exception as e:
            logger.error(f"Error generating summary: {e}")
            # Return minimal summary on error
            return MarketDataSummary(
                item_query=item_query,
                category=category,
                total_listings=len(listings),
                avg_price=0.0,
                median_price=0.0,
                min_price=0.0,
                max_price=0.0,
                price_std_dev=0.0,
                market_velocity=0.0,
                price_trend="unknown",
                confidence_level=0.0,
                last_updated=datetime.utcnow(),
                data_age_hours=0.0,
                listings_by_source={},
                avg_price_by_source={},
                condition_distribution={},
                condition_price_impact={}
            )
    
    async def _store_summary(self, summary: MarketDataSummary):
        """Store market data summary"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            query_hash = self._generate_query_hash(summary.item_query, summary.category)
            
            cursor.execute("""
                INSERT OR REPLACE INTO market_data_summaries 
                (query_hash, item_query, category, total_listings, avg_price, median_price,
                 min_price, max_price, price_std_dev, market_velocity, price_trend,
                 confidence_level, data_age_hours, listings_by_source, avg_price_by_source,
                 condition_distribution, condition_price_impact)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                query_hash,
                summary.item_query,
                summary.category,
                summary.total_listings,
                summary.avg_price,
                summary.median_price,
                summary.min_price,
                summary.max_price,
                summary.price_std_dev,
                summary.market_velocity,
                summary.price_trend,
                summary.confidence_level,
                summary.data_age_hours,
                json.dumps(summary.listings_by_source),
                json.dumps(summary.avg_price_by_source),
                json.dumps(summary.condition_distribution),
                json.dumps(summary.condition_price_impact)
            ))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Error storing summary: {e}")
    
    async def _store_price_history(self, query_hash: str, summary: MarketDataSummary):
        """Store price history point"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO price_history 
                (query_hash, avg_price, median_price, total_listings, confidence_level)
                VALUES (?, ?, ?, ?, ?)
            """, (
                query_hash,
                summary.avg_price,
                summary.median_price,
                summary.total_listings,
                summary.confidence_level
            ))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Error storing price history: {e}")
    
    async def get_price_history(self, item_query: str, category: str = "", 
                              days: int = 30) -> List[Dict[str, Any]]:
        """Get price history for an item"""
        try:
            query_hash = self._generate_query_hash(item_query, category)
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT avg_price, median_price, total_listings, confidence_level, timestamp
                FROM price_history 
                WHERE query_hash = ? AND timestamp >= ?
                ORDER BY timestamp ASC
            """, (query_hash, (datetime.utcnow() - timedelta(days=days)).isoformat()))
            
            rows = cursor.fetchall()
            conn.close()
            
            return [
                {
                    'avg_price': row[0],
                    'median_price': row[1],
                    'total_listings': row[2],
                    'confidence_level': row[3],
                    'timestamp': row[4]
                }
                for row in rows
            ]
            
        except Exception as e:
            logger.error(f"Error getting price history: {e}")
            return []
    
    async def close(self):
        """Close all data fetchers"""
        await self.ebay_fetcher.close()


# Global market data aggregator instance
market_data_aggregator = MarketDataAggregator()


# Export classes and functions
__all__ = [
    'MarketDataSource',
    'MarketListing', 
    'MarketDataSummary',
    'MarketDataAggregator',
    'market_data_aggregator'
]