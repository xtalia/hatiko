# backend.py
import json
from fastapi import FastAPI
from pydantic import BaseModel
from py_clob_client.client import ClobClient
from py_clob_client.constants import POLYGON

app = FastAPI()

# Загрузка конфига
def load_config():
    with open("config.json", "r") as f:
        return json.load(f)

config = load_config()

# Инициализация клиента Polymarket
# В реальном коде добавим прокси и ключи
client = ClobClient(
    config['clob_api']['host'],
    key=config['clob_api']['key'],
    secret=config['clob_api']['secret'],
    passphrase=config['clob_api']['passphrase'],
    network_id=POLYGON
)

# Состояние трейлера (в памяти)
positions_state = {} 

@app.get("/status")
def get_status():
    return {"status": "Terminal Active", "wallet": config['wallet']['address']}

# Здесь будет цикл, который раз в секунду опрашивает цены
# и проверяет условия TP/SL