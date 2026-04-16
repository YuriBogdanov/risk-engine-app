import requests


def get_clean_token_info(chain_id, token_address):
    # 1. Формируем URL.
    # Используем f-строку (буква f перед кавычками), чтобы аккуратно вставить token_address прямо в текст ссылки
    url = f"https://api.gopluslabs.io/api/v1/token_security/{chain_id}?contract_addresses={token_address}"

    # 2. Заголовки (Headers)
    # Сюда передаем API-ключ точно под тем именем, которое указано в документации (X-API-Key)
    headers = {
        "accept": "*/*"
    }

    try:
        # 4. Отправляем GET-запрос.
        # Обратите внимание: мы передаем и headers, и params как отдельные аргументы
        response = requests.get(url, headers=headers)

        # 5. Проверяем код 200 (Успех)
        if response.status_code == 200:
            data = response.json()

            # Извлекаем список холдеров (если списка нет, вернется пустой список [])
            result_block = data.get("result", {})

            # 3. Идем ВГЛУБЬ: достаем данные именно по нашему токену
            # Важно привести адрес к нижнему регистру, так как GoPlus возвращает их в lower case
            token_data = result_block.get(token_address.lower(), {})

            if not token_data:
                print("Данные по токену не найдены в ответе")
                return None

            # --- 4. Теперь просто забираем нужные плоские метрики ---

            # GoPlus возвращает цифры в виде строк ('0' или '1').
            # Сразу превращаем их в целые числа (int) или булевы значения (True/False) для удобства
            is_honeypot = token_data.get('is_honeypot') == '1'
            is_mintable = token_data.get('is_mintable') == '1'
            is_blacklisted = token_data.get('is_blacklisted') == '1'
            transfer_pausable = token_data.get('transfer_pausable') == '1'

            buy_tax = float(token_data.get('buy_tax', 0))  # Налоги лучше во float
            sell_tax = float(token_data.get('sell_tax', 0))

            creator_percent = float(token_data.get('creator_percent', 0))

            # --- 5. Работа со СПИСКАМИ (Вот здесь нужен цикл) ---

            # Посчитаем общую ликвидность на всех биржах (DEX)
            dex_list = token_data.get('dex', [])
            total_liquidity_usd = 0.0

            for dex in dex_list:
                # Достаем ликвидность из каждой биржи и прибавляем к общей сумме
                liq_value = dex.get('liquidity', '0')
                total_liquidity_usd += float(liq_value)

            # --- АНАЛИЗ ХОЛДЕРОВ (Ваша авторская метрика) ---
            holders_list = token_data.get('holders', [])
            private_holders_percent = 0.0
            private_wallets_counted = 0

            for holder in holders_list:
                print("Зашли в холдеров")
                # Берем только частные кошельки (не контракты) и пропускаем нулевой адрес (сжигание)
                if holder.get('is_contract') == 0 and (holder.get(
                        'address') != '0x000000000000000000000000000000000000dead' or holder.get(
                        'address') != '0x0000000000000000000000000000000000000000'):
                    # Прибавляем процент этого холдера
                    percent = float(holder.get('percent', 0))
                    private_holders_percent += percent
                    private_wallets_counted += 1

                # Как только насчитали 10 частных китов — останавливаем цикл
                if private_wallets_counted == 10:
                    break

            top_10_private_percent = private_holders_percent * 100  # Переводим в привычные проценты

            # --- 6. Упаковываем все в красивый чистый словарь для нашего анализатора ---
            clean_data = {
                "address": token_address,
                "is_honeypot": is_honeypot,
                "is_mintable": is_mintable,
                "is_blacklisted": is_blacklisted,
                "is_pausable": transfer_pausable,
                "buy_tax_percent": buy_tax * 100,  # У GoPlus налоги идут в долях (0.01 = 1%), умножаем на 100
                "sell_tax_percent": sell_tax * 100,
                "creator_holds_percent": creator_percent * 100,
                "total_liquidity_usd": round(total_liquidity_usd, 2),
                # Добавляем вашу новую супер-метрику!
                "top_10_private_holders_percent": round(top_10_private_percent, 2),
                "is_whale_manipulation_risk": top_10_private_percent >= 80.0  # Тот самый Red Flag!
            }

            return clean_data

        else:
            # Если код не 200, выводим сам код и текст ошибки от сервера
            print(f"Ошибка API. Код: {response.status_code}")
            print(f"Ответ сервера: {response.text}")

    except Exception as e:
        print(f"Произошла ошибка соединения: {e}")


# --- Запуск скрипта ---

chain_id = "56"
token_address = "0x02f4ff0b6e4f2aee8af704b074913893520c4444"

clean_token_info = get_clean_token_info(chain_id, token_address)

if clean_token_info:
    print("Успешно распаковано!")
    print(f"Ханипот: {clean_token_info['is_honeypot']}")
    print(f"Можно ли чеканить (Mint): {clean_token_info['is_mintable']}")
    print(f"Общая ликвидность на DEX: ${clean_token_info['total_liquidity_usd']:,.2f}")
    print(f"Процент топ-10 частных холдеров: {clean_token_info['top_10_private_holders_percent']}")
    print(f"Есть риск манипуляции ценой: {clean_token_info['is_whale_manipulation_risk']}")