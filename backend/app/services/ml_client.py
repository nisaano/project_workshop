import httpx

ML_MODULE_URL = "http://ml_module:8001"   # имя контейнера в docker-compose

async def enhance_text(text: str) -> str:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{ML_MODULE_URL}/enhance",
            json={"text": text},
            timeout=30
        )
        response.raise_for_status()
        return response.json()["enhanced"]
