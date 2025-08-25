from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import List, Optional, Dict
from pydantic import BaseModel, Field
import redis
from geospatial import GeospatialService

router = APIRouter(prefix="/api/geospatial", tags=["geospatial"])


# Pydantic models for request/response
class LocationPoint(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class UserWithListings(BaseModel):
    id: int
    username: str
    latitude: float
    longitude: float
    distance_km: float
    sell_listings: List[Dict]
    buy_listings: List[Dict]
    total_listings: int


class RadiusSearchRequest(BaseModel):
    center_lat: float = Field(..., ge=-90, le=90)
    center_lon: float = Field(..., ge=-180, le=180)
    radius_km: float = Field(default=10, gt=0, le=100)
    max_results: int = Field(default=500, gt=0, le=1000)
    category: Optional[str] = None


class RadiusSearchResponse(BaseModel):
    users: List[UserWithListings]
    total_count: int
    search_radius_km: float


class GroupingRequest(BaseModel):
    users: List[UserWithListings]
    max_group_size: int = Field(default=50, gt=0, le=200)
    use_h3: bool = True


class GroupingResponse(BaseModel):
    groups: List[List[UserWithListings]]
    total_groups: int
    total_users: int


# Dependencies
def get_db():
    # This should be imported from your database module
    # For now, returning a placeholder
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    engine = create_engine("sqlite:///trading_post.db")
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_async_db():
    # This should be imported from your database module
    # For now, returning a placeholder
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy.orm import sessionmaker

    engine = create_async_engine("sqlite+aiosqlite:///trading_post.db")
    AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with AsyncSessionLocal() as session:
        yield session


def get_redis_client():
    # This should be configured in your app settings
    try:
        return redis.Redis(host="localhost", port=6379, decode_responses=True)
    except BaseException:
        return None


def get_geospatial_service(
    redis_client: Optional[redis.Redis] = Depends(get_redis_client),
):
    return GeospatialService(redis_client)


# Endpoints
@router.post("/search/radius", response_model=RadiusSearchResponse)
def search_users_in_radius(
    request: RadiusSearchRequest,
    db: Session = Depends(get_db),
    geo_service: GeospatialService = Depends(get_geospatial_service),
):
    """
    Search for users within a specified radius from a center point.
    Includes their buy/sell listings and caches results.
    """
    try:
        users = geo_service.get_users_in_radius(
            db=db,
            center_lat=request.center_lat,
            center_lon=request.center_lon,
            radius_km=request.radius_km,
            max_results=request.max_results,
            category=request.category,
        )

        return RadiusSearchResponse(users=users, total_count=len(users), search_radius_km=request.radius_km)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.post("/search/radius/async", response_model=RadiusSearchResponse)
async def search_users_in_radius_async(
    request: RadiusSearchRequest,
    db: AsyncSession = Depends(get_async_db),
    geo_service: GeospatialService = Depends(get_geospatial_service),
):
    """
    Async version of radius search with parallel listing queries.
    """
    try:
        users = await geo_service.get_users_in_radius_async(
            db=db,
            center_lat=request.center_lat,
            center_lon=request.center_lon,
            radius_km=request.radius_km,
            max_results=request.max_results,
            category=request.category,
        )

        return RadiusSearchResponse(users=users, total_count=len(users), search_radius_km=request.radius_km)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Async search failed: {str(e)}")


@router.post("/group/users", response_model=GroupingResponse)
def group_users(
    request: GroupingRequest,
    geo_service: GeospatialService = Depends(get_geospatial_service),
):
    """
    Group users using H3 hexagonal clustering for efficient organization.
    """
    try:
        groups = geo_service.divide_into_groups(
            users=[user.dict() for user in request.users],
            max_group_size=request.max_group_size,
            use_h3=request.use_h3,
        )

        total_users = sum(len(group) for group in groups)

        return GroupingResponse(groups=groups, total_groups=len(groups), total_users=total_users)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Grouping failed: {str(e)}")


@router.get("/search/nearby")
async def search_nearby_users(
    lat: float = Query(..., ge=-90, le=90, description="Latitude"),
    lon: float = Query(..., ge=-180, le=180, description="Longitude"),
    radius: float = Query(10, gt=0, le=100, description="Search radius in kilometers"),
    category: Optional[str] = Query(None, description="Filter by listing category"),
    max_results: int = Query(100, gt=0, le=500, description="Maximum results to return"),
    db: AsyncSession = Depends(get_async_db),
    geo_service: GeospatialService = Depends(get_geospatial_service),
):
    """
    Simple GET endpoint for nearby user search.
    """
    try:
        users = await geo_service.get_users_in_radius_async(
            db=db,
            center_lat=lat,
            center_lon=lon,
            radius_km=radius,
            max_results=max_results,
            category=category,
        )

        return {
            "users": users,
            "count": len(users),
            "center": {"latitude": lat, "longitude": lon},
            "radius_km": radius,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Nearby search failed: {str(e)}")


@router.post("/search/batch")
async def batch_radius_search(
    locations: List[LocationPoint],
    radius_km: float = Query(10, gt=0, le=100),
    max_results_per_location: int = Query(50, gt=0, le=200),
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_async_db),
    geo_service: GeospatialService = Depends(get_geospatial_service),
):
    """
    Perform radius searches for multiple locations in parallel.
    """
    try:
        search_tasks = []
        for location in locations:
            task = geo_service.get_users_in_radius_async(
                db=db,
                center_lat=location.latitude,
                center_lon=location.longitude,
                radius_km=radius_km,
                max_results=max_results_per_location,
                category=category,
            )
            search_tasks.append(task)

        import asyncio

        results = await asyncio.gather(*search_tasks)

        return {
            "searches": [
                {
                    "location": {"latitude": loc.latitude, "longitude": loc.longitude},
                    "users": users,
                    "count": len(users),
                }
                for loc, users in zip(locations, results)
            ],
            "total_locations": len(locations),
            "radius_km": radius_km,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch search failed: {str(e)}")


@router.get("/groups/density-map")
async def get_density_map(
    bounds_north: float = Query(..., ge=-90, le=90),
    bounds_south: float = Query(..., ge=-90, le=90),
    bounds_east: float = Query(..., ge=-180, le=180),
    bounds_west: float = Query(..., ge=-180, le=180),
    resolution: int = Query(7, ge=4, le=10, description="H3 resolution (4-10)"),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Get user density map using H3 hexagons for visualization.
    """
    try:
        import h3

        # Query users within bounds
        query = text(
            """
            SELECT id, latitude, longitude
            FROM users
            WHERE opt_in_location = true
            AND latitude BETWEEN :south AND :north
            AND longitude BETWEEN :west AND :east
        """
        )

        result = await db.execute(
            query,
            {
                "north": bounds_north,
                "south": bounds_south,
                "east": bounds_east,
                "west": bounds_west,
            },
        )
        users = result.fetchall()

        # Create H3 density map
        hex_counts = {}
        for user in users:
            hex_id = h3.latlng_to_cell(user.latitude, user.longitude, resolution)
            hex_counts[hex_id] = hex_counts.get(hex_id, 0) + 1

        # Convert to list with hex boundaries
        density_data = []
        for hex_id, count in hex_counts.items():
            boundary = h3.cell_to_boundary(hex_id)
            center = h3.cell_to_latlng(hex_id)
            density_data.append(
                {
                    "hex_id": hex_id,
                    "center": {"latitude": center[0], "longitude": center[1]},
                    "boundary": [{"latitude": pt[0], "longitude": pt[1]} for pt in boundary],
                    "user_count": count,
                }
            )

        # Sort by density
        density_data.sort(key=lambda x: x["user_count"], reverse=True)

        return {
            "density_map": density_data,
            "total_hexagons": len(density_data),
            "total_users": sum(h["user_count"] for h in density_data),
            "resolution": resolution,
            "bounds": {
                "north": bounds_north,
                "south": bounds_south,
                "east": bounds_east,
                "west": bounds_west,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Density map failed: {str(e)}")
