import requests


def get_clean_token_info(chain_id, token_address):
    """Выдает security данные от GoPlus API"""

    url = f"https://api.gopluslabs.io/api/v1/token_security/{chain_id}?contract_addresses={token_address}"

    headers = {
        "accept": "*/*"
    }

    try:
        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            data = response.json()

            result_block = data.get("result", {})

            # идем вглубь
            token_data = result_block.get(token_address.lower(), {})

            if not token_data:
                print("Данные по токену не найдены в ответе")
                return None

            return token_data

        else:
            print(f"Ошибка API. Код: {response.status_code}")
            print(f"Ответ сервера: {response.text}")

    except Exception as e:
        print(f"Произошла ошибка соединения: {e}")