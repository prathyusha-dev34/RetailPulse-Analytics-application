from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    company_id = Column(
        Integer,
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
    )

    name = Column(String, nullable=False)

    email = Column(String, nullable=False, unique=True)

    password = Column(String, nullable=False)

    role = Column(String, default="COMPANY_ADMIN")

    status = Column(String, default="ACTIVE")

    last_login = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    company = relationship(
        "Company",
        back_populates="users",
    )

    sales = relationship(
        "Sale",
        back_populates="user",
        cascade="all, delete-orphan",
    )