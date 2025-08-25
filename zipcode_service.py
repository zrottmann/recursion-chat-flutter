"""
Zip code to latitude/longitude conversion service for USA zip codes.
Uses geopy for geocoding.
"""

from typing import Optional, Tuple, Dict
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
import logging

logger = logging.getLogger(__name__)


class ZipCodeService:
    def __init__(self, user_agent: str = "trading-post-app"):
        self.geocoder = Nominatim(user_agent=user_agent)
        self._cache = {}  # Simple in-memory cache

    def validate_usa_zipcode(self, zipcode: str) -> bool:
        """Validate USA zip code format (5 digits or 5+4 format)."""
        # Remove spaces and hyphens
        cleaned = zipcode.replace(" ", "").replace("-", "")

        # Check if it's 5 digits or 9 digits
        if len(cleaned) == 5:
            return cleaned.isdigit()
        elif len(cleaned) == 9:
            return cleaned.isdigit()
        return False

    def format_zipcode(self, zipcode: str) -> str:
        """Format zip code to standard 5-digit or 5+4 format."""
        cleaned = zipcode.replace(" ", "").replace("-", "")

        if len(cleaned) == 9 and cleaned.isdigit():
            return f"{cleaned[:5]}-{cleaned[5:]}"
        elif len(cleaned) == 5 and cleaned.isdigit():
            return cleaned
        else:
            raise ValueError(f"Invalid zip code format: {zipcode}")

    def get_coordinates(self, zipcode: str) -> Optional[Tuple[float, float]]:
        """
        Get latitude and longitude for a USA zip code.
        Returns (latitude, longitude) tuple or None if not found.
        """
        # Validate and format zip code
        if not self.validate_usa_zipcode(zipcode):
            logger.error(f"Invalid USA zip code: {zipcode}")
            return None

        formatted_zip = self.format_zipcode(zipcode)

        # Check cache first
        if formatted_zip in self._cache:
            return self._cache[formatted_zip]

        try:
            # Query with USA country restriction
            location = self.geocoder.geocode(f"{formatted_zip}, USA", country_codes=["us"], timeout=10)

            if location:
                coords = (location.latitude, location.longitude)
                self._cache[formatted_zip] = coords
                logger.info(f"Found coordinates for zip {formatted_zip}: {coords}")
                return coords
            else:
                logger.warning(f"No coordinates found for zip {formatted_zip}")
                return None

        except GeocoderTimedOut:
            logger.error(f"Geocoding timeout for zip {formatted_zip}")
            return None
        except GeocoderServiceError as e:
            logger.error(f"Geocoding service error for zip {formatted_zip}: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error geocoding zip {formatted_zip}: {e}")
            return None

    def get_location_info(self, zipcode: str) -> Optional[Dict]:
        """
        Get detailed location information for a zip code.
        Returns dict with city, state, lat, lon or None.
        """
        if not self.validate_usa_zipcode(zipcode):
            return None

        formatted_zip = self.format_zipcode(zipcode)

        try:
            location = self.geocoder.geocode(
                f"{formatted_zip}, USA",
                country_codes=["us"],
                addressdetails=True,
                timeout=10,
            )

            if location:
                # Parse address components
                raw = location.raw
                address = raw.get("address", {})

                return {
                    "zipcode": formatted_zip,
                    "latitude": location.latitude,
                    "longitude": location.longitude,
                    "city": address.get("city") or address.get("town") or address.get("village"),
                    "state": address.get("state"),
                    "state_code": address.get("state_code"),
                    "country": "USA",
                    "display_name": location.address,
                }
            return None

        except Exception as e:
            logger.error(f"Error getting location info for zip {formatted_zip}: {e}")
            return None

    def batch_geocode(self, zipcodes: list) -> Dict[str, Optional[Tuple[float, float]]]:
        """
        Geocode multiple zip codes.
        Returns dict mapping zip code to (lat, lon) or None.
        """
        results = {}
        for zipcode in zipcodes:
            results[zipcode] = self.get_coordinates(zipcode)
        return results


# Fallback hardcoded data for common US zip codes (for offline/testing)
COMMON_ZIPCODES = {
    # Major cities
    "10001": (40.7506, -73.9971),  # New York, NY
    "90001": (33.9731, -118.2479),  # Los Angeles, CA
    "60601": (41.8857, -87.6181),  # Chicago, IL
    "77001": (29.7536, -95.3547),  # Houston, TX
    "85001": (33.4484, -112.0740),  # Phoenix, AZ
    "19101": (39.9526, -75.1652),  # Philadelphia, PA
    "78201": (29.4241, -98.4936),  # San Antonio, TX
    "92101": (32.7157, -117.1611),  # San Diego, CA
    "75201": (32.7767, -96.7970),  # Dallas, TX
    "95101": (37.3382, -121.8863),  # San Jose, CA
    "78701": (30.2672, -97.7431),  # Austin, TX
    "32801": (28.5383, -81.3792),  # Orlando, FL
    "94102": (37.7749, -122.4194),  # San Francisco, CA
    "98101": (47.6062, -122.3321),  # Seattle, WA
    "80202": (39.7392, -104.9903),  # Denver, CO
    "02101": (42.3601, -71.0589),  # Boston, MA
    "37201": (36.1627, -86.7816),  # Nashville, TN
    "97201": (45.5152, -122.6784),  # Portland, OR
    "89101": (36.1699, -115.1398),  # Las Vegas, NV
    "33101": (25.7617, -80.1918),  # Miami, FL
}


class OfflineZipCodeService(ZipCodeService):
    """Zip code service that works offline using hardcoded data."""

    def get_coordinates(self, zipcode: str) -> Optional[Tuple[float, float]]:
        """Get coordinates from hardcoded data first, then fallback to geocoding."""
        formatted_zip = self.format_zipcode(zipcode)

        # Check hardcoded data first
        if formatted_zip in COMMON_ZIPCODES:
            return COMMON_ZIPCODES[formatted_zip]

        # Try base zip if we have zip+4
        if len(formatted_zip) > 5:
            base_zip = formatted_zip[:5]
            if base_zip in COMMON_ZIPCODES:
                return COMMON_ZIPCODES[base_zip]

        # Fallback to online geocoding
        return super().get_coordinates(zipcode)
