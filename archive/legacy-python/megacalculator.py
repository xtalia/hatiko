def start_megacalculator(bot, message):
    # Start the calculation with the first denomination
    count = {}
    denominations = {
    500: "Сколько купюр номиналом 500?",
    1000: "Сколько купюр номиналом 1000?",
    2000: "Сколько купюр номиналом 2000?",
    5000: "Сколько у вас купюр номиналом 5000?"
    }
    next_denomination(bot, message, denominations, count)

def next_denomination(bot, message, denominations, count):
    # Get the next denomination to calculate
    denomination, question = denominations.popitem()
    # Ask the user for the count of bills for the current denomination
    bot.send_message(message.chat.id, question)
    # Register the next step handler with the current denomination and count
    bot.register_next_step_handler(message, lambda message: calculate_denomination(bot, message, denominations, count, denomination))

def calculate_denomination(bot, message, denominations, count, denomination):
    try:
        # Get the count of bills for the current denomination
        count[denomination] = int(float(message.text))
        # If there are more denominations to calculate, move on to the next one
        if denominations:
            next_denomination(bot, message, denominations, count)
        # Otherwise, calculate the total sum and send the result to the user
        else:
            total_sum = sum(denomination * count[denomination] for denomination in count)
            message_text = "Получилось так:\n"
            message_text += '\n'.join(f'{denomination} x {count[denomination]}' for denomination in count)
            message_text += f'\nИтого: {total_sum}'
            bot.send_message(message.chat.id, message_text)
    except ValueError:
        bot.send_message(message.chat.id, "Число должно быть цельным, запусти команду еще раз")