from sqlalchemy import (
    Column,
    Integer,
    Numeric,
    ForeignKey,
    CheckConstraint,
)

from sqlalchemy.orm import relationship

from app.core.database import Base



class SaleItem(Base):

    __tablename__ = "sale_items"



    __table_args__ = (

        CheckConstraint(
            "quantity > 0",
            name="check_sale_quantity_positive"
        ),


        CheckConstraint(
            "unit_price >= 0",
            name="check_sale_unit_price_positive"
        ),


        CheckConstraint(
            "discount >= 0",
            name="check_sale_discount_positive"
        ),


        CheckConstraint(
            "tax >= 0",
            name="check_sale_tax_positive"
        ),

    )



    id = Column(

        Integer,

        primary_key=True,

        index=True,

    )




    sale_id = Column(

        Integer,

        ForeignKey(
            "sales.id",
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

        index=True,

    )




    category_id = Column(

        Integer,

        ForeignKey(
            "categories.id",
            ondelete="CASCADE"
        ),

        nullable=False,

        index=True,

    )




    quantity = Column(

        Integer,

        nullable=False,

    )




    unit_price = Column(

        Numeric(10,2),

        nullable=False,

    )




    discount = Column(

        Numeric(10,2),

        nullable=False,

        default=0,

    )




    tax = Column(

        Numeric(10,2),

        nullable=False,

        default=0,

    )




    total = Column(

        Numeric(12,2),

        nullable=False,

    )




    # ------------------------------------------
    # Relationships
    # ------------------------------------------


    sale = relationship(

        "Sale",

        back_populates="items",

    )




    product = relationship(

        "Product",

    )




    category = relationship(

        "Category",

        back_populates="sales",

    )