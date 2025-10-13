from pydantic import BaseModel, EmailStr, Field

class LoginInput(BaseModel):
    email: EmailStr
    senha: str = Field(min_length=8)
    model_config = {"extra": "forbid"}

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
