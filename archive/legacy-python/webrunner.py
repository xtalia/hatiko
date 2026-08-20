import streamlit as st
from wr_tradein import wr_tn
from as_calculator import *
from wr_avitoplag import find_models
import os
import config as cf

st.set_page_config(
    page_title="Мемный Чат",
    page_icon="🧊",
    layout="wide",
    initial_sidebar_state="expanded"
)



st.header('Мемный Чат', divider='violet')
st.header('_Streamlit_ is :blue[cool] :sunglasses:')

# Создаем три вкладки: Анализ данных, Визуализация и Машинное обучение
tab = st.tabs(["Трейдин", "Калькуляторы", "Avito Классификатор","ddd"])

# В первой вкладке вызываем функцию из модуля tab1
with tab[0]:
    wr_tn()

with tab[1]:
    st.subheader("Калькулятор карты, кредита, кешбека")
    cash = float(st.text_input("Введите сумму наличными:", value=228))
    credit_month = int(st.slider("Срок кредитования", 1,36,value=36))
    output = cash_amount(cash,credit_month)
    st.code(output)

    st.divider()

    st.subheader("Калькулятор скидки для мс")
    original = float(st.text_input("Введите изначальную цену:", value=228))
    discount = float(st.text_input("Введите сумму скидки:", value=228))

    if st.button("Посчитать"):
        result = process_discount(original,discount)
        st.code(result)
    
    
with tab[2]:
    # Вызываем функцию find_models с нужными аргументами и получаем результат
    model = st.text_input("Введите модель (например 15 Pro)", value="15 pro")
    found_models = find_models(os.path.join(cf.dir_path, 'phones.xml'), model)

    # Проверяем, найдены ли модели
    if found_models:
        # Выводим заголовок с количеством найденных моделей
        st.header(f"Найдено {len(found_models)} моделей")
        # Выводим данные в виде таблицы
        st.dataframe(found_models)
    else:
        # Выводим сообщение, что модели не найдены
        st.write("Модели не найдены")
        
with tab[3]:
    pass