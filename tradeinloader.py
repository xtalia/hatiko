import config as cf
import os
import gspread
import json
from oauth2client.service_account import ServiceAccountCredentials

def load():
    # Указываем область доступа к API
    scope = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']

    # Получаем ключ доступа к API из файла JSON
    credentials = ServiceAccountCredentials.from_json_keyfile_name((os.path.join(cf.dir_path, 'creds.json')), scope)

    # Авторизуемся в API с помощью ключа
    gc = gspread.authorize(credentials)

    # Открываем гугл таблицу по ссылке
    sh = gc.open_by_url('https://docs.google.com/spreadsheets/d/1ccfJRBEUib2eO58xhnGAu6T_VbfMCtVtTqRASZdqPn8/edit#gid=1724589221')

    # Список листов, с которых нужно собрать данные
    sheet_names = [
        'Для заполнения iPhone',
        'Для заполнения iPad',
        'Для заполнения Apple Watch',
        'Для заполнения Samsung',
        'Для заполнения Google Pixel',
    ]

    # Создаем пустой словарь для хранения данных в формате JSON
    data = {}

    # Функция для обработки листа iPhone
    def process_iphone_sheet(worksheet):
        values = worksheet.get_all_values()
        for row in values[1:]:
            model = row[0]
            if model not in data:
                data[model] = []
            record = {
                'memory': row[1],
                'ideal_price': row[2],
                'screen_replacement': row[3],
                'battery_wear': row[4],
                'battery_replacement': row[5],
                'device_only': row[6],
                'device_box': row[7],
                'scr_cond_medium': row[9],
                'scr_cond_low': row[10],
                'back_cover_cond_medium': row[11],
                'back_cover_cond_low': row[12],
            }
            data[model].append(record)

    # Функция для обработки листа iPad
    def process_ipad_sheet(worksheet):
        values = worksheet.get_all_values()
        for row in values[1:]:
            model = f"{row[0]} {row[1]}"  # Объединяем два столбца "Модель"
            if model not in data:
                data[model] = []
            record = {
                'memory': row[2],
                'ideal_price': row[3],
                'screen_replacement': row[4],
                'battery_replacement': row[5],
                'device_only': row[6],
                'device_box': row[7],
                'scr_cond_medium': row[8],
                'scr_cond_low': row[9],
                'back_cover_cond_medium': row[10],
                'back_cover_cond_low': row[11],
            }
            data[model].append(record)

    # Функция для обработки листа Apple Watch
    def process_apple_watch_sheet(worksheet):
        values = worksheet.get_all_values()
        for row in values[1:]:
            model = f"{row[0]} {row[1]}"  # Объединяем "Модель" и "Размер"
            if model not in data:
                data[model] = []
            record = {
                'ideal_price': row[2],
                'screen_replacement': row[3],
                'battery_replacement': row[4],
                'device_only': row[5],
                'device_box': row[6],
                'scr_cond_medium': row[7],
                'scr_cond_low': row[8],
                'back_cover_cond_medium': row[9],
                'back_cover_cond_low': row[10],
            }
            data[model].append(record)

    # Функция для обработки листов Samsung и Google Pixel
    def process_standard_sheet(worksheet):
        values = worksheet.get_all_values()
        for row in values[1:]:
            model = row[0]
            if model not in data:
                data[model] = []
            record = {
                'memory': row[1],
                'ideal_price': row[2],
                'screen_replacement': row[3],
                'battery_replacement': row[4],
                'device_only': row[5],
                'device_box': row[6],
                'scr_cond_medium': row[7],
                'scr_cond_low': row[8],
                'back_cover_cond_medium': row[9],
                'back_cover_cond_low': row[10],
            }
            data[model].append(record)

    # Перебираем каждый лист и обрабатываем его
    for sheet_name in sheet_names:
        worksheet = sh.worksheet(sheet_name)
        if sheet_name == 'Для заполнения iPhone':
            process_iphone_sheet(worksheet)
        elif sheet_name == 'Для заполнения iPad':
            process_ipad_sheet(worksheet)
        elif sheet_name == 'Для заполнения Apple Watch':
            process_apple_watch_sheet(worksheet)
        else:
            process_standard_sheet(worksheet)

    # Преобразуем словарь данных в JSON-строку с отступами для удобства чтения
    json_data = json.dumps(data, indent=4, ensure_ascii=False)

    # Выводим JSON-строку на экран
    print(json_data)

    # Сохраняем JSON-строку в файл
    with open('data.json', 'w', encoding='utf-8') as f:
        f.write(json_data)

if __name__ == "__main__":
    load()