import requests
import json
import os
from config import MORALIS_API_KEY

headers = {
    "X-API-Key": MORALIS_API_KEY
}

CHAIN_MAP_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'chain_map.json')

def load_chain_map():
    try:
        with open(CHAIN_MAP_PATH, 'r', encoding='utf-8') as file:
            return json.load(file)
    except FileNotFoundError:
        return {"1": "eth", "56": "bsc"}

CHAIN_MAP = load_chain_map()

def get_top_token_holders(chain_id, token_address):
    moralis_chain = CHAIN_MAP.get(str(chain_id), "eth")
    url = f"https://deep-index.moralis.io/api/v2.2/erc20/{token_address}/owners"
    params = {"chain": moralis_chain, "order": "DESC", "limit": 50}

    try:
        # ДОБАВЛЕН TIMEOUT 10 СЕКУНД
        response = requests.get(url, headers=headers, params=params, timeout=10)
        if response.status_code == 200:
            data = response.json()
            return data.get("result", [])
        else:
            print(f"Ошибка API. Код: {response.status_code}")
            return []
    except Exception as e:
        print(f"Ошибка соединения (Moralis Holders): {e}")
        return []

def get_wallet_token_transfers(chain_id, wallet_address, token_address):
    if not wallet_address or wallet_address == "0x0000000000000000000000000000000000000000":
        return []
    moralis_chain = CHAIN_MAP.get(str(chain_id), "eth")
    url = f"https://deep-index.moralis.io/api/v2.2/{wallet_address}/erc20/transfers"
    params = {
        "chain": moralis_chain,
        "order": "DESC",
        "limit": 100,
        "contract_addresses": [token_address]
    }

    try:
        # ДОБАВЛЕН TIMEOUT 10 СЕКУНД
        response = requests.get(url, headers=headers, params=params, timeout=10)
        if response.status_code == 200:
            data = response.json()
            return data.get("result", [])
        else:
            print(f"Ошибка Moralis (Транзакции): {response.status_code}")
            return []
    except Exception as e:
        print(f"Ошибка соединения с Moralis: {e}")
        return []

def get_native_balance(chain_id, wallet_address):
    chain_hex = hex(int(chain_id)) if str(chain_id).isdigit() else chain_id
    url = f"https://deep-index.moralis.io/api/v2.2/{wallet_address}/balance?chain={chain_hex}"
    try:
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code == 200:
            return res.json().get('balance', 0)
    except: pass
    return 0

def get_erc20_balances(chain_id, wallet_address):
    chain_hex = hex(int(chain_id)) if str(chain_id).isdigit() else chain_id
    url = f"https://deep-index.moralis.io/api/v2.2/{wallet_address}/erc20?chain={chain_hex}"
    try:
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code == 200:
            return res.json()
    except: pass
    return []