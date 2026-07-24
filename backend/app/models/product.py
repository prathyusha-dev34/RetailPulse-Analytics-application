from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Numeric,
    DateTime,
    ForeignKey,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)

    company_id = Column(
        Integer,
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    category_id = Column(
        Integer,
        ForeignKey("categories.id", ondelete="CASCADE"),
        nullable=False,
    )

    name = Column(
        String(200),
        nullable=False,
    )

    sku = Column(
        String(100),
        nullable=False,
    )

    brand = Column(
        String(100),
        nullable=True,
    )

    description = Column(
        Text,
        nullable=True,
    )

    unit_price = Column(
        Numeric(10, 2),
        nullable=False,
    )

    cost_price = Column(
        Numeric(10, 2),
        nullable=False,
    )

    stock_quantity = Column(
        Integer,
        nullable=False,
        default=0,
    )

    unit_of_measure = Column(
        String(50),
        nullable=False,
    )

    status = Column(
        String(20),
        nullable=False,
        default="ACTIVE",
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    company = relationship(
        "Company",
        back_populates="products",
    )

    category = relationship(
        "Category",
        back_populates="products",
    )

    sale_items = relationship(
        "SaleItem",
        back_populates="product",
        cascade="all, delete-orphan",
    )

    inventory = relationship(
        "Inventory",
        back_populates="product",
        uselist=False,
        cascade="all, delete-orphan",
    )