from sqlalchemy import (
    Column,
    Integer,
    Float,
    DateTime,
    ForeignKey,
)

from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class ForecastHistory(Base):

    __tablename__ = "forecast_history"


    id = Column(

        Integer,

        primary_key=True,

        index=True,

    )


    forecast_id = Column(

        Integer,

        ForeignKey(

            "demand_forecasts.id",

            ondelete="CASCADE",

        ),

        nullable=False,

        index=True,

    )


    historical_sales = Column(

        Integer,

        nullable=False,

        default=0,

    )


    prediction = Column(

        Integer,

        nullable=False,

        default=0,

    )


    accuracy = Column(

        Float,

        nullable=False,

        default=0,

    )


    created_at = Column(

        DateTime(timezone=True),

        server_default=func.now(),

        nullable=False,

    )


    forecast = relationship(

        "DemandForecast",

        back_populates="history",

    )