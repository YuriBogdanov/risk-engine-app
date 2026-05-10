import requests


def get_market_dynamics(token_address):
    """
    Получает актуальные данные о ликвидности и объемах торгов через бесплатный DexScreener API.
    """
    url = f"https://api.dexscreener.com/latest/dex/tokens/{token_address}"

    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()

        # Если токен не торгуется ни на одной DEX, API вернет пустой массив pairs
        if not data.get('pairs'):
            return None

        # Сортируем пулы по ликвидности (самый большой — первый)
        pairs = sorted(
            data['pairs'],
            key=lambda p: p.get('liquidity', {}).get('usd', 0) or 0,
            reverse=True
        )

        # Суммируем ликвидность ВСЕХ пулов: токен торгуется на нескольких DEX одновременно
        # (PancakeSwap v2/v3, Biswap и др.), агрегаторы типа OKX учитывают все пулы
        total_liquidity = sum(p.get('liquidity', {}).get('usd', 0) or 0 for p in pairs)

        # Цену и объём берём из наиболее ликвидного пула
        main_pair = pairs[0]

        return {
            "liquidity_usd": total_liquidity,
            "volume_24h": main_pair.get('volume', {}).get('h24', 0),
            "price_change_24h": main_pair.get('priceChange', {}).get('h24', 0)
        }

    except requests.RequestException as e:
        print(f"Ошибка сети при запросе к DexScreener: {e}")
        return None

# === НОВЫЕ ФУНКЦИИ ЦЕНООБРАЗОВАНИЯ ===

def get_native_price(symbol):
    """Быстрый запрос цены главных монет через Binance API"""
    symbol = symbol.upper()
    try:
        if symbol in ['ETH', 'WETH']:
            res = requests.get("https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT", timeout=2)
            return float(res.json()['price'])
        if symbol in ['BNB', 'WBNB']:
            res = requests.get("https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT", timeout=2)
            return float(res.json()['price'])
    except: pass
    return 0.0

def get_dex_prices(token_addresses):
    """
    Пакетный запрос цен для списка альткоинов через DexScreener.
    Возвращает словарь {адрес: цена_usd}.
    """
    if not token_addresses:
        return {}

    prices = {}
    chunk = ",".join(token_addresses[:30]) # Берем первые 30 токенов
    url = f"https://api.dexscreener.com/latest/dex/tokens/{chunk}"

    try:
        res = requests.get(url, timeout=5)
        if res.status_code == 200:
            for pair in res.json().get("pairs", []):
                addr = pair.get("baseToken", {}).get("address", "").lower()
                price = float(pair.get("priceUsd", 0))
                if addr and addr not in prices:
                    prices[addr] = price
    except Exception as e:
        print(f"Ошибка пакетного запроса DexScreener: {e}")

    return prices