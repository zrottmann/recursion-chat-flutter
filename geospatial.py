import asyncio
import json
from typing import List, Dict, Optional
import redis
from geopy.distance import geodesic
import h3
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)


class GeospatialService:
    def __init__(self, redis_client: Optional[redis.Redis] = None):
        self.redis_client = redis_client
        self.cache_ttl = 3600  # 1 hour

    def _get_cache_key(self, lat: float, lon: float, radius: float, category: Optional[str] = None) -> str:
        """Generate cache key for radius search."""
        key_parts = [f"geo:{lat:.4f}:{lon:.4f}:{radius}"]
        if category:
            key_parts.append(f"cat:{category}")
        return ":".join(key_parts)

    def _cache_get(self, key: str) -> Optional[List[Dict]]:
        """Get cached results."""
        if not self.redis_client:
            return None
        try:
            cached = self.redis_client.get(key)
            if cached:
                return json.loads(cached)
        except Exception as e:
            logger.error(f"Redis get error: {e}")
        return None

    def _cache_set(self, key: str, value: List[Dict]):
        """Set cache with TTL."""
        if not self.redis_client:
            return
        try:
            self.redis_client.setex(key, self.cache_ttl, json.dumps(value))
        except Exception as e:
            logger.error(f"Redis set error: {e}")

    def get_users_in_radius(
        self,
        db: Session,
        center_lat: float,
        center_lon: float,
        radius_km: float = 10,
        max_results: int = 500,
        category: Optional[str] = None,
    ) -> List[Dict]:
        """
        Get users within radius with their listings.
        Uses PostGIS ST_DWithin if available, falls back to Python distance calculation.
        """
        cache_key = self._get_cache_key(center_lat, center_lon, radius_km, category)
        cached = self._cache_get(cache_key)
        if cached is not None:
            return cached

        try:
            # Try PostGIS query first
            radius_meters = radius_km * 1000
            query = text(
                """
                SELECT DISTINCT u.id, u.username, u.email, u.latitude, u.longitude,
                       ST_Distance(
                           ST_MakePoint(:lon, :lat)::geography,
                           ST_MakePoint(u.longitude, u.latitude)::geography
                       ) as distance
                FROM users u
                WHERE u.opt_in_location = true
                AND ST_DWithin(
                    ST_MakePoint(u.longitude, u.latitude)::geography,
                    ST_MakePoint(:lon, :lat)::geography,
                    :radius
                )
                ORDER BY distance
                LIMIT :limit
            """
            )

            result = db.execute(
                query,
                {
                    "lat": center_lat,
                    "lon": center_lon,
                    "radius": radius_meters,
                    "limit": max_results,
                },
            )
            users_data = result.fetchall()

        except Exception as e:
            logger.info(f"PostGIS query failed, using fallback: {e}")
            # Fallback to Python distance calculation
            users_data = self._fallback_radius_search(db, center_lat, center_lon, radius_km, max_results, category)

        # Format results with listings
        users = []
        for user_row in users_data:
            user_dict = {
                "id": user_row.id,
                "username": user_row.username,
                "latitude": user_row.latitude,
                "longitude": user_row.longitude,
                "distance_km": (
                    getattr(user_row, "distance", 0) / 1000
                    if hasattr(user_row, "distance")
                    else geodesic(
                        (center_lat, center_lon),
                        (user_row.latitude, user_row.longitude),
                    ).km
                ),
            }

            # Get user's listings
            sell_listings = self._get_user_listings(db, user_row.id, "sell", category)
            buy_listings = self._get_user_listings(db, user_row.id, "buy", category)

            user_dict["sell_listings"] = sell_listings
            user_dict["buy_listings"] = buy_listings
            user_dict["total_listings"] = len(sell_listings) + len(buy_listings)

            users.append(user_dict)

        self._cache_set(cache_key, users)
        return users

    def _fallback_radius_search(
        self,
        db: Session,
        center_lat: float,
        center_lon: float,
        radius_km: float,
        max_results: int,
        category: Optional[str] = None,
    ) -> List:
        """Fallback radius search using Python distance calculation."""
        # Get all opted-in users
        query = text(
            """
            SELECT id, username, email, latitude, longitude
            FROM users
            WHERE opt_in_location = true
            AND latitude IS NOT NULL
            AND longitude IS NOT NULL
        """
        )

        all_users = db.execute(query).fetchall()

        # Calculate distances and filter
        users_with_distance = []
        for user in all_users:
            distance = geodesic((center_lat, center_lon), (user.latitude, user.longitude)).km

            if distance <= radius_km:
                user_data = dict(user._mapping)
                user_data["distance"] = distance * 1000  # Convert to meters for consistency
                users_with_distance.append(type("User", (), user_data))

        # Sort by distance and limit
        users_with_distance.sort(key=lambda x: x.distance)
        return users_with_distance[:max_results]

    def _get_user_listings(
        self,
        db: Session,
        user_id: int,
        listing_type: str,
        category: Optional[str] = None,
    ) -> List[Dict]:
        """Get summarized listings for a user."""
        query = text(
            """
            SELECT id, title, price, category, created_at
            FROM listings
            WHERE user_id = :user_id
            AND type = :type
            AND (:category IS NULL OR category = :category)
            ORDER BY created_at DESC
            LIMIT 10
        """
        )

        listings = db.execute(query, {"user_id": user_id, "type": listing_type, "category": category}).fetchall()

        return [
            {
                "id": listing.id,
                "title": listing.title,
                "price": float(listing.price) if listing.price else None,
                "category": listing.category,
            }
            for listing in listings
        ]

    def divide_into_groups(self, users: List[Dict], max_group_size: int = 50, use_h3: bool = True) -> List[List[Dict]]:
        """
        Divide users into groups using H3 hexagonal clustering.
        Handles empty/sparse areas and sorts by density.
        """
        if not users:
            return []

        if not use_h3 or len(users) <= max_group_size:
            # Simple chunking if H3 not used or small user count
            return [users[i : i + max_group_size] for i in range(0, len(users), max_group_size)]

        # H3 hexagonal clustering
        h3_resolution = 8  # ~0.46 km^2 per hex
        hex_to_users = {}

        # Assign users to hexagons
        for user in users:
            hex_id = h3.latlng_to_cell(user["latitude"], user["longitude"], h3_resolution)
            if hex_id not in hex_to_users:
                hex_to_users[hex_id] = []
            hex_to_users[hex_id].append(user)

        # Group nearby hexagons if needed
        groups = []
        processed_hexes = set()

        for hex_id, hex_users in sorted(hex_to_users.items(), key=lambda x: len(x[1]), reverse=True):
            if hex_id in processed_hexes:
                continue

            current_group = list(hex_users)
            processed_hexes.add(hex_id)

            # If group is too small, merge with neighbors
            if len(current_group) < max_group_size:
                neighbors = h3.grid_ring(hex_id, 1)  # Get immediate neighbors
                for neighbor in neighbors:
                    if neighbor in hex_to_users and neighbor not in processed_hexes:
                        neighbor_users = hex_to_users[neighbor]
                        if len(current_group) + len(neighbor_users) <= max_group_size:
                            current_group.extend(neighbor_users)
                            processed_hexes.add(neighbor)
                        else:
                            # Take only what fits
                            space_left = max_group_size - len(current_group)
                            current_group.extend(neighbor_users[:space_left])
                            if space_left >= len(neighbor_users):
                                processed_hexes.add(neighbor)

            # Split if group is too large
            if len(current_group) > max_group_size:
                for i in range(0, len(current_group), max_group_size):
                    groups.append(current_group[i : i + max_group_size])
            else:
                groups.append(current_group)

        # Sort groups by density (users per area)
        for group in groups:
            if len(group) > 1:
                # Sort group by listings (density calculation was removed as unused)
                # lats = [u["latitude"] for u in group]
                # lons = [u["longitude"] for u in group]
                # area = (max(lats) - min(lats)) * (max(lons) - min(lons))
                # density = len(group) / (area + 0.0001)
                group.sort(key=lambda x: x.get("total_listings", 0), reverse=True)

        return groups

    async def get_users_in_radius_async(
        self,
        db: AsyncSession,
        center_lat: float,
        center_lon: float,
        radius_km: float = 10,
        max_results: int = 500,
        category: Optional[str] = None,
    ) -> List[Dict]:
        """Async version of get_users_in_radius."""
        cache_key = self._get_cache_key(center_lat, center_lon, radius_km, category)
        cached = self._cache_get(cache_key)
        if cached is not None:
            return cached

        try:
            # Try PostGIS query first
            radius_meters = radius_km * 1000
            query = text(
                """
                SELECT DISTINCT u.id, u.username, u.email, u.latitude, u.longitude,
                       ST_Distance(
                           ST_MakePoint(:lon, :lat)::geography,
                           ST_MakePoint(u.longitude, u.latitude)::geography
                       ) as distance
                FROM users u
                WHERE u.opt_in_location = true
                AND ST_DWithin(
                    ST_MakePoint(u.longitude, u.latitude)::geography,
                    ST_MakePoint(:lon, :lat)::geography,
                    :radius
                )
                ORDER BY distance
                LIMIT :limit
            """
            )

            result = await db.execute(
                query,
                {
                    "lat": center_lat,
                    "lon": center_lon,
                    "radius": radius_meters,
                    "limit": max_results,
                },
            )
            users_data = result.fetchall()

        except Exception as e:
            logger.info(f"PostGIS query failed, using fallback: {e}")
            # Fallback to Python distance calculation
            users_data = await self._fallback_radius_search_async(
                db, center_lat, center_lon, radius_km, max_results, category
            )

        # Get listings for all users in parallel
        user_tasks = []
        for user_row in users_data:
            user_dict = {
                "id": user_row.id,
                "username": user_row.username,
                "latitude": user_row.latitude,
                "longitude": user_row.longitude,
                "distance_km": (
                    getattr(user_row, "distance", 0) / 1000
                    if hasattr(user_row, "distance")
                    else geodesic(
                        (center_lat, center_lon),
                        (user_row.latitude, user_row.longitude),
                    ).km
                ),
            }
            user_tasks.append(self._enrich_user_with_listings_async(db, user_dict, category))

        users = await asyncio.gather(*user_tasks)

        self._cache_set(cache_key, users)
        return users

    async def _fallback_radius_search_async(
        self,
        db: AsyncSession,
        center_lat: float,
        center_lon: float,
        radius_km: float,
        max_results: int,
        category: Optional[str] = None,
    ) -> List:
        """Async fallback radius search."""
        query = text(
            """
            SELECT id, username, email, latitude, longitude
            FROM users
            WHERE opt_in_location = true
            AND latitude IS NOT NULL
            AND longitude IS NOT NULL
        """
        )

        result = await db.execute(query)
        all_users = result.fetchall()

        # Calculate distances and filter
        users_with_distance = []
        for user in all_users:
            distance = geodesic((center_lat, center_lon), (user.latitude, user.longitude)).km

            if distance <= radius_km:
                user_data = dict(user._mapping)
                user_data["distance"] = distance * 1000
                users_with_distance.append(type("User", (), user_data))

        # Sort by distance and limit
        users_with_distance.sort(key=lambda x: x.distance)
        return users_with_distance[:max_results]

    async def _enrich_user_with_listings_async(
        self, db: AsyncSession, user_dict: Dict, category: Optional[str] = None
    ) -> Dict:
        """Enrich user data with listings asynchronously."""
        sell_task = self._get_user_listings_async(db, user_dict["id"], "sell", category)
        buy_task = self._get_user_listings_async(db, user_dict["id"], "buy", category)

        sell_listings, buy_listings = await asyncio.gather(sell_task, buy_task)

        user_dict["sell_listings"] = sell_listings
        user_dict["buy_listings"] = buy_listings
        user_dict["total_listings"] = len(sell_listings) + len(buy_listings)

        return user_dict

    async def _get_user_listings_async(
        self,
        db: AsyncSession,
        user_id: int,
        listing_type: str,
        category: Optional[str] = None,
    ) -> List[Dict]:
        """Async version of get user listings."""
        query = text(
            """
            SELECT id, title, price, category, created_at
            FROM listings
            WHERE user_id = :user_id
            AND type = :type
            AND (:category IS NULL OR category = :category)
            ORDER BY created_at DESC
            LIMIT 10
        """
        )

        result = await db.execute(query, {"user_id": user_id, "type": listing_type, "category": category})
        listings = result.fetchall()

        return [
            {
                "id": listing.id,
                "title": listing.title,
                "price": float(listing.price) if listing.price else None,
                "category": listing.category,
            }
            for listing in listings
        ]
