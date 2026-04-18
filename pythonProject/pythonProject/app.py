from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel  # <-- ДОБАВЛЕНО: Для обработки POST-запросов от React

# ИМПОРТЫ ИЗ ПАПКИ SERVICES
from main_1 import run_diploma_analyzer
from services.portfolio_builder import build_user_portfolio

# ДОБАВЛЕНО: Импортируем функции для боевых транзакций из провайдера 1inch
from providers.aggregator_api import get_approve_transaction, get_swap_transaction

app = FastAPI(title="RiskEngine API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# === СТАРЫЕ ЭНДПОИНТЫ ===

@app.get("/api/assets/{chain_id}/{wallet_address}")
def fetch_assets(chain_id: str, wallet_address: str):
    print(f"Запрос балансов для: {wallet_address} в сети {chain_id}")
    portfolio = build_user_portfolio(chain_id, wallet_address)
    return {"status": "success", "assets": portfolio}


@app.get("/api/analyze/{chain_id}/{token_address}")
def analyze_token(chain_id: str, token_address: str):
    print(f"Запуск глубокого анализа для токена: {token_address}")
    try:
        report = run_diploma_analyzer(chain_id, token_address, amount_to_spend_usd=10)
        if not report:
            raise HTTPException(status_code=400, detail="Не удалось собрать данные о токене")
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# === НОВЫЕ ЭНДПОИНТЫ ДЛЯ СВАПОВ (1INCH) ===

# Модель того, что мы ждем от React (POST-запрос)
class SwapRequest(BaseModel):
    chainId: str
    fromToken: str
    toToken: str
    amountWei: str
    userWallet: str


@app.post("/api/build-approve")
def build_approve(req: SwapRequest):
    """
    Эндпоинт 1: Формирует транзакцию разрешения (Approve).
    Если пользователь продает нативный BNB (адрес 0xeeee...), Approve не нужен.
    """
    print(f"Запрос Approve для {req.fromToken} на сумму {req.amountWei}")

    # 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee - стандартный адрес нативных монет в 1inch
    if req.fromToken.lower() == "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee":
        return {"needsApprove": False}

    tx_data = get_approve_transaction(req.chainId, req.fromToken, req.amountWei)
    if tx_data:
        return {"needsApprove": True, "tx": tx_data}

    raise HTTPException(status_code=400, detail="Ошибка при формировании транзакции Approve")


@app.post("/api/build-swap")
def build_swap(req: SwapRequest):
    """
    Эндпоинт 2: Формирует саму транзакцию обмена (Swap).
    """
    print(f"Запрос Swap: {req.fromToken} -> {req.toToken} от {req.userWallet}")

    tx_data = get_swap_transaction(req.chainId, req.fromToken, req.toToken, req.amountWei, req.userWallet)
    if tx_data:
        return {"tx": tx_data}

    raise HTTPException(status_code=400, detail="Ошибка при формировании маршрута обмена")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)