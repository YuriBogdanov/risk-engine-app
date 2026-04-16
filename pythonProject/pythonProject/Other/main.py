import json
# Импортируем наши инструменты из папок (убедитесь, что у вас правильные названия функций в ваших файлах)
from providers.goplus_api import get_clean_token_info
from providers.moralis_api import get_top_token_holders
from services.risk_analyzer import calculate_whale_manipulation_risk

from providers.moralis_api import get_creator_token_transfers
from services.risk_analyzer import analyze_dev_dumping

def run_diploma_analyzer(chain_id, token_address):
    print("🚀 Старт анализатора...")

    # 1. Запрашиваем сырые данные у GoPlus
    goplus_raw = get_clean_token_info(chain_id, token_address)
    if not goplus_raw:
        print("❌ Ошибка: Нет данных от GoPlus.")
        return

    # 2. Запрашиваем сырые данные у Moralis
    moralis_holders = get_top_token_holders(chain_id, token_address)
    if not moralis_holders:
        print("❌ Ошибка: Нет данных от Moralis.")
        return

    # 3. Передаем оба куска данных в наш МОЗГ (Анализатор)
    # Важно: передаем именно блок с данными токена от GoPlus, а не весь JSON с 'code' и 'message'
    # Предполагается, что get_goplus_data вернул блок result[token_address]

    risk_report = calculate_whale_manipulation_risk(goplus_raw, moralis_holders)

    # 4. Вывод итогового результата
    print("\n🏁 Финальный JSON-отчет для Фронтенда:")
    print(json.dumps(risk_report, indent=4, ensure_ascii=False))

def run_dev_dump(chain_id, token_address):
    print("🚀 Старт анализатора...")

    # 1. Запрашиваем сырые данные у Moralis
    goplus_raw = get_clean_token_info(chain_id, token_address)
    if not goplus_raw:
        print("❌ Ошибка: Нет данных от GoPlus.")
        return

    # 2. Запрашиваем сырые данные у Moralis
    # ДОСТАЕМ АДРЕС СОЗДАТЕЛЯ (Именно его нам не хватало!)
    creator_address = goplus_raw.get('creator_address')
    if not creator_address:
        print("❌ Ошибка: GoPlus не вернул адрес создателя.")
        return
    # 2. Запрашиваем транзакции создателя у Moralis (Передаем все 3 аргумента)
    moralis_creator_transfers = get_creator_token_transfers(chain_id, creator_address, token_address)

    # 3. Передаем оба куска данных в наш МОЗГ (Анализатор)
    # Важно: передаем именно блок с данными токена от GoPlus, а не весь JSON с 'code' и 'message'
    # Предполагается, что get_goplus_data вернул блок result[token_address]

    risk_report = analyze_dev_dumping(goplus_raw, moralis_creator_transfers)

    # 4. Вывод итогового результата
    print("\n🏁 Финальный JSON-отчет для Фронтенда:")
    print(json.dumps(risk_report, indent=4, ensure_ascii=False))

# Запускаем программу!
if __name__ == "__main__":
    test_chain = "56"
    test_token = "0x02f4ff0b6e4f2aee8af704b074913893520c4444"
    run_diploma_analyzer(test_chain, test_token)
    run_dev_dump(test_chain, test_token)