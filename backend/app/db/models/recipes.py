# import uuid

# from app.db.base import Base
# from sqlalchemy.orm import Mapped, mapped_column
# from typing import Optional
# from sqlalchemy.dialects.postgresql import UUID

# class Recipes(Base):
#     __tablename__ = "recipes"

#     id: Mapped[uuid.UUID] = mapped_column(
#         UUID(as_uuid=True),
#         primary_key=True,
#         default=uuid.uuid4,
#     )
#     titulo: Mapped[str] = mapped_column(nullable=False)
#     porcoes: Mapped[int] = mapped_column(nulable=False, default=1)
#     tempo_preparo_min: Mapped[Optional[int]] = mapped_column(nullable=True, default=None)
#     origem: Mapped[Optional[str]] = mapped_column(nullable=True, default=None)
#     ingrediente: Mapped[Optional[str]] = mapped_column(foreign_key="ingredients.id", nullable=True, default=None)