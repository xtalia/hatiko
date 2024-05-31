from datetime import datetime, timedelta
from bs4 import BeautifulSoup
import requests

def get_usd_rate(date):
    url = f'https://www.cbr.ru/scripts/XML_daily_eng.asp?date_req={date.strftime("%d/%m/%Y")}'
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'xml')
    valute = soup.find('CharCode', text='USD').find_parent('Valute')
    nominal = int(valute.Nominal.string)
    value = float(valute.Value.string.replace(',', '.'))
    return value / nominal

def handle_usd_rate(bot, message):
    # send_debug_message(f"{message.from_user.id} запросил Курс Доллара")
    today = datetime.today()
    yesterday = today - timedelta(days=1)
    day_before_yesterday = today - timedelta(days=2)

    usd_rate_today = get_usd_rate(today)
    usd_rate_yesterday = get_usd_rate(yesterday)
    usd_rate_day_before_yesterday = get_usd_rate(day_before_yesterday)

    price_diff_today_yesterday = usd_rate_today - usd_rate_yesterday
    price_diff_yesterday_day_before_yesterday = usd_rate_yesterday - usd_rate_day_before_yesterday

    if price_diff_today_yesterday > 0:
        arrow_emoji_today_yesterday = '⬆️'
    elif price_diff_today_yesterday < 0:
        arrow_emoji_today_yesterday = '⬇️'
    else:
        arrow_emoji_today_yesterday = '➡️'

    if price_diff_yesterday_day_before_yesterday > 0:
        arrow_emoji_yesterday_day_before_yesterday = '⬆️'
    elif price_diff_yesterday_day_before_yesterday < 0:
        arrow_emoji_yesterday_day_before_yesterday = '⬇️'
    else:
        arrow_emoji_yesterday_day_before_yesterday = '➡️'

    today_str = today.strftime("%d.%m.%Y")
    yesterday_str = yesterday.strftime("%d.%m.%Y")
    day_before_yesterday_str = day_before_yesterday.strftime("%d.%m.%Y")

    text = f'💵 Сегодня: {usd_rate_today:.2f}\n💵 {yesterday_str}: {usd_rate_yesterday:.2f} ({arrow_emoji_today_yesterday} {abs(price_diff_today_yesterday):.2f})\n💵 {day_before_yesterday_str}: {usd_rate_day_before_yesterday:.2f} ({arrow_emoji_yesterday_day_before_yesterday} {abs(price_diff_yesterday_day_before_yesterday):.2f})'
    bot.reply_to(message, text)
    # send_debug_message(f"Курс доллара ОК")