from decimal import Decimal


from sqlalchemy import (
    Column,
    Integer,
    Numeric,
    String,
    DateTime,
    ForeignKey,
)


from sqlalchemy.orm import relationship

from sqlalchemy.sql import func


from app.core.database import Base




class CustomerPurchaseSummary(Base):

    __tablename__ = "customer_purchase_summary"



    id = Column(

        Integer,

        primary_key=True,

        index=True,

    )



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

        Numeric(12,2),

        nullable=False,

        default=Decimal("0.00"),

    )



    average_order_value = Column(

        Numeric(12,2),

        nullable=False,

        default=Decimal("0.00"),

    )



    purchase_frequency = Column(

        Numeric(10,2),

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



    recent_transaction_invoice = Column(

        String(50),

        nullable=True,

    )



    recent_transaction_amount = Column(

        Numeric(12,2),

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
    # HELPER METHODS
    # =====================================================


    def calculate_average_order_value(self):


        if not self.total_orders or self.total_orders == 0:


            self.average_order_value = Decimal(
                "0.00"
            )


        else:


            self.average_order_value = (

                self.total_revenue /

                self.total_orders

            )




    # =====================================================
    # CUSTOMER SEGMENTATION
    # =====================================================


    def update_segment(self):


        revenue = float(
            self.total_revenue or 0
        )


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
    # PURCHASE UPDATE
    # =====================================================


    def add_purchase(

        self,

        amount,

        quantity,

        invoice_number=None,

        purchase_date=None,

    ):


        self.total_orders += 1


        self.total_quantity_purchased += quantity



        self.total_revenue += Decimal(
            str(amount)
        )



        self.calculate_average_order_value()



        self.recent_transaction_invoice = invoice_number


        self.recent_transaction_amount = Decimal(
            str(amount)
        )


        self.recent_transaction_date = purchase_date



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