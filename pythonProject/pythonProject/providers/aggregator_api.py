import requests
from config import ONEINCH_API_KEY  # Ключи апи для 1inch


def get_best_price_quote(chain_id, from_token, to_token, amount_wei):
    """
    Запрашивает лучшую цену и маршрут обмена у 1inch API v6.1.

    :param chain_id: id сети
    :param from_token: адрес токена, который мы отдаем (USDT)
    :param to_token: адрес токена, который мы хотим купить (наш проверяемый токен)
    :param amount_wei: Сумма в минимальных неделимых частицах (Wei)
    """
    print(f"\nАгрегатор: Поиск лучшей цены для обмена на 1inch...")

    # URL для получения котировки (без совершения самой транзакции)
    url = f"https://api.1inch.dev/swap/v6.1/{chain_id}/quote"

    headers = {
        "Authorization": f"Bearer {ONEINCH_API_KEY}",
        "Accept": "application/json"
    }

    params = {
        "src": from_token,
        "dst": to_token,
        "amount": str(amount_wei),  # сумма в виде строки
        "includeTokensInfo": "true",  # Возвращаем символы и названия токенов
        "includeProtocols": "true"  # Возвращаем через какие биржи пойдет обмен
    }

    try:
        response = requests.get(url, headers=headers, params=params)

        if response.status_code == 200:
            data = response.json()
            return _parse_quote_data(data)
        else:
            print(f"Ошибка 1inch API: {response.status_code} - {response.text}")
            return None

    except Exception as e:
        print(f"Ошибка соединения с 1inch: {e}")
        return None


def _parse_quote_data(raw_data):
    """Вспомогательная функция для очистки ответа от 1inch API v6.1"""
    if not raw_data:
        return None

    # 1. Извлекаем сырую сумму
    dst_amount_wei = raw_data.get("dstAmount", "0")

    # 2. Извлекаем информацию о токене
    dst_token_info = raw_data.get("dstToken", {})
    decimals = int(dst_token_info.get("decimals", 18))
    symbol = dst_token_info.get("symbol", "TOKEN")

    # Перевод математики в человеческий вид
    amount_to_receive_human = float(dst_amount_wei) / (10 ** decimals)

    # 3. достаем список бирж
    protocols_list = []

    # Шаг 1: идем по главному массиву protocols
    for path in raw_data.get("protocols", []):
        # Шаг 2: внутри каждого пути идем по массиву hops
        for hop in path.get("hops", []):
            # Шаг 3: внутри прыжка берем внутренний массив protocols
            for sub_protocol in hop.get("protocols", []):
                dex_name = sub_protocol.get("name")
                if dex_name:
                    protocols_list.append(dex_name)

    # Убираем дубликаты (например, если маршрут дважды прошел через Uniswap)
    unique_protocols = list(set(protocols_list))

    # 4. Получаем газ, который необходим для совершения транзакции
    gas_used = raw_data.get("gas", 0)

    return {
        "expected_output_wei": dst_amount_wei,
        "expected_output_human": round(amount_to_receive_human, 6),
        "token_symbol": symbol,
        "decimals_used": decimals,
        "route_used": unique_protocols,
        "estimated_gas": gas_used
    }


# --- Тестовый запуск ---
if __name__ == "__main__":
    chain = "56"  # Сеть: Binance Smart Chain (BSC)

    # Адрес USDT в сети BSC
    USDT_BSC = "0x55d398326f99059ff775485246999027b3197955"
    # Токен, который хотим купить
    TEST_TOKEN = "0x02f4ff0b6e4f2aee8af704b074913893520c4444"

    # Тратим 10 USDT (У USDT в сети BSC 18 нулей)
    amount_to_spend = 10 * (10 ** 18)

    quote = get_best_price_quote(chain, USDT_BSC, TEST_TOKEN, amount_to_spend)

    if quote:
        print("\n✅ Успешный расчет маршрута!")
        print(f"Вы отдаете: 10 USDT")
        print(f"Вы получите (в машинных WEI): {quote['expected_output_wei']}")
        print(f"Вы получите (чистыми): {quote['expected_output_human']} {quote['token_symbol']}")
        print(f"Использованы decimals: {quote['decimals_used']}")
        print(f"Маршрут обмена: {' -> '.join(quote['route_used']) if quote['route_used'] else 'Прямой пул'}")
        print(f"Затраты газа (Units): {quote['estimated_gas']}")