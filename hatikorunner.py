from flask import Flask, request, jsonify
from who_work import get_employee_info
from wr_tradein import calculate_ideal_price, load_data
from postgresloader import update_cache, handle_query, send_data
from flask_cors import CORS
from urllib.parse import unquote

app = Flask(__name__)
CORS(app)

@app.route('/who_work', methods=['GET'])
def who_work():
    day = request.args.get('day')
    text = get_employee_info(day)
    return jsonify({'text': text})

@app.route('/tradein', methods=['GET'])
def tradein():
    # Извлекаем и декодируем параметры из запроса
    model = unquote(request.args.get('model', ''))
    memory = unquote(request.args.get('memory', ''))
    battery_capacity = int(request.args.get('battery_capacity', 0))
    package = unquote(request.args.get('package', ''))
    back_cover = request.args.get('back_cover', type=lambda v: v.lower() == 'true', default=False)
    screen = request.args.get('screen', type=lambda v: v.lower() == 'true', default=False)
    condition = unquote(request.args.get('condition', ''))

    # Вызываем функцию для расчета идеальной цены
    ideal_price = calculate_ideal_price(
        model,
        memory,
        battery_capacity,
        package,
        back_cover,
        screen,
        condition
    )

    # Возвращаем JSON-ответ с идеальной ценой
    return jsonify({'ideal_price': ideal_price})

@app.route('/load_tn', methods=['GET'])
def load_tn():
    if request.args.get('force', type=lambda v: v.lower() == 'true', default=False):
        data = load_data(force=True)
        return jsonify(data)
    else:
        data = load_data()
        return jsonify(data)
    
@app.route('/memchat', methods=['GET'])
def memchat():
    if request.args.get('force', type=lambda v: v.lower() == 'true', default=False):
        update_cache(force=True)
        return jsonify("memchat cache update complete")
    elif request.args.get('hatiko', ''):
        
        pass
        
    
    
    query = unquote(request.args.get('query', ''))
    answer = handle_query(query)
    return answer

'''
if __name__ == '__main__':
    app.run(port=8080,debug=False)
'''