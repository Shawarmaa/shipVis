from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
from typing import Dict, Tuple, Optional, List
from pydantic import BaseModel

class ShipPositionData(BaseModel):
    mmsi: int
    ship_name: str
    latitude: float
    longitude: float
    speed: float
    course: float
    heading: float
    nav_status: int
    timestamp: str  # Keep as string since AIS format is non-standard
    destination: str
    call_sign: str
    ship_type: int
    eta: Optional[str] = None

def eta_to_iso(eta_dict: Dict, reference: str) -> Optional[str]:
    """Convert ETA dictionary to ISO formatted string"""
    try:
        days = int(eta_dict.get("Day") or eta_dict.get("day") or 0)
        hours = int(eta_dict.get("Hour") or eta_dict.get("hour") or 0)
        minutes = int(eta_dict.get("Minute") or eta_dict.get("minute") or 0)
        ref = reference or datetime.now()
        dt = datetime.fromisoformat(ref) + timedelta(days=days, hours=hours, minutes=minutes)
        return dt.isoformat()
    except Exception:
        return None

def assess_ship_docking(eta, timestamp):
    eta_dt = datetime.fromisoformat(eta_to_iso(eta, timestamp))
    now = datetime.now()
    
    # Only assess if ETA is within 5 days
    if eta_dt - now > timedelta(days=5):
        return "N/A", 0.0, {"Warning": "ETA beyond 5 days; no reliable forecast available for assesment"}

    # Load pre-fetched data
    conditions = get_conditions_at_time(eta_dt)
    if not conditions:
        return "N/A", 0.0, {"Warning": "ETA beyond 5 days; no reliable forecast available for assesment"}

    # Calculate risk score and get risk factors
    risk_score, risk_factors = calculate_risk(conditions)
    
    # Check news for port disruptions
    #news_alerts = check_port_news(ship.destination)
    #if news_alerts:
        #risk_score = min(risk_score + 0.2, 1.0)  # Increase risk if negative news found
        
    # Determine status based on risk score
    if risk_score < 0.3:
        status = "DOCK"
    elif risk_score < 0.7:
        status = "DELAY"
    else:
        status = "NO_DOCK"

    return status, risk_score, risk_factors

def get_conditions_at_time(target_time: datetime) -> Optional[Dict]:
    """Get weather and marine conditions closest to target time"""
    try:
        base_dir = Path(__file__).resolve().parent
        
        # Load weather data
        with open(base_dir / "weather_data.json") as f:
            weather_data = json.load(f)
        
        # Load marine data
        with open(base_dir / "marine_data.json") as f:
            marine_data = json.load(f)

        # Normalize target_time to UTC (make timezone-aware)
        if target_time.tzinfo is None:
            target_time_utc = target_time.replace(tzinfo=timezone.utc)
        else:
            target_time_utc = target_time.astimezone(timezone.utc)

        def _parse_to_utc(s: str) -> datetime:
            """Parse ISO-like string to a timezone-aware UTC datetime."""
            dt = datetime.fromisoformat(s)
            if dt.tzinfo is None:
                # assume naive datetimes in the files are UTC
                return dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc)

        # Find closest weather forecast (weather dt_txt may be naive -> assume UTC)
        weather_list = weather_data['list']
        closest_weather = min(
            weather_list,
            key=lambda x: abs(_parse_to_utc(x['dt_txt']) - target_time_utc)
        )

        # Find closest marine forecast (marine times include offsets like +00:00)
        marine_hours = marine_data['hours']
        closest_marine = min(
            marine_hours,
            key=lambda x: abs(_parse_to_utc(x['time']) - target_time_utc)
        )
        
        return {
            'wind_speed': closest_weather['wind']['speed'],
            'wind_direction': closest_weather['wind'].get('deg', 0),
            'visibility': closest_weather.get('visibility', 10000),
            'wave_height': closest_marine['waveHeight']['sg'],
            'wave_direction': closest_marine['waveDirection']['sg'],
            'sea_level': closest_marine.get('seaLevel', {}).get('sg', 0)
        }
        
    except (FileNotFoundError, KeyError, IndexError, ValueError) as e:
        print(f"Error getting conditions: {e}")
        return None

def calculate_risk(conditions: Dict) -> Tuple[float, Dict]:
    """Calculate risk score and identify risk factors"""
    risk_factors = {}
    
    # Hard limits that prevent docking
    if conditions['wind_speed'] > 18:
        return 1.0, {"critical": "Wind speed exceeds safety limit (18 m/s)"}
    if conditions['wave_height'] > 4.0:
        return 1.0, {"critical": "Wave height exceeds safety limit (4.0 m)"}
        
    # Calculate base risk score
    risk_score = (
        0.4 * (conditions['wave_height'] / 3.0) +  # Max safe wave height ~3m
        0.3 * (conditions['wind_speed'] / 10.0) +  # Max safe wind ~10 m/s
        0.2 * (1 - conditions['visibility'] / 10000)  # Max visibility 10km
    )
    
    # Add contributing factors to risk_factors
    if conditions['wave_height'] > 2.0:
        risk_factors["wave_height"] = f"High waves: {conditions['wave_height']:.1f}m"
    if conditions['wind_speed'] > 8.0:
        risk_factors["wind_speed"] = f"Strong winds: {conditions['wind_speed']:.1f}m/s"
    if conditions['visibility'] < 5000:
        risk_factors["visibility"] = f"Poor visibility: {conditions['visibility']}m"
    
    # Check cross angles between wind and waves
    cross_angle = abs(conditions['wind_direction'] - conditions['wave_direction'])
    cross_angle = min(cross_angle, 360 - cross_angle)
    if 75 < cross_angle < 105:
        risk_score += 0.1
        risk_factors["cross_angle"] = "Dangerous cross-angle between wind and waves"
        
    return risk_score, risk_factors

def check_port_news(port_name: str) -> Optional[List[str]]:
    """Check recent news for port disruptions"""
    try:
        base_dir = Path(__file__).resolve().parent
        with open(base_dir / "news_data.json") as f:
            news_data = json.load(f)
    except FileNotFoundError:
        return None

    if not news_data.get('articles'):
        return None
        
    risk_keywords = [
        'strike', 'closure', 'accident', 'delay', 'protest',
        'storm', 'weather warning', 'port congestion'
    ]
    
    recent_alerts = []
    for article in news_data['articles']:
        if any(keyword in article['title'].lower() for keyword in risk_keywords):
            if port_name.lower() in article['title'].lower():
                recent_alerts.append(article['title'])
                
    return recent_alerts if recent_alerts else None

if __name__ == "__main__":
    
    eta={"Day": 0, "Hour": 48, "Minute": 0}
    timestamp="2024-06-01T12:00:00"
    status, risk_score, risk_factors = assess_ship_docking(eta, timestamp)
    print(f"Docking Status: {status}")
    print(f"Risk Score: {risk_score:.2f}")
    print(f"Risk Factors: {risk_factors}")
