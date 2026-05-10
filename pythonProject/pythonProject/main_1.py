import json
import os
from concurrent.futures import ThreadPoolExecutor

# импорт провайдеров
from providers.goplus_api import get_clean_token_info
from providers.moralis_api import get_top_token_holders, get_wallet_token_transfers
from providers.dex_api import get_market_dynamics
from providers.aggregator_api import get_best_price_quote

# импорт бизнес-логики
from services.risk_analyzer import (
    calculate_whale_manipulation_risk,
    analyze_dev_dumping,
    analyze_market_dynamics,
    calculate_total_risk_score
)

# Вычисляем путь к файлу base_tokens.json в папке data
BASE_TOKENS_PATH = os.path.join(os.path.dirname(__file__), 'data', 'base_tokens.json')


def load_base_tokens():
    """Загружает конфигурацию стейблкоинов для разных сетей из JSON."""
    try:
        with open(BASE_TOKENS_PATH, 'r', encoding='utf-8') as file:
            return json.load(file)
    except FileNotFoundError:
        print("Предупреждение: Файл data/base_tokens.json не найден. Модуль агрегатора может не сработать.")
        return {}


# Загружаем базу один раз при старте программы
BASE_TOKENS = load_base_tokens()


def run_diploma_analyzer(chain_id, token_address, amount_to_spend_usd=10):
    """
    Собирает данные о безопасности токена и находит лучший маршрут для его покупки.
    """
    print("Старт анализатора...")

    # БЛОК 1: АНАЛИЗ БЕЗОПАСНОСТИ

    # 1.1 Сбор сырых данных
    goplus_raw = get_clean_token_info(chain_id, token_address)
    if not goplus_raw:
        print("Ошибка: Нет данных от GoPlus. Анализ остановлен.")
        return

    creator_address = goplus_raw.get('creator_address')

    # Параллельный запрос: Moralis (holders + transfers) и DexScreener
    print("Параллельный запрос данных: Moralis holders, transfers, DexScreener...")
    with ThreadPoolExecutor(max_workers=3) as executor:
        future_holders   = executor.submit(get_top_token_holders, chain_id, token_address)
        future_transfers = executor.submit(get_wallet_token_transfers, chain_id, creator_address, token_address)
        future_dex       = executor.submit(get_market_dynamics, token_address)

    moralis_holders   = future_holders.result()
    creator_transfers = future_transfers.result()
    market_raw        = future_dex.result()

    if market_raw:
        market_raw["source"] = "DexScreener"

    # Ликвидность: берём max(GoPlus, DexScreener).
    # GoPlus суммирует пулы по-своему и иногда видит больше пулов, чем DexScreener.
    goplus_liquidity = sum(
        float(dex.get('liquidity', '0') or '0')
        for dex in goplus_raw.get('dex', [])
    )

    dex_liquidity = float((market_raw or {}).get('liquidity_usd', 0) or 0)

    print(f"Ликвидность — DexScreener: ${dex_liquidity:,.2f} | GoPlus: ${goplus_liquidity:,.2f}")

    if goplus_liquidity > dex_liquidity:
        print(f"Используем ликвидность GoPlus (выше на ${goplus_liquidity - dex_liquidity:,.2f})")
        if market_raw:
            market_raw["liquidity_usd"] = goplus_liquidity
            market_raw["source"] = "GoPlus/DexScreener"
        else:
            market_raw = {
                "liquidity_usd": goplus_liquidity,
                "volume_24h": 0,
                "price_change_24h": 0,
                "source": "GoPlus"
            }
    else:
        print("Используем ликвидность DexScreener (выше или равна GoPlus)")

    # 1.2 Отработка кастомных модулей On-Chain аналитики
    whales_report = calculate_whale_manipulation_risk(goplus_raw, moralis_holders)
    dev_report = analyze_dev_dumping(goplus_raw, creator_transfers)
    market_report = analyze_market_dynamics(market_raw)

    # 1.3 Вынесение финального отчета
    final_verdict = calculate_total_risk_score(
        goplus_raw,
        whales_report,
        dev_report,
        market_report
    )

    # БЛОК 3: ФОРМИРОВАНИЕ JSON-ОТВЕТА
    final_json = {
        "token_info": {
            "address": token_address,
            "name": goplus_raw.get('token_name', 'Unknown'),
            "symbol": goplus_raw.get('token_symbol', 'Unknown'),
            "chain_id": chain_id
        },
        "security_analysis": {
            "verdict": final_verdict,
            "metrics": {
                "whale_analysis": whales_report,
                "creator_analysis": dev_report,
                "market_dynamics": market_report
            }
        }
    }

    print("\n" + "=" * 50)
    print("Итоговый json-отчёт:")
    print("=" * 50)
    print(json.dumps(final_json, indent=4, ensure_ascii=False))

    return final_json


if __name__ == "__main__":
    test_chain = "56"  # Сеть BSC
    test_token = "0x02f4ff0b6e4f2aee8af704b074913893520c4444"
    run_diploma_analyzer(test_chain, test_token, amount_to_spend_usd=10)
