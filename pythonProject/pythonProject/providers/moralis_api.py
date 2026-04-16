import requests
import json
import os
from config import MORALIS_API_KEY

headers = {
    "X-API-Key": MORALIS_API_KEY
}

# --- ЗАГРУЗКА КОНФИГУРАЦИЙ ---
# Вычисляем путь к файлу chain_map.json (выходим на уровень выше из папки providers в data)
CHAIN_MAP_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'chain_map.json')

def load_chain_map():
    """Загружает соответственные id сетей и их названий для Moralis из json."""
    try:
        with open(CHAIN_MAP_PATH, 'r', encoding='utf-8') as file:
            return json.load(file)
    except FileNotFoundError:
        print("Предупреждение: Файл data/chain_map.json не найден.")
        # Fallback чтобы код не упал, если файл случайно удалят
        return {"1": "eth", "56": "bsc"}

# Загружаем базу один раз при импорте модуля
CHAIN_MAP = load_chain_map()

def get_top_token_holders(chain_id, token_address):
    """Выдает данные от топ-X холдерах выбранного токена сети"""

    # Метод .get() безопасный. Если передадут неизвестный chain_id (например, "999"),
    # скрипт не упадет с ошибкой, а подставит значение по умолчанию ("eth").
    moralis_chain = CHAIN_MAP.get(str(chain_id), "eth")

    url = f"https://deep-index.moralis.io/api/v2.2/erc20/{token_address}/owners"


    params = {
        "chain": moralis_chain,  # сеть
        "order": "DESC",  # сортировка по убыванию (сначала показываем кошельки с самым большим балансом)
        "limit": 50 # берем топ-50
    }

    try:
        response = requests.get(url, headers=headers, params=params)

        if response.status_code == 200:
            data = response.json()

            # Извлекаем список холдеров (если списка нет, вернется пустой список [])
            owners_list = data.get("result", [])

            return owners_list


        else:
            print(f"Ошибка API. Код: {response.status_code}")
            print(f"Ответ сервера: {response.text}")

    except Exception as e:
        print(f"Произошла ошибка соединения: {e}")



def get_wallet_token_transfers(chain_id, wallet_address, token_address):
    """Выдает данные о транзакциях адреса с выбранным токеном"""
    if not wallet_address or wallet_address == "0x0000000000000000000000000000000000000000":
        return []

    moralis_chain = CHAIN_MAP.get(str(chain_id), "eth")

    url = f"https://deep-index.moralis.io/api/v2.2/{wallet_address}/erc20/transfers"

    params = {
        "chain": moralis_chain,
        "order": "DESC",
        "limit": 100,  # 100 последних транзакций хватит для оценки
        "contract_addresses": [token_address]  # фильтруем транзакции только по нужному токену
    }

    try:
        # headers берем сверху со своим апи ключом
        response = requests.get(url, headers=headers, params=params)

        if response.status_code == 200:
            data = response.json()
            return data.get("result", [])
        else:
            print(f"Ошибка Moralis (Транзакции): {response.status_code} - {response.text}")
            return []

    except Exception as e:
        print(f"Ошибка соединения с Moralis: {e}")
        return []


# === НОВЫЕ ФУНКЦИИ ТОЛЬКО ДЛЯ БАЛАНСОВ ===

def get_native_balance(chain_id, wallet_address):
    """Возвращает сырой нативный баланс (ETH/BNB)"""
    chain_hex = hex(int(chain_id)) if str(chain_id).isdigit() else chain_id
    url = f"https://deep-index.moralis.io/api/v2.2/{wallet_address}/balance?chain={chain_hex}"
    try:
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code == 200:
            return res.json().get('balance', 0)
    except: pass
    return 0

def get_erc20_balances(chain_id, wallet_address):
    """Возвращает сырой список ERC-20 токенов кошелька"""
    chain_hex = hex(int(chain_id)) if str(chain_id).isdigit() else chain_id
    url = f"https://deep-index.moralis.io/api/v2.2/{wallet_address}/erc20?chain={chain_hex}"
    try:
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code == 200:
            return res.json()
    except: pass
    return []