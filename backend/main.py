from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Query
from pydantic import BaseModel
from datetime import datetime, timedelta
from fastapi.middleware.cors import CORSMiddleware # To allow frontend to connect
import json

import data.weather_fetch as weather_fetch
import data.news_fetch as news_fetch
import data.vessel as vessel
from dotenv import load_dotenv
# Download the required libraries using: pip install fastapi "uvicorn[standard]"
# To run, type the following command into the terminal:
# python -m uvicorn main:app --reload

load_dotenv()
app = FastAPI(
    title="Ship Visualization Backend",
    description="""
    Backend API for Ship Visualization Application
    
    ## WebSocket Endpoints (Not shown in Swagger)
    
    ### `/ws/ships` - Live Ship Tracking
    - **Protocol:** WebSocket
    - **URL:** `ws://localhost:8000/ws/ships?port={port_name}`
    - **Description:** Streams real-time position data for ships heading to the specified port
    - **Query Parameters:** `port` (required) - Name of the destination port (e.g., "ROTTERDAM", "HAMBURG", "ANTWERP")
    - **Data Format:** JSON with fields: mmsi, ship_name, latitude, longitude, speed, course, heading, nav_status, timestamp, destination, call_sign, ship_type
    
    Connect using: `const ws = new WebSocket('ws://localhost:8000/ws/ships?port=ROTTERDAM');`
    """,
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000", "http://127.0.0.1:8000", "http://localhost:5173"],  # Common frontend ports
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
    
@app.get("/api/news_fetch")
def get_news(
    locations: str, 
    start_date: str = Query(default_factory= lambda: (datetime.now() - timedelta(hours=96)).isoformat()),
    end_date: str = Query(default_factory= lambda: datetime.now().isoformat())
):
    """
    Endpoint to get overwrite weather_data.json file with latest data from OpenWeatherMap API
    """
    try:
        articles = news_fetch.query_news_api(locations, start_date=start_date, end_date=end_date)
        print(articles)
        #return {articles}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.websocket("/ws/ships")
async def websocket_ship_tracking(websocket: WebSocket, port: str = Query(...)):
    """
    WebSocket endpoint that streams real-time ship positions for the given port.
    Frontend connects to ws://localhost:8000/ws/ships?port={port_name} to receive live updates.
    
    Args:
        port: Name of the destination port (e.g., "ROTTERDAM", "HAMBURG", "ANTWERP")
    """
    await websocket.accept()
    
    try:
        # Start streaming ship data from AIS
        # Using global bounding box to track all ships heading to Rotterdam
        async for ship_data in vessel.predict_port_bound_ships(
            bounding_box=[[-90, -180], [90, 180]],
            port=port
        ):
            # Send ship position data to frontend
            await websocket.send_json(ship_data)
            
    except WebSocketDisconnect:
        print("WebSocket client disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")
        await websocket.close()

@app.websocket("/ws/all_ships")
async def websocket_all_ships(websocket: WebSocket):
    """
    WebSocket endpoint that streams real-time position data for all ships in the bounding box.
    Frontend connects to ws://localhost:8000/ws/all_ships to receive live updates.
    """
    await websocket.accept()
    try:
        async for ship_data in vessel.get_all_ships(bounding_box=[[-90, -180], [90, 180]]):
            await websocket.send_json(ship_data)
    except WebSocketDisconnect:
        print("WebSocket client disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")
        await websocket.close()