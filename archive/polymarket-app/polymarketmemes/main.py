# app.py
import streamlit as st
import requests

# Настройка страницы
st.set_page_config(page_title="Polymarket Terminal", layout="wide")

API_URL = "http://127.0.0.1:8000"

st.title("📈 Polymarket Торговый Терминал")

# --- БЛОК 1: Глобальные настройки (полуавтоматический трейдер) ---
st.header("⚙️ Глобальные настройки")
col1, col2, col3, col4 = st.columns(4)

with col1:
    tp_input = st.number_input("[Тейк-профит] (%)", min_value=0.0, value=10.0, step=1.0)
    trailing_tp = st.checkbox("*Trailing тейк-профит", value=False)
with col2:
    sl_input = st.number_input("[Стоп-лосс] (%)", min_value=0.0, value=5.0, step=1.0)
with col3:
    slippage_input = st.number_input("[Проскальзывание] (%)", min_value=0.0, value=1.0, step=0.1, help="На сколько % ниже ставить ордер для точного исполнения")
with col4:
    st.write("") # Пустая строка для выравнивания
    if st.button("<Сохранить настройки>"):
        # Отправляем настройки на бэкенд
        requests.post(f"{API_URL}/settings", json={
            "tp_percent": tp_input,
            "trailing_tp_enabled": trailing_tp,
            "sl_percent": sl_input,
            "slippage_percent": slippage_input
        })
        st.success("Настройки сохранены!")

st.divider()

# --- БЛОК 2: Список рынков и позиций ---
st.header("📊 Мои позиции")

# Получаем позиции с бэкенда
try:
    response = requests.get(f"{API_URL}/positions")
    positions = response.json()
    
    # Группируем позиции по рынкам для красивого отображения
    markets = {}
    for pos in positions:
        if pos["market_name"] not in markets:
            markets[pos["market_name"]] = []
        markets[pos["market_name"]].append(pos)

    # Отрисовываем каждый рынок
    for market_name, market_positions in markets.items():
        st.subheader(f"🌐 {market_name}")
        
        for pos in market_positions:
            # Считаем текущую прибыль/убыток
            profit_loss = (pos["current_price"] - pos["cost_per_share"]) / pos["cost_per_share"] * 100
            color = "green" if profit_loss >= 0 else "red"
            
            p_col1, p_col2, p_col3, p_col4 = st.columns([3, 1, 1, 1])
            
            with p_col1:
                st.markdown(f"**Позиция {pos['direction']}** | Долей: {pos['shares_count']} | Куплено по: ${pos['cost_per_share']} | Текущая: ${pos['current_price']} (<span style='color:{color}'>{profit_loss:.2f}%</span>)", unsafe_allow_html=True)
            
            with p_col2:
                if st.button("<Продать сейчас>", key=f"sell_{market_name}_{pos['direction']}"):
                    requests.post(f"{API_URL}/sell?market_name={market_name}&direction={pos['direction']}")
                    st.toast(f"Отправлен ордер на продажу: {market_name}")
            
            with p_col3:
                # В будущем тут можно сохранять состояние чекбоксов для каждой позиции индивидуально
                st.checkbox("*TP", value=True, key=f"tp_{market_name}_{pos['direction']}")
            with p_col4:
                st.checkbox("*SL", value=True, key=f"sl_{market_name}_{pos['direction']}")
                
        st.write("---")

except Exception as e:
    st.error(f"Не удалось подключиться к ядру терминала. Убедитесь, что FastAPI запущен. Ошибка: {e}")

# --- БЛОК 3: Лог событий ---
st.header("📝 Лог событий")
try:
    logs_response = requests.get(f"{API_URL}/logs")
    logs = logs_response.json()
    
    log_text = ""
    for log in reversed(logs): # Показываем новые сверху
        log_text += f"[{log['time']}] {log['message']}\n"
        
    st.text_area("Последние действия ядра:", value=log_text, height=150, disabled=True)
except:
    st.info("Ожидание логов...")