import json
import config
from oauth2client.service_account import ServiceAccountCredentials
import gspread

cred_json = config.cred_json



def get_data():
    scope = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/spreadsheets']
    creds = ServiceAccountCredentials.from_json_keyfile_dict(cred_json, scope)
    client = gspread.authorize(creds)
    spreadsheet = client.open_by_url('https://docs.google.com/spreadsheets/d/10jbgLdWsMZ80T2mnqHj_68hW0mOOvcLD3z5-Q1sC3wo/edit#gid=2086861705')
        # Получение листа "Цены" таблицы
    prices_worksheet = spreadsheet.worksheet('Цены')

    # Получение всех значений из столбцов A, B, C, D, E, F, G листа "Цены"
    prices_values = prices_worksheet.get_all_values()

    # Получение листа "Остатки" таблицы
    ostatki_worksheet = spreadsheet.worksheet('Остатки')

    # Получение всех значений из столбцов A, C листа "Остатки"
    ostatki_values = ostatki_worksheet.get_all_values()
    
    pass

get_data()