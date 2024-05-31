import os
import json
import config as cf
import tradeinloader

def calculate_ideal_price(model, memory, battery_capacity, package, back_cover, screen, condition):
    data = load_data()

    if data is None:
        return "Error loading data"

    if model not in data:
        return "Model not found in data"
    
    params = None
    for item in data[model]:
        if item["memory"] == memory:
            params = item
            break

    if params is None:
        return "Memory configuration not found for the model"

    ideal_price = int(params["ideal_price"])

    if battery_capacity < 85:
        ideal_price += int(params["battery_replacement"])
    elif 85 <= battery_capacity < 90:
        ideal_price += int(params["battery_wear"])

    if package in ["Только устройство", "only_phone"]:
        ideal_price += int(params["device_only"])
    elif package in ["Устройство + коробка", "phone_box"]:
        ideal_price += int(params["device_box"])

    if back_cover:
        ideal_price += int(params["back_cover_replacement"])

    if screen:
        ideal_price += int(params["screen_replacement"])

    if condition in ["😐 Среднее", "medium"]:
        if ideal_price < 20000:
            ideal_price -= 2000
        else:
            ideal_price -= 1000
    elif condition in ["😢 Плохое", "bad"]:
        if ideal_price < 20000:
            ideal_price -= 3000
        else:
            ideal_price -= 2000

    return ideal_price

def load_data(force=False):
    if force:
        tradeinloader.load()
        return {"message": "load complete"}
    try:
        with open(os.path.join(cf.dir_path, 'data.json'), 'r') as f:
            data = json.load(f)
        return data
    except FileNotFoundError:
        tradeinloader.load()
        return None
    except Exception as e:
        print(f"Error loading data: {e}")
        tradeinloader.load()
        return None

# Эта функция уже не будет содержать Streamlit-специфичного кода
def wr_tn():
    import streamlit as st

    data = load_data()

    if data is None:
        st.error("Ошибка загрузки данных. Попробуйте обновить страницу.")
        return

    models = list(data.keys())
    result = ""

    model = st.selectbox("Выберите модель", models)
    memory_options = [item["memory"] for item in data[model]]
    memory = st.selectbox("Выберите память", memory_options)

    params = next(item for item in data[model] if item["memory"] == memory)

    battery_capacity = st.slider("Емкость аккумулятора", 0, 100, value=99)
    package = st.selectbox("Выберите комплектацию", ["Только устройство", "Устройство + коробка", "Полный"])
    back_cover = st.toggle(" Требуется **замена крышки** (очень сильно разбито, отсутствуют элементы)")
    screen = st.toggle("Требуется **замена экрана** (ошибка в настройках, разбит, отсутствуют элементы)")
    condition = st.select_slider("Выберите внешнее состояние", value="😎 Отличное", options=["😢 Плохое", "😐 Среднее", "😀 Хорошее", "😎 Отличное"])

    ideal_price = calculate_ideal_price(
        model,
        memory,
        battery_capacity,
        package,
        back_cover,
        screen,
        condition
    )

    result += (f"📲 {model} на {memory}  \n")
    result += (f"🔋Аккумулятор {battery_capacity}%  \n")
    result += (f"📦 Комплект {package}  \n")
    if not back_cover and not screen:
        result += (f"✅ Экран и задняя крышка не требуют замены  \n")
    result += (f"{condition}  состояние  \n")

    col1, col2 = st.columns(2)
    col1.write(result)
    col1.write(f"**💰Предварительная цена выкупа**: {ideal_price} рублей")
    col1.write("👉 ‍‍Окончательная стоимость будет известна только при непосредственной проверке в магазине")

    update_button = st.button("⚠️ Обновить данные с таблицы")
    if update_button:
        with st.spinner('Обновляем информацию'):
            tradeinloader.load()

# Это позволяет запускать функцию wr_tn() только если она запущена напрямую
if __name__ == "__main__":
    import streamlit as st
    wr_tn()
