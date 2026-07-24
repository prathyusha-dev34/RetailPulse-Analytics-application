from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Text,
)

from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class InventoryMovement(Base):

    __tablename__ = "inventory_movements"


    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )


    inventory_id = Column(
        Integer,
        ForeignKey(
            "inventory.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True,
    )


    movement_type = Column(
        String(50),
        nullable=False,
    )


    quantity_changed = Column(
        Integer,
        nullable=False,
    )


    previous_quantity = Column(
        Integer,
        nullable=False,
    )


    updated_quantity = Column(
        Integer,
        nullable=False,
    )


    reason = Column(
        String(255),
        nullable=False,
    )


    remarks = Column(
        Text,
        nullable=True,
    )


    performed_by = Column(
        Integer,
        ForeignKey(
            "users.id"
        ),
        nullable=False,
        index=True,
    )


    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )


    inventory = relationship(
        "Inventory",
        back_populates="movements",
    )


    user = relationship(
        "User"
    )