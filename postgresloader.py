from config import config_data as creds
import psycopg2
from psycopg2.extras import RealDictCursor
import json
import time
from threading import Timer
import requests
from bs4 import BeautifulSoup
import config

DB_LOGIN = creds["db"]["login"]
DB_PASS = creds["db"]["pass"]
DB_HOST = creds["db"]["host"]
DB = creds["db"]["db"]


# Cache to hold the data
cache_file = 'cache.json'
last_updated = 0
cache_duration = 31 * 60  # 30 minutes
cities = {
    '🆂': ('price_saratov', 'recommended_saratov'),
    '🆅': ('price_voronezh', 'recommended_voronezh'),
    '🅻': ('price_lipetsk', 'recommended_lipetsk'),
    '🅱️': ('price_balakovo', 'recommended_balakovo')
}



def get_db_connection():
    pass
    return psycopg2.connect(
        host=DB_HOST,
        database=DB,
        user=DB_LOGIN,
        password=DB_PASS
    )

def load_cache():
    pass
    global cache, last_updated
    try:
        with open(cache_file, 'r') as f:
            data = json.load(f)
            cache = data['cache']
            last_updated = data['last_updated']
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error loading cache: {e}")
        cache = None
        last_updated = 0

def save_cache():
    global cache, last_updated
    with open(cache_file, 'w') as f:
        json.dump({'cache': cache, 'last_updated': last_updated}, f)

def map_to_english(item):
    return {
        'id': item['Артикул'],  # Уникальный идентификатор
        'article': item['Артикул'],
        'external_code': item['Внешний код'],
        'name': item['Наименование'],
        'competitor_shop': item['Магазин конкурент'],
        'competitor_price': item['Цена конкурента'],
        'store_saratov': item['Магазин Саратов'],
        'store_voronezh': item['Магазин Воронеж'],
        'store_lipetsk': item['Магазин Липецк'],
        'store_balakovo': item['Магазин Балаково'],
        'price_saratov': item['Цена: Саратов'],
        'price_voronezh': item['Цена: Воронеж'],
        'price_lipetsk': item['Цена: Липецк'],
        'price_balakovo': item['Цена: Балаково'],
        'recommended_saratov': item['Рекомендуемая Саратов'],
        'recommended_voronezh': item['Рекомендуемая Воронеж'],
        'recommended_lipetsk': item['Рекомендуемая Липецк'],
        'recommended_balakovo': item['Рекомендуемая Балаково']
    }


def update_cache(force=False):
    global cache, last_updated
    if not force and (time.time() - last_updated < cache_duration):
        return
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('SELECT * FROM table_bots')
        data = cur.fetchall()
        cur.close()
        conn.close()
        
        cache = {}
        for item in data:
            mapped_item = map_to_english(item)
            cache[mapped_item['id']] = mapped_item
        
        last_updated = time.time()
        save_cache()
        print("Cache updated")
    except Exception as e:
        print(f"Error updating cache: {e}")
        if cache is None:
            raise


# Automatically update the cache every 44 minutes
def schedule_cache_update():
    Timer(cache_duration, schedule_cache_update).start()
    update_cache()

# Initial cache load and update
load_cache()
update_cache()
schedule_cache_update()

def search_cache(query):
    if isinstance(query, str):
        results = [item for item in cache.values() if query.lower() in item["name"].lower()]
        return results[:10]  # Возвращаем первые пять результатов
    elif isinstance(query, int):
        return cache.get(str(query))
    return []

def check_price_condition(price, recommended):
    if price is None or recommended is None:
        return 'Нет данных'
    return '😀 проходим' if price >= recommended else '😢 не проходим'

def format_response(item):
    
 
    prices_info = "\n".join(
    f"💰 {key}: {item[price]} {check_price_condition(item[price], item[recommended])}"
    for key, (price, recommended) in cities.items()
    )
    
    if not item:
        return "No data found"

    template = f"""
🆔 {item['article']}
🔢 {item['external_code']}
🏷️ {item['name']}
{prices_info}

🤔 Отдаем? Сможете привезти?
"""
    # 📦 Есть: 🆂 {item['store_saratov']}, 🆅 {item['store_voronezh']}, 🅻 {item['store_lipetsk']}, 🅱️ {item['store_balakovo']}
    # 💖 Рекомендуемые цены: 🆂 {item['recommended_saratov']}, 🆅 {item['recommended_voronezh']}, 🅻 {item['recommended_lipetsk']}, 🅱️ {item['recommended_balakovo']}
    return template.strip()

def handle_query(query):
    send_data(query)
    # try:
    #     update_cache()
    # except Exception as e:
    #     if isinstance(query, int):
    #         print(f"Error updating cache: {e}")
    #         return f"Server error: {e}. Try again later."
    #     else:
    #         return "Server error, send the request as a number and contact Ivan."

    # if isinstance(query, str) and not query.isdigit():
    #     results = search_cache(query)
    #     if not results:
    #         return "No data found"
    #     return "\n\n".join([format_response(item) for item in results])
    # elif query.isdigit():
    #     result = search_cache(int(query))
    #     if result:
    #         return format_response(result)
    #     else:
    #         return "No data found"
    # else:
    #     return "Invalid query"

def send_data(message):
    search_query = message # получаем текст сообщения от пользователя
    for word in config.SITE_TRIGGERS: # для каждого слова в словаре
        search_query = search_query.replace (word, "")
    
    base_urls = [ # список базовых url для трех городов
    "https://hatiko.ru",
    "https://voronezh.hatiko.ru",
    "https://lipetsk.hatiko.ru",
    "https://balakovo.hatiko.ru"
]
    urls = [ # список url для трех городов
        f"https://hatiko.ru/search/?query={search_query}",
        f"https://voronezh.hatiko.ru/search/?query={search_query}",
        f"https://lipetsk.hatiko.ru/search/?query={search_query}",
        f"https://balakovo.hatiko.ru/search/?query={search_query}"
    ]
    data = [] # список для хранения данных
    for url in urls: # для каждого url
        response = requests.get(url) # делаем запрос
        soup = BeautifulSoup(response.text, "html.parser") # парсим html
        product = soup.find("a", class_="s-product-header") # находим элемент с заголовком и ссылкой
        if product: # если такой элемент есть
            title = product["title"] # получаем заголовок
            link = product["href"] # получаем ссылку
            price = soup.find("span", class_="price").text.replace(" ", "") # находим элемент с ценой и убираем пробел
            data.append((title, price, link)) # добавляем кортеж с данными в список
        else: # если такого элемента нет
            data.append(("Нет данных", "Нет данных", "Нет данных")) # добавляем кортеж с пустыми данными в список
    # формируем сообщение с данными
    for i in range(len(data)): # для каждого элемента в списке данных
        data[i] = (data[i][0], data[i][1], base_urls[i] + data[i][2]) # заменяем относительный url на абсолютный url, соединяя базовый url с относительным url
    message_text = f"🧭 {data[0][0]}\n" # заголовок одинаковый для всех городов, берем первый элемент
    message_text += f"🪙🆂 {data[0][1]}\n" # цена для Саратова
    message_text += f"🪙🆅 {data[1][1]}\n" # цена для Воронежа
    message_text += f"🪙🅻 {data[2][1]}\n" # цена для Липецка
    message_text += f"🪙🗿 {data[3][1]}\n\n" # цена для Bal
    message_text += f"🌐🆂: {data[0][2]}\n" # ссылка для Саратова
    message_text += f"🌐🆅: {data[1][2]}\n" # ссылка для Воронежа
    message_text += f"🌐🅻: {data[2][2]}\n" # ссылка для Липецка
    message_text += f"🌐🗿: {data[3][2]}" # ссылка для Bal
    
    return message_text


# Example usage
if __name__ == "__main__":

    while True:
        query = input("Enter search query (text or article number): ")
        print(handle_query(query))
