import requests


def analyze_token_with_honeypot_is(token_address):
    url = "https://api.honeypot.is/v2/IsHoneypot"

    params = {
        "address": token_address
    }

    print(f"Анализируем токен {token_address}")

    try:
        response = requests.get(url, params=params)

        if response.status_code == 200:
            data = response.json()

            # 1. Извлекаем сводку по рискам (Risk Score)
            summary = data.get("summary", {})
            risk_text = summary.get("risk", "unknown")

            # Обрабатываем ситуацию с unknown (как указано в документации, там нет riskLevel)
            # Если riskLevel нет, ставим -1 для удобства обработки на фронтенде
            risk_level = summary.get("riskLevel", -1)

            # 2. Результат симуляции обмена
            honeypot_result = data.get("honeypotResult", {})
            is_honeypot = honeypot_result.get("isHoneypot", False)

            sim_result = data.get("simulationResult", {})
            buy_tax = sim_result.get("buyTax", 0)
            sell_tax = sim_result.get("sellTax", 0)

            # 3. Данные пула ликвидности
            pair_data = data.get("pair", {})
            liquidity_usd = pair_data.get("liquidity", 0)

            # Формируем красивый итоговый словарь для нашего бэкенда
            result = {
                "address": token_address,
                "is_honeypot": is_honeypot,
                "risk_score": risk_level,
                "risk_category": risk_text,
                "buy_tax_percent": buy_tax,
                "sell_tax_percent": sell_tax,
                "liquidity_usd": round(liquidity_usd, 2) if liquidity_usd else 0
            }

            return result

        else:
            print(f"Ошибка API. Статус: {response.status_code}")
            return None

    except Exception as e:
        print(f"Произошла ошибка: {e}")
        return None


# --- Тестируем скрипт ---

# Вставляем адрес из примера (USDC)
#USDC_ADDRESS = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
GNZ_ADRESS = "0xBC548BF4b646A690B1C559CF22feff7968db7a1A"

analysis = analyze_token_with_honeypot_is(GNZ_ADRESS)

if analysis:
    print("-" * 30)
    print("Результаты анализа:")
    print(f"Скам (Honeypot): {'Да 🚨' if analysis['is_honeypot'] else 'Нет ✅'}")
    print(f"Risk Score (0-100): {analysis['risk_score']} ({analysis['risk_category']})")
    print(f"Налог на покупку: {analysis['buy_tax_percent']}%")
    print(f"Налог на продажу: {analysis['sell_tax_percent']}%")
    print(f"Ликвидность пула: ${analysis['liquidity_usd']:,.2f}")