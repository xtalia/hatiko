import xml.etree.ElementTree as ET

def process_model_input(bot, message):
    model = message.text
    # Читаем XML файл
    tree = ET.parse('phones.xml')
    root = tree.getroot()

    # Поиск информации по Model
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

                # Формируем сообщение с информацией
                result_message = f"📱 {vendor_name}\n"
                result_message += f"📲: {model_name}\n"
                result_message += f"💾: {', '.join(memory_size.get('name') for memory_size in memory_sizes)}\n"
                result_message += f"💽: {', '.join(ram_sizes)}\n"
                result_message += "🖼️ " + ', '.join(colors) + "\n"

                found_models.append(result_message)

    # Проверяем, найдены ли модели
    if found_models:
        for model_message in found_models:
            bot.send_message(message.chat.id, model_message)
    else:
        bot.send_message(message.chat.id, "Модели не найдены")