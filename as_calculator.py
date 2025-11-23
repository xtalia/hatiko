from config import RATES
def cash_amount(cash=0, credit_month=36, output=""):
    try:
        # Используем RATES для расчета стоимости с различными способами оплаты
        qr_price = round(cash * RATES['qr'] / 100) * 100 - 10
        card_price = round(cash * RATES['card'] / 100) * 100 - 10
        rassrochka_price_six = round(cash * RATES['six'] / 100) * 100 - 10
        rassrochka_price_ten = round(cash * RATES['ten'] / 100) * 100 - 10
        rassrochka_price_twelve = round(cash * RATES['twelve'] / 100) * 100 - 10
        rassrochka_price_eighteen = round(cash * RATES['eighteen'] / 100) * 100 - 10
        rassrochka_price_twentyfour = round(cash * RATES['twentyfour'] / 100) * 100 - 10
        rassrochka_price_thirtysix = round(cash * RATES['thirtysix'] / 100) * 100 - 10

        cashback_amount = round(cash * 0.01)
        prepay_amount = round(cash * 0.05 / 500) * 500

        # Формирование вывода
        output += f"""
💵 Наличными: {cash:.0f} руб.
📷 QR: {qr_price:.0f} руб.
💳 Картой: {card_price:.0f} руб.

🏦 Рассрочка
🔹 6 мес.: {rassrochka_price_six:.0f} руб. (от {round(rassrochka_price_six / 6):.0f} руб./мес)
🔹 10 мес.: {rassrochka_price_ten:.0f} руб. (от {round(rassrochka_price_ten / 10):.0f} руб./мес)
🔹 12 мес.: {rassrochka_price_twelve:.0f} руб. (от {round(rassrochka_price_twelve / 12):.0f} руб./мес)
🔹 18 мес.: {rassrochka_price_eighteen:.0f} руб. (от {round(rassrochka_price_eighteen / 18):.0f} руб./мес)
🔹 24 мес.: {rassrochka_price_twentyfour:.0f} руб. (от {round(rassrochka_price_twentyfour / 24):.0f} руб./мес)
🔹 36 мес.: {rassrochka_price_thirtysix:.0f} руб. (от {round(rassrochka_price_thirtysix / 36):.0f} руб./мес)

💸 Кэшбэк: {cashback_amount:.0f} баллами
💸 5% предоплата: {prepay_amount:.0f} рублей
""".strip()

        return output
    except ValueError:
        return "Сломался калькулятор, что-то пошло не так (Только цифры)"


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

