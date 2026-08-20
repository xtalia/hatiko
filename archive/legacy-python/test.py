import json
from json import dumps, loads

# Sample data in Cyrillic format
data = {
    "name": "Иван Иванов",
    "age": 30,
    "city": "Москва"
}

# Convert Python dictionary to JSON string
json_data = dumps(data)

print("JSON Data:")
print(json_data)

try:
    # Import JSON data and print it as a Python dictionary
    imported_data = loads(json_data)
    print("\nImported Data (Python Dictionary):")
    print(imported_data)
except json.JSONDecodeError:
    print(f"Error decoding JSON: {json_error.msg}")