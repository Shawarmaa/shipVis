import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("API_KEY")
print(API_KEY)




def update_port_weather(lat: float, lon: float):
    """
    Function to overwrite weather_data.json file with latest data from OpenWeatherMap API
    """
    # We add '&units=metric' to get Celsius and meters/sec (not Fahrenheit/mph)
    print("we got here")
    API_KEY = os.getenv("API_KEY")
    print(API_KEY)
    url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={API_KEY}"

    response = requests.get(url)
    data = response.json()

    # 'list[0]' is the current 3-hour forecast
    print(data)
    with open("weather_data.json", 'w') as json_file:
        json.dump(data, json_file, indent=4)



    forecast_list = data['list']
    current_forecast = forecast_list[0]

    # --- PSI DATA ---
    wind_speed_mps = current_forecast['wind']['speed']  # Wind speed in meter/sec
    visibility_meters = current_forecast['visibility']  # Visibility in meters
    description = current_forecast['weather'][0]['description'] # e.g., "heavy intensity rain"

    print(f"Current Wind: {wind_speed_mps} m/s")
    print(f"Current Visibility: {visibility_meters} m")
    print(f"Current Conditions: {description}")

    # This is your *predictive* signal
    next_forecast = forecast_list[1]
    predicted_wind = next_forecast['wind']['speed']
    print(f"Wind in 3 hours: {predicted_wind} m/s")