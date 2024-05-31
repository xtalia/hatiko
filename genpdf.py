from docx import Document
from docx2pdf import convert
import os
import num2words
import datetime
from config import questions

answers = {}

def start_survey(bot, message):
    answers.clear()
    send_question(bot, message, 'DocNumber')

def send_question(bot, message, question_tag):
    if question_tag in questions:
        question = questions[question_tag]
        if question is None and question_tag == 'Date':
            current_date = datetime.datetime.now().strftime('%d.%m.%Y')
            answers[question_tag] = current_date
            next_question_tag = 'name'
            send_question(bot, message, next_question_tag)
        elif question is None and question_tag == 'SellPriceFull':
            try:
                sell_price = int(answers['SellPrice'])
                answers[question_tag] = num2words.num2words(sell_price, lang='ru').capitalize()
                next_question_tag = 'PDS'
                send_question(bot, message, next_question_tag)
            except ValueError:
                bot.send_message(message.chat.id, "Вы ввели не целое число. Пожалуйста, запустите команду снова /generate_pdf")
                return
        else:
            bot.send_message(message.chat.id, question)
            bot.register_next_step_handler(message, lambda msg: process_answer(bot, msg, question_tag))
    else:
        try:
            generate_docx(bot,message)
        except Exception as e:
            # Обработка исключения при генерации PDF
            bot.send_message(message.chat.id, f"Ошибка при генерации PDF: {str(e)}")

def process_answer(bot, message, question_tag):
    answers[question_tag] = message.text
    next_question_tag = get_next_question(question_tag)
    send_question(bot, message, next_question_tag)

def get_next_question(question_tag):
    question_tags = list(questions.keys())
    current_index = question_tags.index(question_tag)
    if current_index < len(question_tags) - 1:
        return question_tags[current_index + 1]
    else:
        return None

def generate_docx(bot, message):
    bot.send_message(message.chat.id, "Генерируем документ")
    docx_template = 'template.docx'
    docx_file = f'{message.chat.id}_result.docx'

    # Загрузка шаблона docx
    doc = Document(docx_template)

    # Замена тегов в шаблоне на ответы пользователя
    for tag, answer in answers.items():
        tag_placeholder = '{' + tag + '}'
        for paragraph in doc.paragraphs:
            if tag_placeholder in paragraph.text:
                paragraph.text = paragraph.text.replace(tag_placeholder, answer)

    try:
        # Сохранение отредактированного docx-документа
        doc.save(docx_file)

        # Отправка docx файла пользователю
        with open(docx_file, 'rb') as f:
            bot.send_document(message.chat.id, f)
    except Exception as e:
        # Обработка ошибок при генерации docx
        bot.send_message(message.chat.id, f"Ошибка при генерации документа: {str(e)}")
    finally:
        # Удаление временного файла
        if os.path.exists(docx_file):
            os.remove(docx_file)