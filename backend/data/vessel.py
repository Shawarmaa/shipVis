import asyncio
import websockets
import json
from datetime import datetime, timezone
import os

from dotenv import load_dotenv
load_dotenv()
ports = ["ROTTERDAM"]


async def connect_ais_stream(bounding_box: list[list[float]], filter_ship_mmsi: list[str] = None,
                             filter_message_types: list[str] = ["ShipStaticData"]):

    async with websockets.connect("wss://stream.aisstream.io/v0/stream") as websocket:
        subscribe_message = {"APIKey": os.getenv("AIS_API_KEY"),  # Required !
                             "BoundingBoxes": [bounding_box], # Required!
                             "FiltersShipMMSI": filter_ship_mmsi, # Optional!
                             "FilterMessageTypes": filter_message_types} # Optional!

        subscribe_message_json = json.dumps(subscribe_message)
        await websocket.send(subscribe_message_json)
        output = []
        async for message_json in websocket:
            message = json.loads(message_json)

            message_type = message["MessageType"]
            if message_type != "ShipStaticData":
                continue
            
            if message["Message"]["ShipStaticData"]["Destination"].strip() not in ports:
                continue
            
            print(message["Message"]["ShipStaticData"])
            


            
            

if __name__ == "__main__":
    asyncio.run(asyncio.run(connect_ais_stream(bounding_box=[[-90, -180], [90, 180]])))
