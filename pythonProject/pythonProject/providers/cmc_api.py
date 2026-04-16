import requests
from config import CMC_API_KEY


def get_cmc_market_data(token_address, symbol):
    """
    Улучшенная версия для БЕСПЛАТНОГО API CMC с жесткой проверкой контракта.
    """
    if not symbol or symbol == "Unknown" or not token_address:
        return None

    headers = {
        "Accepts": "application/json",
        "X-CMC_PRO_API_KEY": CMC_API_KEY
    }

    try:
        # ШАГ 1: Получаем список всех токенов с таким символом
        map_url = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/map"
        map_params = {"symbol": symbol.upper()}

        map_res = requests.get(map_url, headers=headers, params=map_params, timeout=10)
        if map_res.status_code != 200:
            return None

        map_data = map_res.json().get('data', [])
        if not map_data:
            return None

        target_id = None

        # ШАГ 2: ИЩЕМ ПРАВИЛЬНЫЙ КОНТРАКТ (Ведь тикеры часто совпадают!)
        for coin in map_data:
            platform = coin.get('platform')
            if platform and platform.get('token_address'):
                # Сравниваем адреса контрактов в нижнем регистре
                if platform['token_address'].lower() == token_address.lower():
                    target_id = coin['id']
                    break

        # Если CMC не нашел точного совпадения по адресу смарт-контракта,
        # значит токен либо не в листинге, либо это фейк.
        # Возвращаем None, чтобы Оркестратор переключился на DexScreener!
        if not target_id:
            return None

        # ШАГ 3: Получаем котировки по правильному ID
        quote_url = "https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest"
        quote_params = {"id": target_id}

        quote_res = requests.get(quote_url, headers=headers, params=quote_params, timeout=10)
        if quote_res.status_code != 200:
            return None

        data = quote_res.json()
        token_stats = data['data'][str(target_id)]
        quote_usd = token_stats.get('quote', {}).get('USD', {})

        # ВАЖНО: У CMC нет показателя DEX-ликвидности, у них есть Market Cap.
        # Берем реальный market_cap (или FDV, если капы нет).
        market_cap = quote_usd.get('market_cap', 0)
        if not market_cap:
            market_cap = quote_usd.get('fully_diluted_market_cap', 0)

        return {
            "volume_24h": quote_usd.get('volume_24h', 0),
            "price_change_24h": quote_usd.get('percent_change_24h', 0),
            "liquidity_usd": market_cap,  # Передаем капу как меру ценности
            "source": "CoinMarketCap"
        }

    except Exception as e:
        print(f"CMC API Error: {e}")
        return None