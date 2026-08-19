import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from collectors.marine import get_marine_data


data = get_marine_data(
    latitude=19.0760,
    longitude=72.8777
)

print("Wave height:", data["wave_height"][0], "m")
print("Wave direction:", data["wave_direction"][0], "°")
print("Wave period:", data["wave_period"][0], "s")
print("Sea temperature:", data["sea_temperature"][0], "°C")
print("Current speed:", data["current_speed"][0], "km/h")
print("Current direction:", data["current_direction"][0], "°")
