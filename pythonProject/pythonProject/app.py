from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# ИМПОРТЫ ИЗ ПАПКИ SERVICES
from main_1 import run_diploma_analyzer
from services.portfolio_builder import build_user_portfolio # <-- Импортируем наш новый Оркестратор

app = FastAPI(title="RiskEngine API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/assets/{chain_id}/{wallet_address}")
def fetch_assets(chain_id: str, wallet_address: str):
    print(f"Запрос балансов для: {wallet_address} в сети {chain_id}")

    # Теперь всю работу делает СЕРВИС, а не провайдер!
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)