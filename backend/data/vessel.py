import asyncio
import websockets
import json
from datetime import datetime, timezone
import os

from dotenv import load_dotenv
load_dotenv()
ports = ["ROTTERDAM"]


async def connect_ais_stream(bounding_box: list[list[float]], filter_ship_mmsi: list[str] = None,
                             filter_message_types: list[str] = ["ShipStaticData", "PositionReport"]):

    # Set to track MMSI of ships heading to Rotterdam
    ships_to_track = set()
    
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
                print(f"Tracking ship: {static_data.get('Name', 'Unknown')} (MMSI: {user_id}) -> {destination}")
        
            elif message_type == "PositionReport":
                position_data = message["Message"]["PositionReport"]
                user_id = position_data["UserID"]
                
                if user_id not in ships_to_track:
                    continue

                latitude = position_data.get("Latitude")
                longitude = position_data.get("Longitude")
                
                ship_name = message.get("MetaData", {}).get("ShipName", "Unknown")
                
                print(f"Position Update - {ship_name} (MMSI: {user_id}): Lat={latitude}, Lon={longitude}")

if __name__ == "__main__":
    asyncio.run(connect_ais_stream(bounding_box=[[-90, -180], [90, 180]]))
