from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware # To allow frontend to connect

import data.weather_fetch as weather_fetch
from dotenv import load_dotenv
# Download the required libraries using: pip install fastapi "uvicorn[standard]"
# To run, type the following command into the terminal:
# python -m uvicorn main:app --reload

load_dotenv()
app = FastAPI(
    title="Ship Visualization Backend",
    description="Backend API for Ship Visualization Application",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000", "http://127.0.0.1:8000"],  # Be more specific about allowed origins
    allow_credentials=True,
    allow_methods=["GET", "POST"],  # Specify the methods you actually use
    allow_headers=["*"],
)

# api endpoints

@app.get("/")
async def root():
    """Root endpoint to verify API is working"""
    return {"status": "online", "timestamp": datetime.now().isoformat()}

@app.get("/api/port_forecast")
def update_port_forecast(lat: float, lon: float):
    """
    Endpoint to get overwrite weather_data.json file with latest data from OpenWeatherMap API
    """
    try:
        weather_fetch.update_port_weather(lat=lat, lon=lon)
        return {"status": "success", "message": "Weather data file updated"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    