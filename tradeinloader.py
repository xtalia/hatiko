# Импортируем необходимые библиотеки
import config as cf
import os
import gspread
import json
from oauth2client.service_account import ServiceAccountCredentials

def load():
        
    # Указываем область доступа к API
    scope = ['https://spreadsheets.google.com/feeds','https://www.googleapis.com/auth/drive']

    # Получаем ключ доступа к API из файла JSON
    credentials = ServiceAccountCredentials.from_json_keyfile_name((os.path.join(cf.dir_path,'creds.json')), scope)

    # Авторизуемся в API с помощью ключа
    gc = gspread.authorize(credentials)

    # Открываем гугл таблицу по ссылке
    sh = gc.open_by_url('https://docs.google.com/spreadsheets/d/1ccfJRBEUib2eO58xhnGAu6T_VbfMCtVtTqRASZdqPn8/edit#gid=1724589221')

    # Выбираем лист с данными
    worksheet = sh.worksheet('Для заполнения iPhone')

    # Получаем все значения из листа в виде списка списков
    values = worksheet.get_all_values()

    # Создаем пустой словарь для хранения данных в формате JSON
    data = {}

    # Проходим по всем строкам, начиная со второй (первая - заголовки столбцов)
    for row in values[1:]:
        # Получаем название модели из столбца A
        model = row[0]
        # Проверяем, есть ли уже такая модель в словаре данных
        if model not in data:
            # Если нет, то создаем для нее пустой список
            data[model] = []
        # Создаем словарь для хранения данных одной строки, кроме названия модели
        record = {}
        # Заполняем словарь значениями из столбцов, используя их названия в качестве ключей
        record['memory'] = row[1] # Столбец B - память
        record['ideal_price'] = row[2] # Столбец C - идеальная цена
        record['screen_replacement'] = row[3] # Столбец D - замена экрана
        record['battery_wear'] = row[4] # Столбец E - износ аккумулятора
        record['battery_replacement'] = row[5] # Столбец F - замена аккумулятора
        record['device_only'] = row[6] # Столбец G - только устройство
        record['device_box'] = row[7] # Столбец H - устройство+коробка
        record['back_cover_replacement'] = row[8] # Столбец I - замена задней крышки
        # Добавляем словарь в список данных для соответствующей модели
        data[model].append(record)

    # Преобразуем словарь данных в JSON-строку с отступами для удобства чтения
    json_data = json.dumps(data, indent=4)

    # Выводим JSON-строку на экран

    # Можем также сохранить JSON-строку в файл
    with open('data.json', 'w') as f:
        f.write(json_data)