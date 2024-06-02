from datetime import datetime, timedelta
import json
import os.path
import config
from oauth2client.service_account import ServiceAccountCredentials
import gspread

WW_LINK = config.WW_LINK
WW_PLACES = config.WW_PLACES
CACHE_FILENAME = "whowork.json"

def load_data():
    try:
        # Check if cache file exists and is not older than 4 hours
        if os.path.exists(CACHE_FILENAME):
            with open(CACHE_FILENAME, 'r', encoding='utf-8') as f:
                cache_data = json.load(f)
            cache_timestamp = cache_data.get('timestamp')
            if cache_timestamp and (datetime.now() - datetime.strptime(cache_timestamp, "%Y-%m-%d %H:%M:%S")) < timedelta(hours=4):
                return cache_data
        
        # If cache file doesn't exist or is older than 4 hours, fetch data from Google Sheets
        cred_json = config.cred_json
        scope = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/spreadsheets']
        creds = ServiceAccountCredentials.from_json_keyfile_dict(cred_json, scope)
        client = gspread.authorize(creds)

        sheet = client.open_by_url(WW_LINK).get_worksheet(0)

        today_column = datetime.now().day + 1
        tomorrow_column = (datetime.now() + timedelta(days=1)).day + 1

        values_a_today = sheet.col_values(1)[3:]
        values_b_today = sheet.col_values(today_column)[3:]
        values_a_tomorrow = sheet.col_values(1)[3:]
        values_b_tomorrow = sheet.col_values(tomorrow_column)[3:]

        employee_info_today = []
        employee_info_tomorrow = []

        for a, b in zip(values_a_today, values_b_today):
            if a and a.startswith('!'):
                employee_info_today.append(f"\n🏢 В городе: {a[1:]} {b}\n")
            elif b:
                a = WW_PLACES.get(a, a)
                b = WW_PLACES.get(b, b)
                employee_info_today.append(f"👤 {a}: {b}")

        for a, b in zip(values_a_tomorrow, values_b_tomorrow):
            if a and a.startswith('!'):
                employee_info_tomorrow.append(f"\n🏢 В городе: {a[1:]} {b}\n")
            elif b:
                a = WW_PLACES.get(a, a)
                b = WW_PLACES.get(b, b)
                employee_info_tomorrow.append(f"👤 {a}: {b}")

        data = {
            'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'today': employee_info_today,
            'tomorrow': employee_info_tomorrow
        }

        with open(CACHE_FILENAME, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)

        return data

    except Exception as e:
        print(f"Error loading data: {e}")
        return None

def get_employee_info(day):
    data = load_data()

    if not data:
        return "Ошибка загрузки данных."

    day_text = 'Сегодня' if day == 'today' else 'Завтра'
    employee_info = data.get(day, [])

    if employee_info:
        text = f"{day_text} ({(datetime.now() + timedelta(days=0 if day == 'today' else 1)).strftime('%d.%m.%Y')}) работают:\n" + '\n'.join(employee_info)
    else:
        text = f"{day_text} ({(datetime.now() + timedelta(days=0 if day == 'today' else 1)).strftime('%d.%m.%Y')}) никто не работает"

    return text

if __name__ == "__main__":
    # Пример использования
    print(get_employee_info('today'))
    print(get_employee_info('tomorrow'))
