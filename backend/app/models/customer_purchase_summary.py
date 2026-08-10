from decimal import Decimal

from sqlalchemy import (
    Column,
    Integer,
    Numeric,
    String,
    DateTime,
    ForeignKey,
    JSON,
)

from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class CustomerPurchaseSummary(Base):

    __tablename__ = "customer_purchase_summary"

    # =====================================================
    # PRIMARY KEY
    # =====================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # =====================================================
    # CUSTOMER RELATION
    # =====================================================

    customer_id = Column(
        Integer,
        ForeignKey(
            "customers.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        unique=True,
        index=True,
    )

    # =====================================================
    # PURCHASE METRICS
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

    total_revenue = Column(
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
    # PRODUCT INSIGHTS
    # =====================================================

    favorite_product = Column(
        String(200),
        nullable=True,
    )

    favorite_category = Column(
        String(200),
        nullable=True,
    )

    most_purchased_product = Column(
        String(200),
        nullable=True,
    )

    most_purchased_category = Column(
        String(200),
        nullable=True,
    )

    product_frequency = Column(
        JSON,
        default=dict,
    )

    category_frequency = Column(
        JSON,
        default=dict,
    )

    # =====================================================
    # RECENT TRANSACTION
    # =====================================================

    recent_transaction_invoice = Column(
        String(50),
        nullable=True,
    )

    recent_transaction_amount = Column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
    )

    recent_transaction_date = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    # =====================================================
    # SEGMENTATION
    # =====================================================

    customer_segment = Column(
        String(30),
        nullable=False,
        default="New",
        index=True,
    )

    is_vip = Column(
        String(5),
        nullable=False,
        default="No",
        index=True,
    )

    # =====================================================
    # AUDIT
    # =====================================================

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
    # RELATIONSHIP
    # =====================================================

    customer = relationship(
        "Customer",
        back_populates="purchase_summary",
    )

    # =====================================================
    # AVERAGE ORDER VALUE
    # =====================================================

    def calculate_average_order_value(self):

        if not self.total_orders:

            self.average_order_value = Decimal(
                "0.00"
            )

            return

        self.average_order_value = (

            Decimal(
                str(
                    self.total_revenue or 0
                )
            )

            /

            Decimal(
                self.total_orders
            )

        ).quantize(
            Decimal("0.01")
        )

    # =====================================================
    # PURCHASE FREQUENCY
    # =====================================================

    def calculate_purchase_frequency(self):

        if (
            not self.first_purchase_date
            or not self.last_purchase_date
            or self.total_orders <= 1
        ):

            self.purchase_frequency = Decimal(
                "0.00"
            )

            return

        days = (
            self.last_purchase_date
            -
            self.first_purchase_date
        ).days

        if days <= 0:

            self.purchase_frequency = Decimal(
                str(
                    self.total_orders
                )
            )

            return

        self.purchase_frequency = (

            Decimal(
                self.total_orders
            )

            /

            Decimal(days)

        ).quantize(
            Decimal("0.01")
        )

    # =====================================================
    # CUSTOMER SEGMENTATION
    # =====================================================

    def update_segment(self):

        revenue = Decimal(
            str(
                self.total_revenue or 0
            )
        )

        orders = (
            self.total_orders or 0
        )

        # VIP
        if (
            revenue >= Decimal("100000")
            or orders >= 100
        ):

            self.customer_segment = "VIP"
            self.is_vip = "Yes"

        # LOYAL
        elif (
            revenue >= Decimal("50000")
            or orders >= 50
        ):

            self.customer_segment = "Loyal"
            self.is_vip = "No"

        # REGULAR
        elif (
            revenue >= Decimal("10000")
            or orders >= 10
        ):

            self.customer_segment = "Regular"
            self.is_vip = "No"

        # NEW
        else:

            self.customer_segment = "New"
            self.is_vip = "No"

    # =====================================================
    # ADD PURCHASE
    # =====================================================

    def add_purchase(
        self,
        amount,
        quantity,
        invoice_number=None,
        purchase_date=None,
    ):

        amount = Decimal(
            str(amount or 0)
        )

        quantity = int(
            quantity or 0
        )

        # ---------------------------------------------
        # PURCHASE TOTALS
        # ---------------------------------------------

        self.total_orders += 1

        self.total_quantity_purchased += (
            quantity
        )

        self.total_revenue += amount

        # ---------------------------------------------
        # AVERAGE ORDER VALUE
        # ---------------------------------------------

        self.calculate_average_order_value()

        # ---------------------------------------------
        # RECENT TRANSACTION
        # ---------------------------------------------

        self.recent_transaction_invoice = (
            invoice_number
        )

        self.recent_transaction_amount = (
            amount
        )

        if purchase_date:

            self.recent_transaction_date = (
                purchase_date
            )

            self.last_activity_date = (
                purchase_date
            )

            # First purchase
            if not self.first_purchase_date:

                self.first_purchase_date = (
                    purchase_date
                )

            # Latest purchase
            if (
                not self.last_purchase_date
                or
                purchase_date >
                self.last_purchase_date
            ):

                self.last_purchase_date = (
                    purchase_date
                )

        # ---------------------------------------------
        # PURCHASE FREQUENCY
        # ---------------------------------------------

        self.calculate_purchase_frequency()

        # ---------------------------------------------
        # CUSTOMER SEGMENT
        # ---------------------------------------------

        self.update_segment()

    # =====================================================
    # REPRESENTATION
    # =====================================================

    def __repr__(self):

        return (
            f"<CustomerPurchaseSummary("
            f"customer_id={self.customer_id}, "
            f"orders={self.total_orders}, "
            f"revenue={self.total_revenue}"
            f")>"
        )