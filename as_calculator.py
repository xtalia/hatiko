def cash_amount(cash=0, credit_month=37, output=""):
    try:
        
        # база
        qr_price = round(cash * 1.0401, -2) -10
        card_price = round(cash * 1.0501, -2) -10
        rassrochka_price_six = round(cash * 1.1001, -2) -10
        rassrochka_price_ten = round(cash * 1.1301, -2) -10
        
        credit_price = round(cash * 1.2001, -2) -10
        cashback_amount = round(cash * 0.01)
        
        
        if credit_month==37:
            credit_month = 36
            qr_price = round(cash * 1.01501, -2) -10
            card_price = round(cash * 1.0301, -2) -10
            rassrochka_price_six = round(cash * 1.0701, -2) -10
            rassrochka_price_ten = round(cash * 1.1001, -2) -10
            credit_price = round(cash * 1.1801, -2) -10
            cashback_amount = round(cash * 0.01)
            output += "ТОЛЬКО ДЛЯ БАЛАКОВО!!! ДЛЯ ДРУГИХЪ ГОРОДОВ - на САЙТЕ http://1721671-cu28683.twc1.net/ \n\n"
         
        twenty = round(credit_price * ((20/12/100) * (1 + (20/12/100)) ** credit_month) / ((1 + (20/12/100)) ** credit_month - 1), 0)
        fourty = round(credit_price * ((40/12/100) * (1 + (40/12/100)) ** credit_month) / ((1 + (40/12/100)) ** credit_month - 1), 0)

        output += f"""
💵 Стоимость: {cash:.0f} рублей с учетом скидки за оплату наличными

📷 QR = {qr_price:.0f} рублей
💳 по карте = {card_price:.0f} рублей

️🏦 в рассрочку
️🔹 ОТП = {rassrochka_price_six:.0f} рублей (от {rassrochka_price_six/6:.0f} руб. на 6 месяцев)
🔹 Другие банки = {rassrochka_price_ten:.0f} рублей (от {rassrochka_price_ten/10:.0f} руб. на 10 месяцев)

🏛 в кредит = {credit_price:.0f} рублей + % Банка
(от {twenty:.0f} - {fourty:.0f} руб. сроком до {credit_month:.0f} месяцев)
** %Банка ~ от 20 до 40% годовых (точные условия может предоставить только менеджер)

💸 Кешбек = {cashback_amount:.0f} внутренними рублями
(через 2 недели, если закажете самостоятельно на сайте)
"""

        # Вывод пользователю
        return output
        # send_debug_message("Калькулятор ОК")
    except ValueError:
        return "Сломался калькулятор, что-то пошло не так (Только цифры)"
        # send_debug_message("Калькулятор Ошибка")

def process_discount(original,discount):
        try:
            # Вычисляем процент скидки и сумму со скидкой
            discounted_price = original - discount
            discount_percentage = 100 - discounted_price / (original * 0.01)
            

            # Формируем сообщение с результатами
            result_message = f"Изначальная цена: {int(original)}\n"
            result_message += f"Скидка: {discount}\n"
            result_message += f"Процент скидки: {discount_percentage}\n"
            result_message += f"Сумма со скидкой: {discounted_price}"

            # Отправляем результат пользователю
            return result_message
        except:
            return "Сломался калькулятор, что-то пошло не так (Только цифры)"