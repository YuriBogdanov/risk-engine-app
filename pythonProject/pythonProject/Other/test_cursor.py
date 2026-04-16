import requests
import time  # Понадобится для создания пауз между запросами


def get_all_token_holders(api_key, token_address):
    url = f"https://deep-index.moralis.io/api/v2.2/erc20/{token_address}/owners"
    headers = {
        "X-API-Key": api_key
    }

    # Стартовые параметры. Обратите внимание: здесь пока нет ключа "cursor"
    params = {
        "chain": "eth",
        "order": "DESC",
        "limit": 100  # Увеличим лимит до 100, чтобы скачивать быстрее
    }

    all_holders = []  # Создаем пустой список, куда будем складывать всех найденных холдеров
    page_number = 1

    print(f"Начинаем скачивание холдеров для {token_address}...")

    # Запускаем цикл
    while True:
        print(f"Запрашиваем страницу {page_number}...")

        try:
            response = requests.get(url, headers=headers, params=params)

            if response.status_code == 200:
                data = response.json()

                # Достаем список холдеров с текущей страницы
                current_page_holders = data.get("result", [])

                # Добавляем их в наш общий список.
                # Метод .extend() склеивает списки, в отличие от .append(), который вложил бы список в список
                all_holders.extend(current_page_holders)

                # Самое важное: ищем курсор в ответе сервера
                cursor = data.get("cursor")

                # Если курсор есть и он не пустой (не None)
                if cursor:
                    # Добавляем или обновляем курсор в наших параметрах для следующего витка цикла
                    params["cursor"] = cursor
                    page_number += 1

                    # Делаем паузу в полсекунды.
                    # Это правило хорошего тона и защита от блокировки (Rate Limit) бесплатного API
                    time.sleep(0.5)
                else:
                    # Если курсора нет, значит сервер отдал нам последнюю страницу. Тормозим цикл!
                    print("Достигнут конец списка. Все данные загружены.")
                    break

            else:
                print(f"Ошибка API на странице {page_number}. Код: {response.status_code}")
                print(response.text)
                break  # Прерываем цикл в случае ошибки сервера

        except Exception as e:
            print(f"Произошла ошибка соединения: {e}")
            break

    # Возвращаем итоговый огромный список
    return all_holders


# --- Запуск скрипта ---

MY_MORALIS_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjUyY2ZhM2VmLTQwNjItNDM2YS05OGFlLTA4MjQ3MTgxYTRkZiIsIm9yZ0lkIjoiNTA0MDE0IiwidXNlcklkIjoiNTE4NjEzIiwidHlwZUlkIjoiNjNkNjQ5ODItZDc5Ni00MjBmLTg5ZTQtMzQ2Y2E1NzBmNTkzIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NzI2NjEwMjgsImV4cCI6NDkyODQyMTAyOH0.mBTxd7C8apmpoT0dWbVXtIsRxZBzJ-rbOe1QwlI1U6I"
TARGET_TOKEN = "0x6982508145454ce325ddbe47a25d4ec3d2311933"

# Сохраняем результат работы функции в переменную
total_holders_data = get_all_token_holders(MY_MORALIS_KEY, TARGET_TOKEN)

print("-" * 30)
print(f"Успешно скачано записей: {len(total_holders_data)}")

# Для примера выведем баланс самого первого и самого последнего холдера из нашего списка
if total_holders_data:
    print(f"Баланс ТОП-1 кита: {total_holders_data[0].get('balance_formatted')} токенов")
    print(f"Баланс самого мелкого холдера: {total_holders_data[-1].get('balance_formatted')} токенов")