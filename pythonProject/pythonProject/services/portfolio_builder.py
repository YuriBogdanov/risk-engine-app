from providers.moralis_api import get_native_balance, get_erc20_balances
from providers.dex_api import get_native_price, get_dex_prices


def build_user_portfolio(chain_id, wallet_address):
    """
    Оркестратор: собирает балансы из Moralis, запрашивает цены из Dex/Binance,
    сводит всё воедино и отдает готовый портфель для фронтенда.
    """
    portfolio = []
    chains_to_check = ['1', '56', '8453'] if chain_id == 'all' else [chain_id]

    for chain in chains_to_check:
        # --- 1. НАТИВНЫЕ ТОКЕНЫ ---
        raw_native = float(get_native_balance(chain, wallet_address))
        if raw_native > 0:
            human_balance = raw_native / (10 ** 18)
            symbol = "BNB" if str(chain) == "56" else "ETH" if str(chain) == "1" else "ETH (Base)"
            usd_value = human_balance * get_native_price(symbol)

            portfolio.append({
                "symbol": symbol,
                "name": f"{symbol} (Native)",
                "address": "native",
                "balance": f"{human_balance:.4f}",
                "usd_value": usd_value,
                "isNative": True,
                "isSpam": False,
                "chain_id": chain
            })

        # --- 2. АЛЬТКОИНЫ (ERC-20) ---
        tokens_data = get_erc20_balances(chain, wallet_address)

        valid_tokens = []
        addresses_to_query = []

        # Отбираем токены, у которых есть реальный баланс
        for t in tokens_data:
            decimals = int(t.get('decimals', 18))
            human_balance = float(t.get('balance', 0)) / (10 ** decimals)

            if human_balance > 0.0001:
                addr = t.get('token_address', '').lower()
                addresses_to_query.append(addr)
                valid_tokens.append({
                    "data": t,
                    "human_balance": human_balance,
                    "address": addr
                })

        # Идем за ценами в dex_api (один пакетный запрос)
        real_prices = get_dex_prices(addresses_to_query)

        # Склеиваем балансы с ценами
        for item in valid_tokens:
            t = item["data"]
            symbol = t.get('symbol', 'UNKNOWN')

            # Если стейблкоин - цена 1$, иначе берем с DexScreener
            price = 1.0 if symbol in ['USDT', 'USDC', 'DAI', 'FDUSD'] else real_prices.get(item["address"], 0.0)
            usd_value = item["human_balance"] * price

            portfolio.append({
                "symbol": symbol,
                "name": t.get('name', 'Unknown Token'),
                "address": item["address"],
                "balance": f"{item['human_balance']:.4f}",
                "usd_value": usd_value,
                "isNative": False,
                "isSpam": t.get('possible_spam', False),
                "chain_id": chain
            })

    # СОРТИРОВКА: Хорошие токены (от дорогих к дешевым) -> Скам
    portfolio.sort(key=lambda x: (not x['isSpam'], x['usd_value'], float(x['balance'])), reverse=True)

    return portfolio