import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class WeatherService:
    """Weather integration for tour planning. Uses OpenWeatherMap or similar API."""

    @staticmethod
    async def get_forecast(city: str, date: datetime | None = None) -> dict:
        """Get weather forecast for a city. Returns mock data if no API key configured."""
        from core.config import settings
        if not settings.weather_api_key:
            return WeatherService._mock_forecast(city, date)

        # In production: call OpenWeatherMap API
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    "https://api.openweathermap.org/data/2.5/forecast",
                    params={"q": city, "appid": settings.weather_api_key, "units": "metric"},
                    timeout=10,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    forecast = data.get("list", [{}])[0]
                    return {
                        "city": city,
                        "temperature": forecast.get("main", {}).get("temp"),
                        "description": forecast.get("weather", [{}])[0].get("description", ""),
                        "humidity": forecast.get("main", {}).get("humidity"),
                        "wind_speed": forecast.get("wind", {}).get("speed"),
                        "icon": forecast.get("weather", [{}])[0].get("icon", ""),
                    }
        except Exception as e:
            logger.error(f"Weather API error: {e}")
        return WeatherService._mock_forecast(city, date)

    @staticmethod
    def _mock_forecast(city: str, date: datetime | None = None) -> dict:
        month = (date or datetime.utcnow()).month
        if month in (6, 7, 8):
            return {"city": city, "temperature": 32, "description": "Sunny", "humidity": 40,
                    "wind_speed": 3.5, "recommendation": "Great day for outdoor tours! Bring water and sunscreen."}
        elif month in (12, 1, 2):
            return {"city": city, "temperature": 10, "description": "Partly cloudy", "humidity": 65,
                    "wind_speed": 5.0, "recommendation": "Consider indoor alternatives or ensure warm clothing."}
        return {"city": city, "temperature": 22, "description": "Pleasant", "humidity": 50,
                "wind_speed": 3.0, "recommendation": "Perfect weather for tours!"}

    @staticmethod
    def suggest_indoor_alternatives(weather: dict) -> list[str]:
        temp = weather.get("temperature", 20)
        desc = weather.get("description", "").lower()
        suggestions = []
        if "rain" in desc or "storm" in desc:
            suggestions.extend(["Museum visit", "Indoor food tour", "Wine tasting", "Art gallery tour"])
        if temp and temp > 38:
            suggestions.extend(["Morning-only tours", "Indoor cultural sites", "Cave exploration"])
        if temp and temp < 5:
            suggestions.extend(["Indoor heritage sites", "Cooking class", "Coffee & history tour"])
        return suggestions
