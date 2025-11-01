import asyncio
import websockets
import json
from datetime import datetime, timezone
import os

from dotenv import load_dotenv
from models import ShipPositionData
load_dotenv()
ports = ["ROTTERDAM"]


async def predict_port_bound_ships(bounding_box: list[list[float]], filter_ship_mmsi: list[str] = None,
                             filter_message_types: list[str] = ["ShipStaticData", "PositionReport"]):
    """
    Async generator that yields ship position data for Rotterdam-bound vessels.
    Yields dict with ship data including position, speed, course, etc.
    """
    # Set to track MMSI of ships heading to Rotterdam
    ships_to_track = set()
    ship_static_info = {}  # Store static info for each ship
    
    async with websockets.connect("wss://stream.aisstream.io/v0/stream") as websocket:
        subscribe_message = {"APIKey": os.getenv("AIS_API_KEY"),  # Required !
                             "BoundingBoxes": [bounding_box], # Required!
                             "FiltersShipMMSI": filter_ship_mmsi, # Optional!
                             "FilterMessageTypes": filter_message_types} # Optional!

        subscribe_message_json = json.dumps(subscribe_message)
        await websocket.send(subscribe_message_json)
        
        async for message_json in websocket:
            message = json.loads(message_json)
            message_type = message["MessageType"]
            
            if message_type == "ShipStaticData":
                static_data = message["Message"]["ShipStaticData"]
                destination = static_data.get("Destination", "").strip()
                if destination not in ports:
                    continue
                if static_data["Eta"]["Month"] != 0:
                    continue
                user_id = static_data["UserID"]
                ships_to_track.add(user_id)
                
                # Store static info
                ship_static_info[user_id] = {
                    "name": static_data.get("Name", "Unknown"),
                    "call_sign": static_data.get("CallSign", ""),
                    "destination": destination,
                    "ship_type": static_data.get("Type", 0)
                }
                
                print(f"Tracking ship: {static_data.get('Name', 'Unknown')} (MMSI: {user_id}) -> {destination}")
        
            elif message_type == "PositionReport":
                position_data = message["Message"]["PositionReport"]
                user_id = position_data["UserID"]
                
                if user_id not in ships_to_track:
                    continue

                # Get ship name from stored static info or metadata
                ship_info = ship_static_info.get(user_id, {})
                ship_name = ship_info.get("name") or message.get("MetaData", {}).get("ShipName", "Unknown")
                
                # Build comprehensive ship data
                ship_data = ShipPositionData(
                    mmsi=user_id,
                    ship_name=ship_name,
                    latitude=position_data.get("Latitude"),
                    longitude=position_data.get("Longitude"),
                    speed=position_data.get("Sog", 0),  # Speed over ground
                    course=position_data.get("Cog", 0),  # Course over ground
                    heading=position_data.get("TrueHeading", 0),
                    nav_status=position_data.get("NavigationalStatus", 15),
                    timestamp=message.get("MetaData", {}).get("time_utc", datetime.now(timezone.utc).isoformat()),
                    destination=ship_info.get("destination", "ROTTERDAM"),
                    call_sign=ship_info.get("call_sign", ""),
                    ship_type=ship_info.get("ship_type", 0)
                )
                
                print(f"Position Update - {ship_name} (MMSI: {user_id}): Lat={ship_data.latitude}, Lon={ship_data.longitude}")
                
                # Yield the data for API consumption
                yield ship_data.model_dump()

async def get_all_ships(bounding_box: list[list[float]]):
    """
    Async generator that yields all ships in the bounding box.
    """
    async with websockets.connect("wss://stream.aisstream.io/v0/stream") as websocket:
        subscribe_message = {"APIKey": os.getenv("AIS_API_KEY"),  # Required !
                             "BoundingBoxes": [bounding_box], # Required!
                             "FiltersShipMMSI": None, # Optional!
                             "FilterMessageTypes": ["PositionReport"]} # Optional!
        subscribe_message_json = json.dumps(subscribe_message)
        await websocket.send(subscribe_message_json)
        
        async for message_json in websocket:
            message = json.loads(message_json)
            position_data = message["Message"]["PositionReport"]
            print(position_data)
            user_id = position_data["UserID"]
            ship_data = ShipPositionData(
                    mmsi=user_id,
                    ship_name=message.get("MetaData", {}).get("ShipName", "Unknown"),
                    latitude=position_data.get("Latitude"),
                    longitude=position_data.get("Longitude"),
                    speed=position_data.get("Sog", 0),  # Speed over ground
                    course=position_data.get("Cog", 0),  # Course over ground
                    heading=position_data.get("TrueHeading", 0),
                    nav_status=position_data.get("NavigationalStatus", 15),
                    timestamp=message.get("MetaData", {}).get("time_utc", datetime.now(timezone.utc).isoformat()),
                    destination="",
                    call_sign="",
                    ship_type=0
            )
            
            # IMPORTANT: Yield the data to return it from the generator
            yield ship_data.model_dump()

async def main():
    """Test function to run the ship tracker"""
    async for ship_data in get_all_ships(bounding_box=[[-90, -180], [90, 180]]):
        print(ship_data)
    
if __name__ == "__main__":
    asyncio.run(main())
