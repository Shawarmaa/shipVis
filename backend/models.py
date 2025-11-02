from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional


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

class HourlyInsight(BaseModel):
    time: str
    waveHeight: float
    windSpeed: float
    pop: float  # probability of precipitation
    risk_score: float
    cross_angle: float
    storm_flag: bool
    temperature: Optional[float] = None
    pressure: Optional[float] = None
    seaLevel: Optional[float] = None


class RotterdamSummary(BaseModel):
    max_risk: float
    max_risk_time: str
    storm_hours: List[str]
    avg_wave_height: float
    avg_wind_speed: float


class RotterdamInsightsResponse(BaseModel):
    city: str
    insights: List[HourlyInsight]
    summary: RotterdamSummary


class TimelineDataPoint(BaseModel):
    time: str
    risk_score: float
    is_storm: bool


class RiskTimelineResponse(BaseModel):
    city: str
    timeline: List[TimelineDataPoint]
    storm_threshold: float


class MultiMetricDataPoint(BaseModel):
    time: str
    waveHeight: float
    windSpeed: float
    rainProbability: float  # as percentage


class MultiMetricResponse(BaseModel):
    city: str
    data: List[MultiMetricDataPoint]
    thresholds: dict


class RiskDistribution(BaseModel):
    Safe: int
    Moderate: int
    High: int
    Dangerous: int


class RiskDistributionResponse(BaseModel):
    city: str
    distribution: RiskDistribution
    total_hours: int
    percentages: dict
# class PositionReport(BaseModel):
#     mmsi_id: int
#     ship_name: str
#     latitude: float
#     longitude: float
#     timestamp: datetime.utcnow()
#     cog: float # Course over ground
#     sog: float # Speed over ground
#     true_heading: float # True heading
#     nav_status: int # this is the status of the ship (1-15 i believe)
    


# {
#    "Message":{
#       "PositionReport":{
#          "Cog":308,
#          "CommunicationState":81982,
#          "Latitude":66.02695,
#          "Longitude":12.253821666666665,
#          "MessageID":1,
#          "NavigationalStatus":15,
#          "PositionAccuracy":true,
#          "Raim":false,
#          "RateOfTurn":4,
#          "RepeatIndicator":0,
#          "Sog":0,
#          "Spare":0,
#          "SpecialManoeuvreIndicator":0,
#          "Timestamp":31,
#          "TrueHeading":235,
#          "UserID":259000420,
#          "Valid":true
#       }
#    },
#    "MessageType":"PositionReport",
#    "MetaData":{
#       "MMSI":259000420,
#       "ShipName":"AUGUSTSON",
#       "latitude":66.02695,
#       "longitude":12.253821666666665,
#       "time_utc":"2022-12-29 18:22:32.318353 +0000 UTC"
#    }
# }