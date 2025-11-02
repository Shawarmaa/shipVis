import os
import requests
import json

def update_marine_stats(lat: float, lon: float, start_time: str, end_time: str):
    """
    Function to fetch marinal data from Stormglass API and save to marine_data.json file
    """
    print("HELLO")
    params = 'waveHeight,waveDirection,currentSpeed,currentDirection,seaLevel'
    appid = os.getenv("MARINE_ID")
    print(appid, "WHAATTTTT")
    response = requests.get(
        'https://api.stormglass.io/v2/weather/point',
        params={
            'lat': lat,
            'lng': lon,
            'params': params,
            'start': start_time,
            'end': end_time
        },
        headers={
            'Authorization': appid
        }
    )
    print("WHYYYYY")
    response.raise_for_status() 
    data = response.json()
    print(data)
    
    print(json.dumps(data, indent=4))
    
    # Save the data to a file (Hackathon Strategy)
    with open('marine_data.json', 'w') as f:
        json.dump(data, f, indent=4)