
from sqlalchemy import (
    Column,
    Integer,
    String,
    Numeric,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    Boolean,
)

from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Sale(Base):

    __tablename__ = "sales"

    __table_args__ = (
        UniqueConstraint(
            "company_id",
            "invoice_number",
            name="unique_company_invoice",
        ),
    )

    # ========================================================
    # PRIMARY KEY
    # ========================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # ========================================================
    # COMPANY
    # ========================================================

    company_id = Column(
        Integer,
        ForeignKey(
            "companies.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    # ========================================================
    # CUSTOMER
    # ========================================================

    customer_id = Column(
        Integer,
        ForeignKey(
            "customers.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    # ========================================================
    # INVOICE NUMBER
    # ========================================================

    invoice_number = Column(
        String(50),
        nullable=False,
        index=True,
    )

    # ========================================================
    # CUSTOMER NAME SNAPSHOT
    # ========================================================

    customer_name = Column(
        String(200),
        nullable=False,
    )

    # ========================================================
    # SALE DATE
    # ========================================================

    sale_date = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    # ========================================================
    # SALES CHANNEL
    # ========================================================

    sales_channel = Column(
        String(50),
        nullable=False,
        default="STORE",
        server_default="STORE",
    )

    # ========================================================
    # PAYMENT METHOD
    # ========================================================

    payment_method = Column(
        String(50),
        nullable=False,
    )

    # ========================================================
    # PAYMENT STATUS
    # ========================================================

    payment_status = Column(
        String(30),
        nullable=False,
        default="PAID",
        server_default="PAID",
    )

    # ========================================================
    # TOTAL AMOUNT
    # ========================================================

    total_amount = Column(
        Numeric(12, 2),
        nullable=False,
        default=0,
        server_default="0",
    )

    # ========================================================
    # CREATED BY
    # ========================================================

    created_by = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    # ========================================================
    # SOFT DELETE
    # ========================================================

    is_deleted = Column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
        index=True,
    )

    # ========================================================
    # CREATED AT
    # ========================================================

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    # ========================================================
    # UPDATED AT
    # ========================================================

    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    # ========================================================
    # COMPANY RELATIONSHIP
    # ========================================================

    company = relationship(
        "Company",
        back_populates="sales",
    )

    # ========================================================
    # USER / SALESPERSON RELATIONSHIP
    # ========================================================

    user = relationship(
        "User",
        back_populates="sales",
        foreign_keys=[created_by],
    )

    # ========================================================
    # CUSTOMER RELATIONSHIP
    # ========================================================

    customer = relationship(
        "Customer",
        back_populates="sales",
        foreign_keys=[customer_id],
    )

    # ========================================================
    # SALE ITEMS
    # ========================================================

    items = relationship(
        "SaleItem",
        back_populates="sale",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

