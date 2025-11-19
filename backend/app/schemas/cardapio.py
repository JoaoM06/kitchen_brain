from pydantic import BaseModel, EmailStr, Field

class CardapioInput(BaseModel):
    cardapio: str