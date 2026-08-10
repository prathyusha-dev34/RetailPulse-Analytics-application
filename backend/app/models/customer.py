
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
    # PRIMARY KEY
    # =====================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # =====================================================
    # COMPANY
    # =====================================================

    company_id = Column(
        Integer,
        ForeignKey(
            "companies.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    # =====================================================
    # CUSTOMER IDENTIFICATION
    # =====================================================

    customer_id = Column(
        String(30),
        nullable=False,
        index=True,
    )

    full_name = Column(
        String(200),
        nullable=False,
    )

    # =====================================================
    # CONTACT INFORMATION
    # =====================================================

    email = Column(
        String(255),
        nullable=True,
        index=True,
    )

    phone_number = Column(
        String(20),
        nullable=True,
        index=True,
    )

    # =====================================================
    # PERSONAL INFORMATION
    # =====================================================

    date_of_birth = Column(
        Date,
        nullable=True,
    )

    gender = Column(
        String(20),
        nullable=True,
    )

    # =====================================================
    # ADDRESS
    # =====================================================

    address = Column(
        String(500),
        nullable=True,
    )

    city = Column(
        String(100),
        nullable=True,
        index=True,
    )

    state = Column(
        String(100),
        nullable=True,
        index=True,
    )

    country = Column(
        String(100),
        nullable=True,
        index=True,
    )

    postal_code = Column(
        String(20),
        nullable=True,
    )

    # =====================================================
    # CUSTOMER DETAILS
    # =====================================================

    customer_type = Column(
        String(30),
        nullable=False,
        default="Regular",
    )

    preferred_sales_channel = Column(
        String(50),
        nullable=True,
    )

    status = Column(
        String(20),
        nullable=False,
        default="ACTIVE",
        index=True,
    )

    customer_segment = Column(
        String(30),
        nullable=False,
        default="New",
        index=True,
    )

    # =====================================================
    # PURCHASE ANALYTICS
    # =====================================================

    total_orders = Column(
        Integer,
        nullable=False,
        default=0,
    )

    total_quantity_purchased = Column(
        Integer,
        nullable=False,
        default=0,
    )

    lifetime_revenue = Column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
    )

    average_order_value = Column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
    )

    purchase_frequency = Column(
        Numeric(10, 2),
        nullable=False,
        default=Decimal("0.00"),
    )

    # =====================================================
    # PURCHASE DATES
    # =====================================================

    first_purchase_date = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    last_purchase_date = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    last_activity_date = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    # =====================================================
    # PRODUCT ANALYTICS
    # =====================================================

    favorite_product = Column(
        String(200),
        nullable=True,
    )

    favorite_category = Column(
        String(200),
        nullable=True,
    )

    is_vip = Column(
        String(5),
        nullable=False,
        default="No",
    )

    total_purchase_amount = Column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
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
        nullable=False,
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
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
    # SALES RELATIONSHIP
    #
    # IMPORTANT FIX
    #
    # Sale model has:
    #
    # customer = relationship(
    #     "Customer",
    #     back_populates="sales",
    #     foreign_keys=[customer_id],
    # )
    #
    # Therefore Customer must have:
    # sales = relationship(...)
    # =====================================================

    sales = relationship(
        "Sale",
        back_populates="customer",
        foreign_keys="Sale.customer_id",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    # =====================================================
    # HELPER PROPERTIES
    # =====================================================

    @property
    def is_active(self):
        return str(self.status).upper() == "ACTIVE"

    @property
    def customer_since(self):
        return self.created_at

    @property
    def average_spend(self):

        if not self.total_orders:
            return Decimal("0.00")

        return (
            Decimal(
                str(self.lifetime_revenue or 0)
            )
            / Decimal(self.total_orders)
        )

    # =====================================================
    # STATUS METHODS
    # =====================================================

    def activate(self):
        self.status = "ACTIVE"

    def deactivate(self):
        self.status = "INACTIVE"

    # =====================================================
    # CUSTOMER SEGMENT
    # =====================================================

    def update_segment(self):

        revenue = Decimal(
            str(self.lifetime_revenue or 0)
        )

        orders = self.total_orders or 0

        if (
            revenue >= Decimal("100000")
            or orders >= 100
        ):

            self.customer_segment = "VIP"
            self.is_vip = "Yes"

        elif (
            revenue >= Decimal("50000")
            or orders >= 50
        ):

            self.customer_segment = "Loyal"
            self.is_vip = "No"

        elif (
            revenue >= Decimal("10000")
            or orders >= 10
        ):

            self.customer_segment = "Regular"
            self.is_vip = "No"

        else:

            self.customer_segment = "New"
            self.is_vip = "No"

    # =====================================================
    # PURCHASE SUMMARY UPDATE
    # =====================================================

    def update_purchase_summary(
        self,
        amount,
        quantity,
        purchase_date=None,
    ):

        amount = Decimal(
            str(amount or 0)
        )

        quantity = int(
            quantity or 0
        )

        self.total_orders = (
            self.total_orders or 0
        ) + 1

        self.total_quantity_purchased = (
            self.total_quantity_purchased or 0
        ) + quantity

        self.lifetime_revenue = (
            Decimal(
                str(
                    self.lifetime_revenue or 0
                )
            )
            + amount
        )

        self.total_purchase_amount = (
            self.lifetime_revenue
        )

        if self.total_orders > 0:

            self.average_order_value = (
                self.lifetime_revenue
                / Decimal(self.total_orders)
            )

        else:

            self.average_order_value = (
                Decimal("0.00")
            )

        if purchase_date:

            if not self.first_purchase_date:
                self.first_purchase_date = purchase_date

            if (
                not self.last_purchase_date
                or purchase_date > self.last_purchase_date
            ):
                self.last_purchase_date = purchase_date

            self.last_activity_date = purchase_date

        self.update_segment()

    # =====================================================
    # STRING REPRESENTATION
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

