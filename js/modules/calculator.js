const fs = require('fs');
const path = require('path');

class Calculator {
    constructor() {
        this.ratesPath = path.join(__dirname, '../config/calculatorRates.json');
        this.ratesData = JSON.parse(fs.readFileSync(this.ratesPath, 'utf8'));
    }

    /**
     * Основная функция калькулятора
     * @param {number} cash - Сумма наличными
     * @param {string} mode - Режим расчета ('all', 'balakovo', 'prepay')
     * @returns {Object} - Результаты расчета
     */
    calculate(cash, mode = 'all') {
        // Валидация входных данных
        if (isNaN(cash) || cash <= 0) {
            return {
                success: false,
                error: 'Ошибка: Введите корректную сумму.'
            };
        }

        // Режим предоплаты
        if (mode === 'prepay') {
            const prepayAmount = Math.ceil(cash * 0.05 / 500) * 500;
            return {
                success: true,
                mode: 'prepay',
                originalAmount: cash,
                prepayAmount: prepayAmount,
                text: `Предоплата 5%: ${prepayAmount} рублей`
            };
        }

        // Проверка доступности режима
        if (!this.ratesData[mode]) {
            return {
                success: false,
                error: 'Ошибка: Данные для выбранного режима не загружены.'
            };
        }

        const rates = this.ratesData[mode];
        
        // Расчет всех значений
        const calculations = {
            qr_price: this.roundPrice(cash * rates.qr),
            card_price: this.roundPrice(cash * rates.card),
            rassrochka_price_six: this.roundPrice(cash * rates.six),
            rassrochka_price_ten: this.roundPrice(cash * rates.ten),
            rassrochka_price_twelve: this.roundPrice(cash * rates.twelve),
            rassrochka_price_eighteen: this.roundPrice(cash * rates.eighteen),
            rassrochka_price_twentyfour: this.roundPrice(cash * rates.twentyfour),
            rassrochka_price_thirtysix: this.roundPrice(cash * rates.thirtysix),
            cashback_amount: Math.round(cash * 0.01)
        };

        // Форматирование текста
        const resultText = this.formatResult(cash, calculations);

        return {
            success: true,
            mode: mode,
            originalAmount: cash,
            calculations: calculations,
            text: resultText,
            formatted: this.formatForTelegram(cash, calculations)
        };
    }

    /**
     * Округление цены по правилам (до 100 - 10)
     */
    roundPrice(amount) {
        return Math.round(amount / 100) * 100 - 10;
    }

    /**
     * Форматирование текстового результата
     */
    formatResult(cash, calc) {
        const installments = [
            this.generateInstallmentText(calc.rassrochka_price_six, 6),
            this.generateInstallmentText(calc.rassrochka_price_ten, 10),
            this.generateInstallmentText(calc.rassrochka_price_twelve, 12),
            this.generateInstallmentText(calc.rassrochka_price_eighteen, 18),
            this.generateInstallmentText(calc.rassrochka_price_twentyfour, 24),
            this.generateInstallmentText(calc.rassrochka_price_thirtysix, 36)
        ].filter(text => text !== null).join('\n');

        return `💵 Наличными: ${cash} руб.
📷 QR: ${calc.qr_price} руб.
💳 Картой: ${calc.card_price} руб.

🏦 Рассрочка
${installments}

💸 Кэшбэк: ${calc.cashback_amount} баллами`;
    }

    /**
     * Форматирование для Telegram (с эмодзи и переносами)
     */
    formatForTelegram(cash, calc) {
        const installments = [
            this.generateInstallmentText(calc.rassrochka_price_six, 6),
            this.generateInstallmentText(calc.rassrochka_price_ten, 10),
            this.generateInstallmentText(calc.rassrochka_price_twelve, 12),
            this.generateInstallmentText(calc.rassrochka_price_eighteen, 18),
            this.generateInstallmentText(calc.rassrochka_price_twentyfour, 24),
            this.generateInstallmentText(calc.rassrochka_price_thirtysix, 36)
        ].filter(text => text !== null).join('\n');

        return `💵 Наличными: ${this.formatNumber(cash)} руб.
📷 QR: ${this.formatNumber(calc.qr_price)} руб.  
💳 Картой: ${this.formatNumber(calc.card_price)} руб.

🏦 Рассрочка
${installments}

💸 Кэшбэк: ${this.formatNumber(calc.cashback_amount)} баллами`;
    }

    /**
     * Генерация текста для рассрочки
     */
    generateInstallmentText(price, months) {
        if (price <= 0) return null;
        return `  ${months} мес: ${this.formatNumber(price)} руб.`;
    }

    /**
     * Форматирование чисел с разделителями тысяч
     */
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }

    /**
     * Простая функция для расчета наличных (из вашего старого кода)
     */
    cashAmount(amount) {
        return this.calculate(amount, 'all');
    }

    /**
     * Функция для обработки скидки
     */
    processDiscount(originalPrice, discount) {
        const finalPrice = originalPrice - discount;
        return {
            original: originalPrice,
            discount: discount,
            final: finalPrice,
            text: `Цена со скидкой: ${this.formatNumber(finalPrice)} руб.`
        };
    }

    /**
     * Получение доступных режимов
     */
    getAvailableModes() {
        return Object.keys(this.ratesData);
    }
}

// Создаем экземпляр и экспортируем
const calculator = new Calculator();
module.exports = calculator;