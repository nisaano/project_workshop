import httpx

ML_URL = "http://ml_module:8001"  # имя контейнера ML в docker-compose

async def enhance_text(text: str) -> str:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{ML_URL}/enhance",
            json={"text": text},
            timeout=30
        )
        response.raise_for_status()
        return response.json()["enhanced"]
