import requests
from config import ONEINCH_API_KEY

def get_best_price_quote(chain_id, from_token, to_token, amount_wei):
    url = f"https://api.1inch.dev/swap/v6.1/{chain_id}/quote"
    headers = {"Authorization": f"Bearer {ONEINCH_API_KEY}", "Accept": "application/json"}
    params = {"src": from_token, "dst": to_token, "amount": str(amount_wei), "includeTokensInfo": "true", "includeProtocols": "true"}

    try:
        # ДОБАВЛЕН TIMEOUT 10 СЕКУНД
        response = requests.get(url, headers=headers, params=params, timeout=10)
        if response.status_code == 200:
            return _parse_quote_data(response.json())
        return None
    except Exception as e:
        return None

def _parse_quote_data(raw_data):
    if not raw_data: return None
    dst_amount_wei = raw_data.get("dstAmount", "0")
    dst_token_info = raw_data.get("dstToken", {})
    decimals = int(dst_token_info.get("decimals", 18))
    symbol = dst_token_info.get("symbol", "TOKEN")
    amount_to_receive_human = float(dst_amount_wei) / (10 ** decimals)

    protocols_list = []
    for path in raw_data.get("protocols", []):
        for hop in path.get("hops", []):
            for sub_protocol in hop.get("protocols", []):
                if sub_protocol.get("name"): protocols_list.append(sub_protocol.get("name"))

    return {
        "expected_output_wei": dst_amount_wei,
        "expected_output_human": round(amount_to_receive_human, 6),
        "token_symbol": symbol,
        "decimals_used": decimals,
        "route_used": list(set(protocols_list)),
        "estimated_gas": raw_data.get("gas", 0)
    }

def get_approve_transaction(chain_id, token_address, amount_wei):
    url = f"https://api.1inch.dev/swap/v6.1/{chain_id}/approve/transaction"
    headers = {"Authorization": f"Bearer {ONEINCH_API_KEY}", "Accept": "application/json"}
    params = {"tokenAddress": token_address, "amount": str(amount_wei)}

    try:
        response = requests.get(url, headers=headers, params=params, timeout=10)
        if response.status_code == 200:
            return response.json()
        else:
            return None
    except Exception as e:
        return None

def get_swap_transaction(chain_id, from_token, to_token, amount_wei, user_wallet, slippage=10):
    url = f"https://api.1inch.dev/swap/v6.1/{chain_id}/swap"
    headers = {"Authorization": f"Bearer {ONEINCH_API_KEY}", "Accept": "application/json"}
    params = {
        "src": from_token,
        "dst": to_token,
        "amount": str(amount_wei),
        "from": user_wallet,
        "slippage": slippage,
        "disableEstimate": "true"
    }

    try:
        response = requests.get(url, headers=headers, params=params, timeout=15) # Здесь даем 15 сек, т.к. формирование маршрута тяжелое
        if response.status_code == 200:
            data = response.json()
            return data.get("tx")
        else:
            return None
    except Exception as e:
        return None