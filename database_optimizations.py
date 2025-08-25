"""
Database optimization utilities for Trading Post
This file contains optimized database queries and indexing strategies
"""

from sqlalchemy import Index, text
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional, Dict, Any
import json
from geopy.distance import geodesic
import h3

# Database indexes for performance optimization
def create_performance_indexes(engine):
    """Create database indexes for improved query performance"""
    with engine.connect() as conn:
        # Index for item searches
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_items_available_category 
            ON items (is_available, category) 
            WHERE is_available = 1
        """))
        
        # Index for location-based searches
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_items_h3_available 
            ON items (h3_index, is_available) 
            WHERE is_available = 1
        """))
        
        # Index for user listings
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_items_owner_available 
            ON items (owner_id, is_available) 
            WHERE is_available = 1
        """))
        
        # Index for text search
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_items_title_search 
            ON items (title, is_available) 
            WHERE is_available = 1
        """))
        
        # Index for sorting by creation date
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_items_created_available 
            ON items (created_at, is_available) 
            WHERE is_available = 1
        """))
        
        # User location index for matching
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_users_location 
            ON users (latitude, longitude) 
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        """))
        
        conn.commit()

class OptimizedQueries:
    """Optimized database queries to replace the existing inefficient ones"""
    
    @staticmethod
    def get_listings_with_pagination(db: Session, page: int = 1, limit: int = 10) -> Dict[str, Any]:
        """Optimized listing query with eager loading and reduced database hits"""
        offset = (page - 1) * limit
        
        # Single query with joinedload to prevent N+1 queries
        listings = (
            db.query(Item)
            .options(joinedload(Item.owner))  # Eager load owner to prevent N+1
            .filter(Item.is_available == True)
            .order_by(Item.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
        
        # Get total count efficiently
        total = db.query(Item).filter(Item.is_available == True).count()
        
        # Process listings without additional database queries
        processed_listings = []
        for listing in listings:
            # Parse images safely
            images = []
            if listing.images:
                try:
                    images = json.loads(listing.images) if isinstance(listing.images, str) else listing.images
                except:
                    images = []
            
            listing_data = {
                "id": listing.id,
                "title": listing.title,
                "description": listing.description,
                "price": listing.price,
                "category": listing.category,
                "listing_type": listing.listing_type,
                "condition": listing.condition,
                "service_type": listing.service_type,
                "hourly_rate": listing.hourly_rate,
                "availability": listing.availability,
                "images": images,
                "latitude": listing.latitude,
                "longitude": listing.longitude,
                "created_at": listing.created_at,
                "is_available": listing.is_available,
                "views": listing.views or 0,
                "owner_id": listing.owner_id,
            }
            
            # Owner info is already loaded via joinedload
            if listing.owner:
                listing_data["owner"] = {
                    "id": listing.owner.id,
                    "username": listing.owner.username,
                    "created_at": listing.owner.created_at,
                }
            
            processed_listings.append(listing_data)
        
        pages = (total + limit - 1) // limit
        
        return {
            "listings": processed_listings,
            "total": total,
            "page": page,
            "pages": pages,
        }
    
    @staticmethod
    def search_listings_optimized(
        db: Session, 
        query: Optional[str] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        radius_miles: float = 10,
        category: Optional[str] = None,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Optimized location-based search using H3 spatial indexing"""
        
        if not latitude or not longitude:
            return []
        
        # Use H3 spatial indexing for efficient location filtering
        user_h3 = h3.latlng_to_cell(latitude, longitude, 9)
        
        # Calculate H3 ring size based on radius (approximate)
        ring_size = min(5, max(1, int(radius_miles / 2)))  # Optimize ring size
        nearby_h3_cells = list(h3.disk(user_h3, ring_size))
        
        # Build optimized query
        base_query = (
            db.query(Item)
            .options(joinedload(Item.owner))  # Prevent N+1 queries
            .filter(Item.is_available == True)
            .filter(Item.h3_index.in_(nearby_h3_cells))
        )
        
        # Apply filters
        if query:
            base_query = base_query.filter(
                Item.title.ilike(f"%{query}%") | 
                Item.description.ilike(f"%{query}%")
            )
        
        if category:
            base_query = base_query.filter(Item.category == category)
        
        # Get more items than needed for distance filtering
        items = base_query.limit(limit * 2).all()
        
        # Filter by exact distance and sort
        results = []
        for item in items:
            if item.latitude and item.longitude:
                distance_km = geodesic((latitude, longitude), (item.latitude, item.longitude)).km
                distance_miles = distance_km * 0.621371
                
                if distance_miles <= radius_miles:
                    # Parse images safely
                    images = []
                    if item.images:
                        try:
                            images = json.loads(item.images) if isinstance(item.images, str) else item.images
                        except:
                            images = []
                    
                    item_dict = {
                        "id": item.id,
                        "title": item.title,
                        "description": item.description,
                        "price": item.price,
                        "category": item.category,
                        "listing_type": item.listing_type,
                        "condition": item.condition,
                        "service_type": item.service_type,
                        "hourly_rate": item.hourly_rate,
                        "availability": item.availability,
                        "images": images,
                        "latitude": item.latitude,
                        "longitude": item.longitude,
                        "created_at": item.created_at,
                        "is_available": item.is_available,
                        "views": item.views or 0,
                        "distance_miles": round(distance_miles, 2),
                        "owner_id": item.owner_id,
                    }
                    
                    # Owner info already loaded via joinedload
                    if item.owner:
                        item_dict["owner"] = {
                            "id": item.owner.id,
                            "username": item.owner.username,
                            "created_at": item.owner.created_at,
                        }
                    
                    results.append(item_dict)
        
        # Sort by distance and limit results
        results.sort(key=lambda x: x["distance_miles"])
        return results[:limit]
    
    @staticmethod
    def get_user_listings_optimized(
        db: Session, 
        user_id: int, 
        page: int = 1, 
        limit: int = 10
    ) -> Dict[str, Any]:
        """Optimized user listings query with reduced database hits"""
        offset = (page - 1) * limit
        
        # Single query with eager loading
        listings = (
            db.query(Item)
            .options(joinedload(Item.owner))  # Prevent N+1 queries
            .filter(Item.owner_id == user_id)
            .filter(Item.is_available == True)
            .order_by(Item.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
        
        # Get total count efficiently
        total = db.query(Item).filter(
            Item.owner_id == user_id, 
            Item.is_available == True
        ).count()
        
        # Process listings
        processed_listings = []
        for listing in listings:
            # Parse images safely
            images = []
            if listing.images:
                try:
                    images = json.loads(listing.images) if isinstance(listing.images, str) else listing.images
                except:
                    images = []
            
            listing_data = {
                "id": listing.id,
                "title": listing.title,
                "description": listing.description,
                "price": listing.price,
                "category": listing.category,
                "listing_type": listing.listing_type,
                "condition": listing.condition,
                "service_type": listing.service_type,
                "hourly_rate": listing.hourly_rate,
                "availability": listing.availability,
                "images": images,
                "latitude": listing.latitude,
                "longitude": listing.longitude,
                "created_at": listing.created_at,
                "is_available": listing.is_available,
                "views": listing.views or 0,
                "owner_id": listing.owner_id,
            }
            
            # Owner info already loaded
            if listing.owner:
                listing_data["owner"] = {
                    "id": listing.owner.id,
                    "username": listing.owner.username,
                    "created_at": listing.owner.created_at,
                }
            
            processed_listings.append(listing_data)
        
        pages = (total + limit - 1) // limit
        
        return {
            "listings": processed_listings,
            "total": total,
            "page": page,
            "pages": pages,
        }