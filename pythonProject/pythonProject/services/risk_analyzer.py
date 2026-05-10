import json
import os

CEX_FILE_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'cex_wallets.json')

def load_cex_wallets():
    try:
        with open(CEX_FILE_PATH, 'r', encoding='utf-8') as file:
            wallets_list = json.load(file)
            return set(wallet.lower() for wallet in wallets_list)
    except FileNotFoundError:
        print("Предупреждение: Файл data/cex_wallets.json не найден. CEX фильтрация отключена.")
        return set()

KNOWN_CEX_WALLETS = load_cex_wallets()

def calculate_whale_manipulation_risk(goplus_token_data, moralis_holders_list):
    print("\nАнализатор: Запуск модуля верификации холдеров...")

    known_contracts = set()
    known_contracts.add("0x000000000000000000000000000000000000dead")
    known_contracts.add("0x0000000000000000000000000000000000000000")

    dex_list = goplus_token_data.get('dex', [])
    for dex in dex_list:
        if 'pair' in dex:
            known_contracts.add(dex['pair'].lower())

    goplus_holders = goplus_token_data.get('holders', [])
    for holder in goplus_holders:
        if holder.get('is_contract') == 1 and 'address' in holder:
            known_contracts.add(holder['address'].lower())

    for cex_wallet in KNOWN_CEX_WALLETS:
        known_contracts.add(cex_wallet.lower())

    print(f"В черный список добавлено {len(known_contracts)} смарт-контрактов и пулов.")

    total_supply = float(goplus_token_data.get('total_supply', 1))

    private_whales_percentage = 0.0
    private_wallets_counted = 0
    whale_details = []

    print("Поиск частных китов...")

    for owner in moralis_holders_list:
        address = owner.get("owner_address", "").lower()

        if address not in known_contracts:
            percent = owner.get("percentage_relative_to_total_supply")
            if percent is None:
                balance = float(owner.get("balance", 0))
                percent = (balance / total_supply) * 100
            else:
                percent = float(percent)

            private_whales_percentage += percent
            private_wallets_counted += 1

            whale_details.append({
                "address": address,
                "percent": round(percent, 2)
            })

            print(f"Кит #{private_wallets_counted}: {address} ({round(percent, 2)}%)")

            if private_wallets_counted == 10:
                break

    is_risky = private_whales_percentage >= 80.0

    print()
    print(f"Итог: Топ-{private_wallets_counted} частных китов держат {round(private_whales_percentage, 2)}% эмиссии.")
    if is_risky:
        print("Внимание: Обнаружен критический риск манипуляции ценой (Dump Risk)!")
    else:
        print("Риск манипуляции ценой китами находится в пределах нормы.")
    print()

    return {
        "top_private_percent": round(private_whales_percentage, 2),
        "whales_counted": private_wallets_counted,
        "is_whale_manipulation_risk": is_risky,
        "whales_list": whale_details
    }


def analyze_dev_dumping(goplus_token_data, transfers_list):
    creator_address = goplus_token_data.get('creator_address')
    raw_supply = goplus_token_data.get('total_supply', '1')
    total_supply = float(raw_supply) if raw_supply else 1.0

    print("\nАнализатор: Запуск модуля поведения Создателя токена...")

    if not transfers_list or not creator_address:
        print("Транзакции создателя не найдены.")
        return {
            "creator_address": creator_address,
            "dev_dump_risk": False,
            "dumped_percent": 0.0,
            "impact_percent": 0.0
        }

    creator = creator_address.lower()
    total_acquired = 0.0
    total_disposed = 0.0

    for tx in transfers_list:
        from_addr = tx.get("from_address", "").lower()
        to_addr = tx.get("to_address", "").lower()

        decimals = int(tx.get("token_decimals", 18))
        raw_value = float(tx.get("value", 0))
        actual_amount = raw_value / (10 ** decimals)

        if to_addr == creator:
            total_acquired += actual_amount
        elif from_addr == creator:
            total_disposed += actual_amount

    personal_dump_percent = 0.0
    if total_acquired > 0:
        personal_dump_percent = (total_disposed / total_acquired) * 100

    market_impact_percent = (total_disposed / total_supply) * 100

    is_risky = personal_dump_percent >= 50.0 and market_impact_percent >= 1.0

    print()
    print(f"Создатель: {creator_address}")
    print(f"Получено (Всего): {total_acquired:,.2f} токенов")
    print(f"Выведено/Продано: {total_disposed:,.2f} токенов")
    print(f"Избавился от своей доли на: {personal_dump_percent:.2f}%")
    print(f"Влияние дампа на общий Supply: {market_impact_percent:.4f}%")

    if is_risky:
        print("Внимание: Разработчик слил значительный объем токенов в рынок!")
    else:
        print("Поведение создателя в пределах нормы (или объемы слишком малы для дампа).")
    print()

    return {
        "creator_address": creator_address,
        "total_acquired": round(total_acquired, 2),
        "total_disposed": round(total_disposed, 2),
        "dumped_percent": round(personal_dump_percent, 2),
        "impact_percent": round(market_impact_percent, 4),
        "dev_dump_risk": is_risky
    }


def parse_goplus_float(value, multiplier=1.0):
    if value is None or value == '':
        return None
    try:
        return float(value) * multiplier
    except ValueError:
        return None


def analyze_market_dynamics(dex_data):
    """
    Форматирует рыночные показатели. Теперь пробрасывает raw_liquidity для агрегатора.
    """
    if not dex_data:
        return {
            "score": 0,
            "status": "Данные отсутствуют",
            "warnings": [],
            "metrics": {}
        }

    score = 0
    warnings = []

    price_change = float(dex_data.get("price_change_24h", 0) or 0)
    liquidity = float(dex_data.get("liquidity_usd", 0) or 0)
    volume_24h = float(dex_data.get("volume_24h", 0) or 0)
    source = dex_data.get("source", "Unknown")

    if price_change <= -50:
        score += 60
        warnings.append(f"Критическое падение цены: {price_change}% за 24ч. Возможен сброс активов.")
    elif price_change <= -25:
        score += 30
        warnings.append(f"Сильное падение цены: {price_change}% за 24ч.")

    if liquidity > 0:
        vol_liq_ratio = volume_24h / liquidity
        if vol_liq_ratio > 3:
            score += 40
            warnings.append(f"Аномальный объем торгов: в {vol_liq_ratio:.1f} раз выше ликвидности. Признак манипуляции.")

    return {
        "score": score,
        "status": "High Risk" if score >= 50 else "Normal",
        "metrics": {
            "price_change_24h": f"{price_change}%",
            "liquidity_usd": f"${liquidity:,.2f}",
            "volume_24h": f"${volume_24h:,.2f}",
            "raw_liquidity": liquidity,  # Добавлено для внутреннего расчета
            "source": source
        },
        "warnings": warnings
    }

def calculate_total_risk_score(goplus_data, whales_report, dev_report, market_report):
    print("\nАгрегатор: Подсчет итогового Risk Score...")

    score = 0
    risk_factors = []
    safe_factors = []

    # 1. Критические риски (Скам)
    if goplus_data.get('is_honeypot') == '1':
        score += 100
        risk_factors.append("Критический риск: Токен является Honeypot (невозможно продать).")
    else:
        safe_factors.append("Honeypot не обнаружен.")

    buy_tax = parse_goplus_float(goplus_data.get('buy_tax'), 100)
    sell_tax = parse_goplus_float(goplus_data.get('sell_tax'), 100)

    if buy_tax is None or sell_tax is None:
        score += 30
        risk_factors.append("Риск скрытой комиссии: Не смогли прочитать налоги контракта. Действуйте с осторожностью.")
    else:
        max_tax = max(buy_tax, sell_tax)
        if max_tax >= 50.0:
            score += 100
            risk_factors.append(f"Критический риск: Экстремальный налог ({max_tax}%).")
        elif 10.0 <= max_tax < 50.0:
            score += 15
            risk_factors.append(f"Финансовый риск: Высокие торговые комиссии ({max_tax}%).")
        else:
            safe_factors.append(f"Торговые комиссии в норме: Покупка {buy_tax}%, Продажа {sell_tax}%.")

    # 2. Уязвимости контракта
    if goplus_data.get('is_mintable') == '1':
        score += 40
        risk_factors.append("Уязвимость кода: Владелец может допечатывать токены (Mint).")
    else:
        safe_factors.append("Объем токенов фиксирован.")

    if goplus_data.get('transfer_pausable') == '1':
        score += 40
        risk_factors.append("Уязвимость кода: Владелец может поставить торги на паузу.")
    else:
        safe_factors.append("Торги защищены от паузы.")

    if goplus_data.get('is_blacklisted') == '1':
        score += 30
        risk_factors.append("Уязвимость кода: Есть функции черного списка (Blacklist).")
    else:
        safe_factors.append("Черные списки отсутствуют.")

    if goplus_data.get('is_proxy') == '1':
        score += 20
        risk_factors.append("Архитектурный риск: Контракт является Proxy (код можно подменить).")
    else:
        safe_factors.append("Архитектура неизменна (не Proxy).")

    # 3. Рыночные риски (Ликвидность: max из GoPlus и DexScreener)
    total_liquidity_usd = 0.0
    if market_report and "metrics" in market_report:
        total_liquidity_usd = market_report["metrics"].get("raw_liquidity", 0.0)

    if total_liquidity_usd == 0.0:
        score += 50
        risk_factors.append("Риск ликвидности: Достоверные пулы обмена не найдены (Неизвестно или 0).")
    elif total_liquidity_usd < 10000.0:
        score += 25
        risk_factors.append(f"Рыночный риск: Критически низкая ликвидность пула (${total_liquidity_usd:,.2f}).")
    else:
        source_name = market_report.get("metrics", {}).get("source", "DEX/CEX")
        safe_factors.append(f"Здоровая ликвидность ({source_name}): ${total_liquidity_usd:,.2f}.")

    # 4. Поведенческие риски
    creator_pct = parse_goplus_float(goplus_data.get('creator_percent'), 100)
    owner_pct = parse_goplus_float(goplus_data.get('owner_percent'), 100)
    admin_holds = [pct for pct in (creator_pct, owner_pct) if pct is not None]

    if not admin_holds:
        score += 15
        risk_factors.append("Риск прозрачности: Баланс Создателя/Владельца скрыт (Неизвестно).")
    else:
        max_admin_hold = max(admin_holds)
        if max_admin_hold >= 20.0:
            score += 30
            risk_factors.append(f"Риск дампа: Создатель/Владелец удерживает огромную долю ({max_admin_hold:.2f}%).")
        elif max_admin_hold >= 10.0:
            score += 15
            risk_factors.append(f"Централизация: У Создателя сосредоточено {max_admin_hold:.2f}% токенов.")
        else:
            safe_factors.append(f"Децентрализация: у Создателя безопасная доля ({max_admin_hold:.2f}%).")

    whales_percent = whales_report.get('top_private_percent', 0)
    if whales_percent >= 80.0:
        score += 40
        risk_factors.append(f"Риск манипуляции: Топ-{whales_report['whales_counted']} частных кошельков держат {whales_percent}%.")
    elif whales_percent >= 50.0:
        score += 20
        risk_factors.append(f"Средний риск манипуляции: Крупная концентрация у китов ({whales_percent}%).")
    else:
        safe_factors.append(f"Распределение китов в норме ({whales_percent}%).")

    dev_dump_percent = dev_report.get('dumped_percent', 0)
    dev_impact_percent = dev_report.get('impact_percent', 0)

    if dev_report.get('dev_dump_risk') == True:
        score += 50
        risk_factors.append(f"Риск создателя: Разработчик уже слил {dev_dump_percent}% своих запасов (Урон рынку: {dev_impact_percent}%).")
    else:
        safe_factors.append("Разработчик не замечен в критическом сливе токенов.")

    # 5. Рыночная динамика
    if market_report:
        market_score = market_report.get('score', 0)
        score += market_score

        if market_report.get('warnings'):
            risk_factors.extend(market_report['warnings'])

        if market_score == 0 and market_report.get('status') != "Данные отсутствуют":
            safe_factors.append("Рыночная динамика стабильна (нет резких падений и аномальных объемов).")

    # --- ФИНАЛЬНЫЙ РАСЧЕТ ---
    final_score = min(score, 100)

    if final_score <= 20:
        risk_level = "LOW (Безопасно)"
    elif final_score <= 50:
        risk_level = "MEDIUM (Средний риск)"
    elif final_score <= 80:
        risk_level = "HIGH (Высокий риск)"
    else:
        risk_level = "CRITICAL (ОПАСНОСТЬ)"

    return {
        "score": final_score,
        "level": risk_level,
        "total_liquidity_usd": round(total_liquidity_usd, 2),
        "warnings": risk_factors,
        "safe_metrics": safe_factors,
        "market_data": market_report.get('metrics', {})
    }