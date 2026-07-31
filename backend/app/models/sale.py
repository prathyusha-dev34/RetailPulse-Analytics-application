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
            name="unique_company_invoice"
        ),

    )



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



    # FIX ADDED
    # Customer relation

    customer_id = Column(

        Integer,

        ForeignKey(
            "customers.id",
            ondelete="CASCADE"
        ),

        nullable=False,

        index=True,

    )



    invoice_number = Column(

        String(50),

        nullable=False,

        index=True,

    )



    customer_name = Column(

        String(200),

        nullable=False,

    )



    sale_date = Column(

        DateTime(timezone=True),

        nullable=False,

        server_default=func.now(),

    )



    sales_channel = Column(

        String(50),

        nullable=False,

    )



    payment_method = Column(

        String(50),

        nullable=False,

    )



    total_amount = Column(

        Numeric(12,2),

        nullable=False,

        default=0,

    )



    created_by = Column(

        Integer,

        ForeignKey(
            "users.id"
        ),

        nullable=False,

    )



    # FIX ADDED
    # soft delete support

    is_deleted = Column(

        Boolean,

        default=False,

        nullable=False,

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



    # =========================
    # RELATIONSHIPS
    # =========================


    company = relationship(

        "Company",

        back_populates="sales",

    )



    user = relationship(

        "User",

        back_populates="sales",

    )



    customer = relationship(

        "Customer",

    )



    items = relationship(

        "SaleItem",

        back_populates="sale",

        cascade="all, delete-orphan",

    )