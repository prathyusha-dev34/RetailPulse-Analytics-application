from decimal import Decimal

from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    DateTime,
    ForeignKey,
    Numeric,
    UniqueConstraint,
)

from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Customer(Base):

    __tablename__ = "customers"

    __table_args__ = (

        UniqueConstraint(
            "company_id",
            "customer_id",
            name="unique_company_customer_id",
        ),

        UniqueConstraint(
            "company_id",
            "email",
            name="unique_company_customer_email",
        ),

        UniqueConstraint(
            "company_id",
            "phone_number",
            name="unique_company_customer_phone",
        ),

    )

    # =====================================================
    # BASIC INFO
    # =====================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    company_id = Column(
        Integer,
        ForeignKey(
            "companies.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    customer_id = Column(
        String(30),
        nullable=False,
        index=True,
    )

    full_name = Column(
        String(200),
        nullable=False,
    )

    email = Column(
        String(255),
        nullable=False,
        index=True,
    )

    phone_number = Column(
        String(20),
        nullable=False,
        index=True,
    )

    date_of_birth = Column(Date)

    gender = Column(String(20))

    address = Column(String(500))

    city = Column(
        String(100),
        index=True,
    )

    state = Column(
        String(100),
        index=True,
    )

    country = Column(
        String(100),
        index=True,
    )

    postal_code = Column(String(20))

    # =====================================================
    # CUSTOMER DETAILS
    # =====================================================

    customer_type = Column(
        String(30),
        default="Retail",
        nullable=False,
    )

    preferred_sales_channel = Column(
        String(50)
    )

    status = Column(
        String(20),
        default="ACTIVE",
        nullable=False,
    )

    customer_segment = Column(
        String(30),
        default="New",
        nullable=False,
    )

    total_orders = Column(
        Integer,
        default=0,
        nullable=False,
    )

    total_quantity_purchased = Column(
        Integer,
        default=0,
        nullable=False,
    )

    lifetime_revenue = Column(
        Numeric(12, 2),
        default=Decimal("0.00"),
        nullable=False,
    )

    average_order_value = Column(
        Numeric(12, 2),
        default=Decimal("0.00"),
        nullable=False,
    )

    purchase_frequency = Column(
        Numeric(10, 2),
        default=Decimal("0.00"),
        nullable=False,
    )

    first_purchase_date = Column(
        DateTime(timezone=True)
    )

    last_purchase_date = Column(
        DateTime(timezone=True)
    )

    favorite_product = Column(
        String(200)
    )

    favorite_category = Column(
        String(200)
    )

    is_vip = Column(
        String(5),
        default="No",
        nullable=False,
    )

    # =====================================================
    # AUDIT
    # =====================================================

    created_by = Column(
        Integer,
        ForeignKey("users.id"),
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

    # =====================================================
    # RELATIONSHIPS
    # =====================================================

    company = relationship(
        "Company",
        back_populates="customers",
    )

    created_by_user = relationship(
        "User",
        foreign_keys=[created_by],
        back_populates="customers",
    )

    purchase_summary = relationship(
        "CustomerPurchaseSummary",
        back_populates="customer",
        uselist=False,
        cascade="all, delete-orphan",
    )

        # =====================================================
    # HELPER PROPERTIES
    # =====================================================

    @property
    def is_active(self):
        return self.status.upper() == "ACTIVE"

    @property
    def customer_since(self):
        return self.created_at

    @property
    def average_spend(self):
        if self.total_orders == 0:
            return Decimal("0.00")

        return self.lifetime_revenue / self.total_orders

    # =====================================================
    # STATUS METHODS
    # =====================================================

    def activate(self):
        self.status = "ACTIVE"

    def deactivate(self):
        self.status = "INACTIVE"

    # =====================================================
    # SEGMENT UPDATE
    # =====================================================

    def update_segment(self):

        revenue = float(self.lifetime_revenue or 0)
        orders = self.total_orders or 0

        if revenue >= 100000 or orders >= 100:
            self.customer_segment = "VIP"
            self.is_vip = "Yes"

        elif revenue >= 50000 or orders >= 50:
            self.customer_segment = "Loyal"
            self.is_vip = "No"

        elif revenue >= 10000 or orders >= 10:
            self.customer_segment = "Regular"
            self.is_vip = "No"

        else:
            self.customer_segment = "New"
            self.is_vip = "No"

    # =====================================================
    # PURCHASE SUMMARY
    # =====================================================

    def update_purchase_summary(
        self,
        amount,
        quantity,
    ):

        self.total_orders += 1
        self.total_quantity_purchased += quantity

        self.lifetime_revenue += Decimal(str(amount))

        self.average_order_value = (
            self.lifetime_revenue /
            self.total_orders
        )

        self.update_segment()

    # =====================================================
    # STRING
    # =====================================================

    def __repr__(self):

        return (
            f"<Customer("
            f"id={self.id}, "
            f"customer_id='{self.customer_id}', "
            f"name='{self.full_name}', "
            f"company_id={self.company_id}"
            f")>"
        )

    