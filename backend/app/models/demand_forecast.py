from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    Numeric,
    Date,
)

from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class DemandForecast(Base):

    __tablename__ = "demand_forecasts"


    __table_args__ = (

        UniqueConstraint(
            "company_id",
            "product_id",
            "forecast_period",
            name="uq_company_product_forecast_period",
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
    # PRODUCT
    # =====================================================

    product_id = Column(

        Integer,

        ForeignKey(
            "products.id",
            ondelete="CASCADE",
        ),

        nullable=False,

        index=True,

    )


    # =====================================================
    # CATEGORY
    # =====================================================

    category_id = Column(

        Integer,

        ForeignKey(
            "categories.id",
            ondelete="CASCADE",
        ),

        nullable=False,

        index=True,

    )


    # =====================================================
    # FORECAST PERIOD
    # =====================================================

    forecast_period = Column(

        String(30),

        nullable=False,

        index=True,

    )


    # CUSTOM DATE RANGE SUPPORT

    start_date = Column(

        Date,

        nullable=True,

    )


    end_date = Column(

        Date,

        nullable=True,

    )


    # =====================================================
    # SALES DATA
    # =====================================================

    historical_sales = Column(

        Integer,

        nullable=False,

        default=0,

    )


    predicted_demand = Column(

        Integer,

        nullable=False,

        default=0,

    )


    # =====================================================
    # ANALYTICS
    # =====================================================

    expected_growth_percentage = Column(

        Float,

        nullable=False,

        default=0,

    )


    confidence_score = Column(

        Float,

        nullable=False,

        default=0,

    )


    forecast_accuracy = Column(

        Float,

        nullable=False,

        default=0,

    )


    # =====================================================
    # INVENTORY DATA
    # =====================================================

    current_stock = Column(

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


    # =====================================================
    # RECOMMENDATION
    # =====================================================

    recommendation = Column(

        String(100),

        nullable=False,

        default="Stock Level Healthy",

    )


    # =====================================================
    # VALUE
    # =====================================================

    forecast_value = Column(

        Numeric(
            12,
            2
        ),

        nullable=False,

        default=0,

    )


    # =====================================================
    # TIMESTAMPS
    # =====================================================

    generated_at = Column(

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

        back_populates="demand_forecasts",

    )


    product = relationship(

        "Product",

        back_populates="demand_forecasts",

    )


    category = relationship(

        "Category",

        back_populates="demand_forecasts",

    )


    history = relationship(

        "ForecastHistory",

        back_populates="forecast",

        cascade="all, delete-orphan",

    )