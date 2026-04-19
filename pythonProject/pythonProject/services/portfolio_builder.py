import concurrent.futures
from providers.moralis_api import get_native_balance, get_erc20_balances
from providers.dex_api import get_native_price, get_dex_prices


def fetch_single_chain_portfolio(chain, wallet_address):
    """Собирает портфель для одной конкретной сети, распараллеливая запросы к Moralis."""
    chain_portfolio = []

    # 1. Запускаем независимые тяжелые запросы к Moralis ОДНОВРЕМЕННО
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        future_native = executor.submit(get_native_balance, chain, wallet_address)
        future_erc20 = executor.submit(get_erc20_balances, chain, wallet_address)

        raw_native = float(future_native.result())
        tokens_data = future_erc20.result()

    # --- ОБРАБОТКА НАТИВНЫХ ТОКЕНОВ ---
    if raw_native > 0:
        human_balance = raw_native / (10 ** 18)
        symbol = "BNB" if str(chain) == "56" else "ETH" if str(chain) == "1" else "ETH (Base)"
        # Запрос к Binance отрабатывает быстро, оставляем линейно
        usd_value = human_balance * get_native_price(symbol)

        chain_portfolio.append({
            "symbol": symbol,
            "name": f"{symbol} (Native)",
            "address": "native",
            "balance": f"{human_balance:.4f}",
            "usd_value": usd_value,
            "isNative": True,
            "isSpam": False,
            "chain_id": chain
        })

    # --- ОБРАБОТКА АЛЬТКОИНОВ (ERC-20) ---
    valid_tokens = []
    addresses_to_query = []

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

    # Идем за ценами в dex_api (один пакетный запрос для этой сети)
    real_prices = get_dex_prices(addresses_to_query)

    for item in valid_tokens:
        t = item["data"]
        symbol = t.get('symbol', 'UNKNOWN')

        price = 1.0 if symbol in ['USDT', 'USDC', 'DAI', 'FDUSD'] else real_prices.get(item["address"], 0.0)
        usd_value = item["human_balance"] * price

        chain_portfolio.append({
            "symbol": symbol,
            "name": t.get('name', 'Unknown Token'),
            "address": item["address"],
            "balance": f"{item['human_balance']:.4f}",
            "usd_value": usd_value,
            "isNative": False,
            "isSpam": t.get('possible_spam', False),
            "chain_id": chain
        })

    return chain_portfolio


def build_user_portfolio(chain_id, wallet_address):
    """
    Оркестратор: если выбрано несколько сетей, опрашивает их ПАРАЛЛЕЛЬНО.
    """
    portfolio = []
    chains_to_check = ['1', '56', '8453'] if chain_id == 'all' else [chain_id]

    # 2. Запускаем сборку портфелей по всем сетям ОДНОВРЕМЕННО
    with concurrent.futures.ThreadPoolExecutor(max_workers=len(chains_to_check)) as executor:
        futures = [executor.submit(fetch_single_chain_portfolio, chain, wallet_address) for chain in chains_to_check]

        for future in concurrent.futures.as_completed(futures):
            try:
                # Склеиваем результаты
                portfolio.extend(future.result())
            except Exception as e:
                print(f"Ошибка при сборе данных сети: {e}")

    # СОРТИРОВКА
    portfolio.sort(key=lambda x: (not x['isSpam'], x['usd_value'], float(x['balance'])), reverse=True)

    return portfolio