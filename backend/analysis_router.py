from fastapi import APIRouter, HTTPException
from models import (
    RotterdamInsightsResponse, HourlyInsight, RotterdamSummary,
    RiskTimelineResponse, TimelineDataPoint,
    MultiMetricResponse, MultiMetricDataPoint,
    RiskDistributionResponse, RiskDistribution
)
import pandas as pd
import json
from pathlib import Path
from datetime import datetime

router = APIRouter(prefix="/rotterdam", tags=["Rotterdam Analysis"])

# Get the directory where this file is located
BASE_DIR = Path(__file__).resolve().parent


def load_and_normalize_data():
    """Load and normalize weather and marine data from JSON files."""
    try:
        # Load weather data
        weather_path = BASE_DIR / "weather_data.json"
        with open(weather_path) as f:
            weather_raw = json.load(f)["list"]
        
        weather_df = pd.json_normalize(weather_raw)
        
        # Normalize weather data - select and rename columns
        weather_df["timestamp"] = pd.to_datetime(weather_df["dt"], unit='s')
        weather_df["windSpeed"] = weather_df["wind.speed"]
        weather_df["windDeg"] = weather_df["wind.deg"]
        weather_df["pop"] = weather_df["pop"]  # probability of precipitation
        weather_df["temperature"] = weather_df["main.temp"]
        weather_df["pressure"] = weather_df["main.pressure"]
        
        weather_df = weather_df[["timestamp", "windSpeed", "windDeg", "pop", "temperature", "pressure"]]
        
        # Load marine data
        marine_path = BASE_DIR / "marine_data.json"
        with open(marine_path) as f:
            marine_raw = json.load(f)["hours"]
        
        marine_df = pd.json_normalize(marine_raw)
        
        # Normalize marine data - use average of available sources
        marine_df["timestamp"] = pd.to_datetime(marine_df["time"]).dt.tz_localize(None)
        
        # Calculate average wave height from all available sources
        wave_cols = [col for col in marine_df.columns if col.startswith("waveHeight.")]
        marine_df["waveHeight"] = marine_df[wave_cols].mean(axis=1)
        
        # Calculate average wave direction from all available sources
        wave_dir_cols = [col for col in marine_df.columns if col.startswith("waveDirection.")]
        marine_df["waveDirection"] = marine_df[wave_dir_cols].mean(axis=1)
        
        # Calculate average sea level
        sea_level_cols = [col for col in marine_df.columns if col.startswith("seaLevel.")]
        if len(sea_level_cols) > 0:
            marine_df["seaLevel"] = marine_df[sea_level_cols].mean(axis=1)
        else:
            marine_df["seaLevel"] = 0.0
        
        marine_df = marine_df[["timestamp", "waveHeight", "waveDirection", "seaLevel"]]
        
        return weather_df, marine_df
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading data: {str(e)}")



def merge_data(weather_df, marine_df):
    """Merge weather and marine data on timestamp with 1-hour tolerance."""
    # Sort both dataframes by timestamp
    weather_df = weather_df.sort_values("timestamp")
    marine_df = marine_df.sort_values("timestamp")
    
    # Merge with tolerance of 1 hour
    merged_df = pd.merge_asof(
        weather_df,
        marine_df,
        on="timestamp",
        direction="nearest",
        tolerance=pd.Timedelta("1h")
    )
    
    # Drop rows with missing critical data
    merged_df = merged_df.dropna(subset=["waveHeight", "windSpeed", "pop"])
    
    return merged_df


def compute_derived_metrics(df):
    """Compute risk score, cross angle, and storm flag."""
    # Risk score formula: 0.4*(waveHeight/3) + 0.3*(windSpeed/10) + 0.3*(rainProb)
    df["risk_score"] = (
        0.4 * (df["waveHeight"] / 3.0) +
        0.3 * (df["windSpeed"] / 10.0) +
        0.3 * df["pop"]
    )
    
    # Cross angle: absolute difference between wave direction and wind direction
    df["cross_angle"] = (df["waveDirection"] - df["windDeg"]).abs()
    
    # Normalize cross_angle to 0-180 range
    df["cross_angle"] = df["cross_angle"].apply(lambda x: min(x, 360 - x) if x > 180 else x)
    
    # Storm flag: risk_score > 0.7
    df["storm_flag"] = df["risk_score"] > 0.7
    
    # Risk levels
    def get_risk_level(score):
        if score > 0.7:
            return 'Dangerous'
        elif score > 0.5:
            return 'High'
        elif score > 0.3:
            return 'Moderate'
        else:
            return 'Safe'
    
    df["risk_level"] = df["risk_score"].apply(get_risk_level)
    
    return df


@router.get("/insights", response_model=RotterdamInsightsResponse)
async def get_rotterdam_insights():
    """
    Get maritime risk insights for Rotterdam port.
    
    Analyzes weather and marine data to compute:
    - Risk scores based on wave height, wind speed, and precipitation probability
    - Cross angles between wave and wind directions
    - Storm warnings when conditions are hazardous
    
    Returns hourly insights and summary statistics.
    """
    # Load and normalize data
    weather_df, marine_df = load_and_normalize_data()
    
    # Merge the datasets
    merged_df = merge_data(weather_df, marine_df)
    
    # Compute derived metrics
    result_df = compute_derived_metrics(merged_df)
    
    # Create insights list
    insights = []
    for _, row in result_df.iterrows():
        insight = HourlyInsight(
            time=row["timestamp"].isoformat(),
            waveHeight=round(float(row["waveHeight"]), 2),
            windSpeed=round(float(row["windSpeed"]), 2),
            pop=round(float(row["pop"]), 2),
            risk_score=round(float(row["risk_score"]), 3),
            cross_angle=round(float(row["cross_angle"]), 2),
            storm_flag=bool(row["storm_flag"]),
            temperature=round(float(row["temperature"]), 2) if pd.notna(row["temperature"]) else None,
            pressure=round(float(row["pressure"]), 2) if pd.notna(row["pressure"]) else None,
            seaLevel=round(float(row["seaLevel"]), 2) if pd.notna(row["seaLevel"]) else None
        )
        insights.append(insight)
    
    # Compute summary statistics
    max_risk_idx = result_df["risk_score"].idxmax()
    max_risk = float(result_df.loc[max_risk_idx, "risk_score"])
    max_risk_time = result_df.loc[max_risk_idx, "timestamp"].isoformat()
    
    storm_hours = result_df[result_df["storm_flag"]]["timestamp"].dt.strftime("%Y-%m-%d %H:%M:%S").tolist()
    
    summary = RotterdamSummary(
        max_risk=round(max_risk, 3),
        max_risk_time=max_risk_time,
        storm_hours=storm_hours,
        avg_wave_height=round(float(result_df["waveHeight"].mean()), 2),
        avg_wind_speed=round(float(result_df["windSpeed"].mean()), 2)
    )
    
    return RotterdamInsightsResponse(
        city="Rotterdam",
        insights=insights,
        summary=summary
    )


@router.get("/risk-timeline", response_model=RiskTimelineResponse)
async def get_risk_timeline():
    """
    Get risk timeline data for Chart.js line chart.
    
    Returns time series of risk scores with storm flags.
    Perfect for plotting risk over time with danger zones.
    """
    # Load and process data
    weather_df, marine_df = load_and_normalize_data()
    merged_df = merge_data(weather_df, marine_df)
    result_df = compute_derived_metrics(merged_df)
    
    # Create timeline data
    timeline = []
    for _, row in result_df.iterrows():
        timeline.append(TimelineDataPoint(
            time=row["timestamp"].isoformat(),
            risk_score=round(float(row["risk_score"]), 3),
            is_storm=bool(row["storm_flag"])
        ))
    
    return RiskTimelineResponse(
        city="Rotterdam",
        timeline=timeline,
        storm_threshold=0.7
    )


@router.get("/multi-metric", response_model=MultiMetricResponse)
async def get_multi_metric():
    """
    Get wave, wind, and rain data for multi-metric dashboard.
    
    Returns time series data for:
    - Wave height (meters)
    - Wind speed (m/s)
    - Rain probability (%)
    
    Includes threshold values for danger zones.
    """
    # Load and process data
    weather_df, marine_df = load_and_normalize_data()
    merged_df = merge_data(weather_df, marine_df)
    result_df = compute_derived_metrics(merged_df)
    
    # Create multi-metric data
    data = []
    for _, row in result_df.iterrows():
        data.append(MultiMetricDataPoint(
            time=row["timestamp"].isoformat(),
            waveHeight=round(float(row["waveHeight"]), 2),
            windSpeed=round(float(row["windSpeed"]), 2),
            rainProbability=round(float(row["pop"] * 100), 1)
        ))
    
    return MultiMetricResponse(
        city="Rotterdam",
        data=data,
        thresholds={
            "high_waves": 3.0,  # meters
            "strong_wind": 10.0,  # m/s
            "high_rain": 50.0  # percentage
        }
    )


@router.get("/risk-distribution", response_model=RiskDistributionResponse)
async def get_risk_distribution():
    """
    Get risk level distribution for pie/donut charts.
    
    Returns count and percentage of hours in each risk category:
    - Safe (risk < 0.3)
    - Moderate (0.3 ≤ risk < 0.5)
    - High (0.5 ≤ risk < 0.7)
    - Dangerous (risk ≥ 0.7)
    """
    # Load and process data
    weather_df, marine_df = load_and_normalize_data()
    merged_df = merge_data(weather_df, marine_df)
    result_df = compute_derived_metrics(merged_df)
    
    # Count risk levels
    risk_counts = result_df["risk_level"].value_counts().to_dict()
    
    # Ensure all categories exist (even if 0)
    distribution = RiskDistribution(
        Safe=risk_counts.get('Safe', 0),
        Moderate=risk_counts.get('Moderate', 0),
        High=risk_counts.get('High', 0),
        Dangerous=risk_counts.get('Dangerous', 0)
    )
    
    total = len(result_df)
    
    # Calculate percentages
    percentages = {
        "Safe": round(distribution.Safe / total * 100, 1) if total > 0 else 0,
        "Moderate": round(distribution.Moderate / total * 100, 1) if total > 0 else 0,
        "High": round(distribution.High / total * 100, 1) if total > 0 else 0,
        "Dangerous": round(distribution.Dangerous / total * 100, 1) if total > 0 else 0
    }
    
    return RiskDistributionResponse(
        city="Rotterdam",
        distribution=distribution,
        total_hours=total,
        percentages=percentages
    )
