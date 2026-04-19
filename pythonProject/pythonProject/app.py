import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ИМПОРТЫ ИЗ ПАПКИ SERVICES
from main_1 import run_diploma_analyzer
from services.portfolio_builder import build_user_portfolio
from providers.aggregator_api import get_approve_transaction, get_swap_transaction, get_best_price_quote

app = FastAPI(title="RiskEngine API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# === СИСТЕМА КЭШИРОВАНИЯ ===
# Чтобы не спамить API (Moralis, GoPlus) при быстрой смене токенов
ANALYSIS_CACHE = {}
CACHE_TTL_SECONDS = 60  # Храним результат анализа 60 секунд


@app.get("/api/assets/{chain_id}/{wallet_address}")
def fetch_assets(chain_id: str, wallet_address: str):
    print(f"Запрос балансов для: {wallet_address} в сети {chain_id}")
    portfolio = build_user_portfolio(chain_id, wallet_address)
    return {"status": "success", "assets": portfolio}


@app.get("/api/analyze/{chain_id}/{token_address}")
def analyze_token(chain_id: str, token_address: str):
    cache_key = f"{chain_id}_{token_address.lower()}"
    current_time = time.time()

    # 1. Проверяем, есть ли свежие данные в кэше
    if cache_key in ANALYSIS_CACHE:
        cached_data = ANALYSIS_CACHE[cache_key]
        if current_time - cached_data["time"] < CACHE_TTL_SECONDS:
            print(f"⚡ Отдаем данные из кэша для токена: {token_address}")
            return cached_data["data"]

    # 2. Если в кэше нет, делаем полный запрос
    print(f"Запуск глубокого анализа для токена: {token_address}")
    try:
        report = run_diploma_analyzer(chain_id, token_address, amount_to_spend_usd=10)
        if not report:
            raise HTTPException(status_code=400, detail="Не удалось собрать данные о токене")

        # Записываем результат в кэш
        ANALYSIS_CACHE[cache_key] = {
            "time": current_time,
            "data": report
        }
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/quote")
def get_quote(chain_id: str, from_token: str, to_token: str, amount_wei: str):
    # Убрал print, чтобы не засорять консоль каждые 5 секунд при автообновлении
    report = get_best_price_quote(chain_id, from_token, to_token, amount_wei)
    if not report:
        return {"error": "Маршрут недоступен или недостаточно ликвидности"}
    return report


class SwapRequest(BaseModel):
    chainId: str
    fromToken: str
    toToken: str
    amountWei: str
    userWallet: str


@app.post("/api/build-approve")
def build_approve(req: SwapRequest):
    print(f"Запрос Approve для {req.fromToken} на сумму {req.amountWei}")
    if req.fromToken.lower() == "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee":
        return {"needsApprove": False}

    tx_data = get_approve_transaction(req.chainId, req.fromToken, req.amountWei)
    if tx_data:
        return {"needsApprove": True, "tx": tx_data}
    raise HTTPException(status_code=400, detail="Ошибка при формировании транзакции Approve")


@app.post("/api/build-swap")
def build_swap(req: SwapRequest):
    print(f"Запрос Swap: {req.fromToken} -> {req.toToken} от {req.userWallet}")
    tx_data = get_swap_transaction(req.chainId, req.fromToken, req.toToken, req.amountWei, req.userWallet)
    if tx_data:
        return {"tx": tx_data}
    raise HTTPException(status_code=400, detail="Ошибка при формировании маршрута обмена")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)