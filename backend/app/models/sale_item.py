from sqlalchemy import (
    Column,
    Integer,
    Numeric,
    ForeignKey,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class SaleItem(Base):
    __tablename__ = "sale_items"

    # ============================================================
    # PRIMARY KEY
    # ============================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # ============================================================
    # SALE
    # ============================================================

    sale_id = Column(
        Integer,
        ForeignKey(
            "sales.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    sale = relationship(
        "Sale",
        back_populates="items",
    )

    # ============================================================
    # PRODUCT
    # ============================================================

    product_id = Column(
        Integer,
        ForeignKey(
            "products.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    product = relationship(
        "Product",
        back_populates="sale_items",
    )

    # ============================================================
    # CATEGORY
    # ============================================================

    category_id = Column(
        Integer,
        ForeignKey(
            "categories.id",
            ondelete="CASCADE",
        ),
        nullable=True,
        index=True,
    )

    category = relationship(
        "Category",
        back_populates="sales",
    )

    # ============================================================
    # SALE ITEM VALUES
    # ============================================================

    quantity = Column(
        Integer,
        nullable=False,
        default=1,
    )

    unit_price = Column(
        Numeric(
            12,
            2,
        ),
        nullable=False,
        default=0,
    )

    discount = Column(
        Numeric(
            12,
            2,
        ),
        nullable=False,
        default=0,
    )

    tax = Column(
        Numeric(
            12,
            2,
        ),
        nullable=False,
        default=0,
    )

    total = Column(
        Numeric(
            12,
            2,
        ),
        nullable=False,
        default=0,
    )

    # ============================================================
    # RESPONSE HELPER PROPERTIES
    # ============================================================

    @property
    def product_name(self):
        """
        Get product name from Product relationship.
        """
        if self.product:
            return self.product.name

        return None

    @property
    def sku(self):
        """
        Get SKU from Product relationship.
        """
        if self.product:
            return self.product.sku

        return None

    @property
    def category_name(self):
        """
        Get category name from Category relationship.
        """
        if self.category:
            return self.category.name

        # Fallback to Product category if SaleItem
        # category relationship is not available.
        if self.product and getattr(
            self.product,
            "category",
            None,
        ):
            return self.product.category.name

        return None