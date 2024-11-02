# Если в гугл колабе запускаешь, то сначала запусти код выше
# Импорты родных
import json
import os
import sys
import time
import traceback
import threading

# Импорты заморских
import telebot
from telebot import types

import config
from as_calculator import cash_amount, process_discount
import megacalculator
import who_work
from sn_cutter import sn_cutter
from usd_rate import handle_usd_rate
import genpdf
from phone_classifier import process_model_input
if config.cred_json != "":
    from postgresloader import update_cache, handle_query, send_data


directory = os.path.dirname(os.path.abspath(__file__))
files = os.listdir(directory)
python_files = [file for file in files if file.endswith(('.py', '.docx', '.xml', '.json'))]

cred_json = config.cred_json
config_data = config.config_data

ERROR_CHAT_ID = '184944023'  # Кому присылать сообщения об ошибке?
DEBUG_LVL = False if os.environ.get('DEBUG') else True
print(os.environ.get('DEBUG'))
print(DEBUG_LVL)

bot = telebot.TeleBot(config_data["bot"]["token_debug"] if DEBUG_LVL == True else config_data["bot"]["token"], skip_pending=True)

# Кнопки и триггеры
welcome_message = "Я умею многое\nТы можешь мне отправить название товара или артикул, нажать на эти кнопки внизу или в меню выбрать что надо"
keyboard = telebot.types.ReplyKeyboardMarkup(row_width=2)
keyboard.add(
    telebot.types.KeyboardButton("Калькулятор"),
    telebot.types.KeyboardButton("Скидка"),
    telebot.types.KeyboardButton("ТрейдинДок"),
    telebot.types.KeyboardButton("Кто работает"),
    telebot.types.KeyboardButton("Курс доллара")
)

continue_iteration = False

# Функции

def handle_exception(e):
    tb_str = traceback.format_exception(type(e), e, e.__traceback__)
    tb_str = ''.join(tb_str)
    text = f'Error occurred:\n{tb_str}'
    bot.send_message(ERROR_CHAT_ID, text)


def main():
    while True:
        try:
            bot.polling(none_stop=True, interval=0)
        except Exception as e:
            handle_exception(e)
        time.sleep(5)


## Даже не знаю зачем, но пусть будет
def contact_us(message):
    bot.send_message(message.chat.id, "Все вопросы Сергею из Балаково")


## Тестовая функция для обкатки
def test_table(message):
    global DEBUG_LVL
    if DEBUG_LVL:
        DEBUG_LVL = False
    else:
        DEBUG_LVL = True

# Запуск бота с кнопками

@bot.message_handler(commands=['start'])
def start_command(message):  # Приветственное сообщение
    bot.send_message(message.chat.id, welcome_message)
    bot.send_message(message.chat.id, "Напиши запрос или нажми на кнопки внизу", reply_markup=keyboard)

@bot.message_handler(func=lambda message: message.text.lower() in config.UPDATE_TRIGGERS)
def update_buttons(message):  # Выдает сообщение, выдавая кнопки
    bot.send_message(message.chat.id, "Обновлены кнопки", reply_markup=keyboard)

@bot.message_handler(func=lambda message: message.text.lower() in config.TEST_TRIGGERS)
def handle_test(message):  # Выполнение тестовой функции
    test_table(message)

@bot.message_handler(func=lambda message: message.text == "Contact us")
def handle_contact_us(message):  # Контактус
    contact_us(message)



### FUNC
## Калькулятор по карте, рассрочке-кредиту и кешбека, скидка
@bot.message_handler(func=lambda message: message.text.lower() in config.CALCULATE_TRIGGERS)
def calculate_prices(message):  # Запуск калькулятора
    if message.text.lower() in ["скидка", "crblrf", '/discount']:
        bot.send_message(chat_id=message.chat.id, text="Сумма без скидки:")
        bot.register_next_step_handler(message, lambda msg: discount_price(msg))
    else:
        bot.send_message(chat_id=message.chat.id, text="Сколько за наличные:")
        bot.register_next_step_handler(message, lambda msg: bot.send_message(chat_id=msg.chat.id, text=cash_amount(float(msg.text))))

def discount_price(message):
    try:
        original_price = float(message.text)
        bot.send_message(message.chat.id, "Введите скидку:")
        bot.register_next_step_handler(message, lambda msg: bot.send_message(chat_id=msg.chat.id, text=process_discount(original_price,float(msg.text))))
    except:
        bot.send_message(message.chat.id, "Что-то пошло не так, используй цифры")


## Обрезчик S у серийников
@bot.message_handler(func=lambda message: message.text.lower() in config.SN_TRIGGERS)
def handle_serial_number_cutter(message):
    bot.send_message(message.chat.id, "Введите серийный номер для обрезки:")
    # регистрируем следующий обработчик для ответа пользователя
    bot.register_next_step_handler(message, lambda msg: sn_cutter(msg, bot))

# Кто работает сегодня или завтра
@bot.message_handler(func=lambda message: message.text.lower() in config.WW_TRIGGERS)
def handle_who_work(message):
    markup = types.InlineKeyboardMarkup()
    today_button = types.InlineKeyboardButton(text='Сегодня', callback_data='today')
    tomorrow_button = types.InlineKeyboardButton(text='Завтра', callback_data='tomorrow')
    markup.add(today_button, tomorrow_button)
    bot.send_message(message.chat.id, "Хочешь узнать кто работает?", reply_markup=markup)

@bot.callback_query_handler(func=lambda call: call.data in ['today', 'tomorrow'])
def handle_ww_callback_query(call):
    text = who_work.get_employee_info(call.data)
    bot.send_message(chat_id=call.message.chat.id, text=text)

## Запуск мегакалькулятора
@bot.message_handler(func=lambda message: message.text.lower() in config.MEGACALC_TRIGGERS)
def handle_megacalculator(message):
    megacalculator.start_megacalculator(bot, message)

## Запуск Курса валют
@bot.message_handler(func=lambda message: message.text.lower() in config.USD_RATE_COMMANDS)
def start_usd_rate(message):
    handle_usd_rate(bot, message)

## Классификатор Авито
@bot.message_handler(func=lambda message: message.text.lower() in config.CLASSIFICATOR_TRIGGERS)
def handle_classifier_command(message):
    # Отправляем запрос на поиск по Model
    bot.send_message(message.chat.id, "Что вы хотите найти по Model?")
    bot.register_next_step_handler(message, lambda msg: process_model_input(bot, msg))

## Генерация документа для трейд-ин
@bot.message_handler(func=lambda message: message.text.lower() in config.GENPDF_TRIGGERS)
def handle_generate_pdf(message):
    genpdf.start_survey(bot, message)

### Обработчики команд
@bot.message_handler(commands=['restart'])
def handle_restart(message):
    bot.send_message(message.chat.id, "Еще раз")
    os.execl(sys.executable, sys.executable, *sys.argv)

@bot.message_handler(commands=['export_config'])
def export_config(message):
    if message.from_user.id != 184944023:
        bot.send_message(message.chat.id, f"В доступе отказано. Вы не Сергей {message.from_user.id}")
    else:
        # Создание инлайн-клавиатуры с кнопками файлов
        keyboard = types.InlineKeyboardMarkup()
        for file in python_files:
            callback_data = f'export_config_{file}'
            button = types.InlineKeyboardButton(file, callback_data=callback_data)
            keyboard.add(button)

        bot.send_message(message.chat.id, "Выберите файл для экспорта:", reply_markup=keyboard)


@bot.callback_query_handler(func=lambda call: call.data.startswith('export_config_'))
def handle_export_config(callback_query):
    file_name = callback_query.data.replace('export_config_', '')
    file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), file_name)

    with open(file_path, 'rb') as file:
        bot.send_document(callback_query.message.chat.id, file)
        bot.send_message(callback_query.message.chat.id, f"Модуль {file_name} выгружен.")

@bot.message_handler(content_types=['document'])
def handle_config_file(message):
    if message.from_user.id == 184944023: #and message.document.file_name in python_files
        file_info = bot.get_file(message.document.file_id)
        downloaded_file = bot.download_file(file_info.file_path)
        dir_path = os.path.dirname(os.path.abspath(__file__))
        file_path = os.path.join(dir_path, message.document.file_name)

        # Сохранение файла
        with open(file_path, 'wb') as new_config_file:
            new_config_file.write(downloaded_file)

        bot.send_message(message.chat.id, "Модуль был сохранен.")
        os.execl(sys.executable, sys.executable, *sys.argv)
    elif message.from_user.id != 184944023:
        bot.send_message(message.chat.id, "У вас нет разрешения на загрузку файла.")
    else:
        bot.send_message(message.chat.id, "Файл должен быть одним из допустимых модулей Python.")



#### Если текст не соответствует ни одному варианту, то запускается основной скрипт
@bot.message_handler(content_types=['text'])
def handle_message(message):
    chat_id = message.chat.id
    if any(trigger.lower() in message.text.lower() for trigger in config.SITE_TRIGGERS):
        bot.send_message(chat_id, "Ищу информацию на сайте Хатико")
        result = send_data(message.text)
        bot.send_message(chat_id, result)
        return

    if str(message.from_user.id) in config.GRANTED:
        search_query = message.text
        result = handle_query(search_query)

        if result:
            parts = result.split("Отдаем? Сможете привезти?")

            for part in parts:
                if part.strip():  # Убедимся, что часть не пустая
                    bot.send_message(chat_id, part.strip() + "\nОтдаем? Сможете привезти?")
        else:
            bot.send_message(chat_id, "Ошибка")
    else:
        bot.send_message(chat_id, f"В доступе отказано. Сообщите ваш ID {message.from_user.id} Сергею, чтобы он вас добавил")

if __name__ == '__main__':

    main()