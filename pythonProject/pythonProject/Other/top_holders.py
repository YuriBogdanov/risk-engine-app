import requests


def get_top_token_holders(api_key, token_address):
    # 1. Формируем URL.
    # Используем f-строку (буква f перед кавычками), чтобы аккуратно вставить token_address прямо в текст ссылки
    url = f"https://deep-index.moralis.io/api/v2.2/erc20/{token_address}/owners"

    # 2. Заголовки (Headers)
    # Сюда передаем API-ключ точно под тем именем, которое указано в документации (X-API-Key)
    headers = {
        "X-API-Key": api_key
    }

    # 3. Параметры запроса (Query Parameters)
    params = {
        "chain": "eth",  # Указываем сеть (Ethereum)
        "order": "DESC",  # Сортировка по убыванию (сначала показываем кошельки с самым большим балансом)
        "limit": 10  # Ограничиваем выдачу до 10 записей (топ-10 китов)
    }

    try:
        # 4. Отправляем GET-запрос.
        # Обратите внимание: мы передаем и headers, и params как отдельные аргументы
        response = requests.get(url, headers=headers, params=params)

        # 5. Проверяем код 200 (Успех)
        if response.status_code == 200:
            data = response.json()

            # Извлекаем список холдеров (если списка нет, вернется пустой список [])
            owners_list = data.get("result", [])

            # Проходимся по списку и выводим нужные данные
            sum = 0
            for owner in owners_list:
                percent = owner.get("percentage_relative_to_total_supply", 0)
                sum += percent

            print(f"Топ 10:  {sum}% от всех токенов")

        else:
            # Если код не 200, выводим сам код и текст ошибки от сервера
            print(f"Ошибка API. Код: {response.status_code}")
            print(f"Ответ сервера: {response.text}")

    except Exception as e:
        print(f"Произошла ошибка соединения: {e}")


# --- Запуск скрипта ---

# Ваш API ключ от Moralis
MY_MORALIS_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjUyY2ZhM2VmLTQwNjItNDM2YS05OGFlLTA4MjQ3MTgxYTRkZiIsIm9yZ0lkIjoiNTA0MDE0IiwidXNlcklkIjoiNTE4NjEzIiwidHlwZUlkIjoiNjNkNjQ5ODItZDc5Ni00MjBmLTg5ZTQtMzQ2Y2E1NzBmNTkzIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NzI2NjEwMjgsImV4cCI6NDkyODQyMTAyOH0.mBTxd7C8apmpoT0dWbVXtIsRxZBzJ-rbOe1QwlI1U6I"

# Адрес смарт-контракта из вашего примера
TARGET_TOKEN = "0x00eef77c9696ae9f825de5f3fc99f5e28eb7a069"

get_top_token_holders(MY_MORALIS_KEY, TARGET_TOKEN)