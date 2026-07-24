from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
)

from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Inventory(Base):

    __tablename__ = "inventory"


    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )


    company_id = Column(
        Integer,
        ForeignKey(
            "companies.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True,
    )


    product_id = Column(
        Integer,
        ForeignKey(
            "products.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        unique=True,
        index=True,
    )


    current_stock = Column(
        Integer,
        nullable=False,
        default=0,
    )


    reserved_stock = Column(
        Integer,
        nullable=False,
        default=0,
    )


    available_stock = Column(
        Integer,
        nullable=False,
        default=0,
    )


    reorder_level = Column(
        Integer,
        nullable=False,
        default=10,
    )


    stock_status = Column(
        String(30),
        nullable=False,
        default="In Stock",
        index=True,
    )


    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


    company = relationship(
        "Company"
    )


    product = relationship(
        "Product",
        back_populates="inventory",
    )


    movements = relationship(
        "InventoryMovement",
        back_populates="inventory",
        cascade="all, delete-orphan",
    )