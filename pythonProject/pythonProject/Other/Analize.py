class TokenRiskAnalyzer:
    def __init__(self, contract_data, market_data, holders_data):
        """
        Инициализируем класс сырыми данными из разных источников.
        contract_data: данные от GoPlus / Honeypot.is (mint, blacklist, proxy и тд)
        market_data: данные о ликвидности и налогах (Honeypot.is / Dexscreener)
        holders_data: данные от вашего скрипта (процент у топ-10 холдеров)
        """
        self.contract_data = contract_data
        self.market_data = market_data
        self.holders_data = holders_data
        self.risk_score = 0
        self.risk_factors = []  # Сюда будем складывать причины штрафов для отчета

    def _add_penalty(self, points, reason):
        """Добавляет штрафные баллы и записывает причину."""
        self.risk_score += points
        self.risk_factors.append({"penalty": points, "reason": reason})

    def calculate_score(self):
        # 1. Проверка на критические угрозы (Сразу 100 баллов)
        if self.contract_data.get("is_honeypot"):
            self._add_penalty(100, "Критический риск: Токен является Honeypot (невозможно продать).")
            return self._finalize_score()

        # Проверка налогов
        buy_tax = self.market_data.get("buy_tax", 0)
        sell_tax = self.market_data.get("sell_tax", 0)
        max_tax = max(buy_tax, sell_tax)

        if max_tax >= 50:
            self._add_penalty(100, f"Критический риск: Экстремальный налог ({max_tax}%).")
            return self._finalize_score()

        # 2. Уязвимости контракта
        if self.contract_data.get("is_mintable"):
            self._add_penalty(30, "Риск инфляции: Владелец может выпускать новые токены (Mint).")

        if self.contract_data.get("is_blacklisted"):
            self._add_penalty(20, "Риск цензуры: Владелец может блокировать кошельки пользователей.")

        if 10 <= max_tax < 50:
            self._add_penalty(15, f"Финансовый риск: Высокие комиссии контракта (Налог: {max_tax}%).")

        # 3. Анализ холдеров (Ваш алгоритм)
        top_10_percentage = self.holders_data.get("top_10_percentage", 0)
        if top_10_percentage >= 80:
            self._add_penalty(40, f"Риск манипуляции: Топ-10 кошельков контролируют {top_10_percentage}% токенов.")
        elif top_10_percentage >= 50:
            self._add_penalty(20, f"Риск манипуляции: Высокая концентрация токенов у китов ({top_10_percentage}%).")

        # 4. Анализ ликвидности
        liquidity = self.market_data.get("liquidity_usd", 0)
        if liquidity < 10000:
            self._add_penalty(25, f"Рыночный риск: Критически низкая ликвидность пула (${liquidity}).")

        return self._finalize_score()

    def _finalize_score(self):
        # Ограничиваем максимальный балл до 100
        final_score = min(self.risk_score, 100)

        # Определяем цветовую категорию
        if final_score <= 20:
            level = "Зеленый (Низкий риск)"
        elif final_score <= 50:
            level = "Желтый (Средний риск)"
        else:
            level = "Красный (Высокий риск)"

        return {
            "total_risk_score": final_score,
            "risk_level": level,
            "detailed_factors": self.risk_factors
        }


# === Пример использования ===
# Представим, что эти словари вернули ваши скрипты (GoPlus, Honeypot.is, Moralis)
mock_contract = {"is_honeypot": False, "is_mintable": True, "is_blacklisted": False}
mock_market = {"buy_tax": 5, "sell_tax": 5, "liquidity_usd": 50000}
mock_holders = {"top_10_percentage": 55}

analyzer = TokenRiskAnalyzer(mock_contract, mock_market, mock_holders)
result = analyzer.calculate_score()

print(f"Итоговый Score: {result['total_risk_score']}/100")
print(f"Уровень: {result['risk_level']}")
print("Найденные проблемы:")
for factor in result['detailed_factors']:
    print(f"- [+{(factor['penalty'])}] {factor['reason']}")