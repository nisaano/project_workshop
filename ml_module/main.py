from fastapi import FastAPI
from pydantic import BaseModel
from text_enhancer import enhance

app = FastAPI()

class Item(BaseModel):
    text: str

@app.post("/enhance")
def enhance_text(item: Item):
    enhanced = enhance(item.text)
    return {"enhanced": enhanced}
