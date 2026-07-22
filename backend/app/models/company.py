from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False, unique=True)

    industry = Column(String, nullable=False)

    email = Column(String, nullable=False, unique=True)

    address = Column(String, nullable=False)

    phone = Column(String, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    # Relationships
    users = relationship(
        "User",
        back_populates="company",
        cascade="all, delete-orphan",
    )

    categories = relationship(
        "Category",
        back_populates="company",
        cascade="all, delete-orphan",
    )

    products = relationship(
        "Product",
        back_populates="company",
        cascade="all, delete-orphan",
    )

    sales = relationship(
        "Sale",
        back_populates="company",
        cascade="all, delete-orphan",
    )