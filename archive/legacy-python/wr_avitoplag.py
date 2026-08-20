import streamlit as st
import xml.etree.ElementTree as ET
import os
import config as cf

# Определяем функцию find_models, которая принимает имя XML файла и модель телефона в качестве аргументов
def find_models(file_name, model):
    # Читаем XML файл
    tree = ET.parse(file_name)
    root = tree.getroot()

    # Поиск информации по модели
    found_models = []
    for vendor in root.findall('Vendor'):
        vendor_name = vendor.get('name')
        for model_element in vendor.findall('Model'):
            model_name = model_element.get('name')
            if model.lower() in model_name.lower():
                memory_sizes = model_element.findall('MemorySize')
                colors = set()
                ram_sizes = set()

                # Собираем информацию о цветах и ОЗУ
                for memory_size in memory_sizes:
                    for color in memory_size.findall('Color'):
                        colors.add(color.get('name'))
                    for ram_size in memory_size.findall('Color/RamSize'):
                        ram_sizes.add(ram_size.get('name'))

                # Формируем словарь с информацией
                result_dict = {
                    "vendor": vendor_name,
                    "model": model_name,
                    "memory": ', '.join(memory_size.get('name') for memory_size in memory_sizes),
                    "ram": ', '.join(ram_sizes),
                    "color": ', '.join(colors)
                }

                # Добавляем словарь в список найденных моделей
                found_models.append(result_dict)

    # Возвращаем список найденных моделей или пустой список, если модели не найдены
    return found_models
